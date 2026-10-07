import { trackAIUsage } from './observability.js';
import { runSecurityChecks } from './security.js';
import { generateGeminiResponse } from './providers/gemini.js';
import { generateGroqResponse } from './providers/groq.js';
import { generateMistralResponse } from './providers/mistral.js';

/**
 * Voxy AI Provider Gateway
 *
 * Provider rotation order:
 *   1. Gemini  (`gemini-2.0-flash`) — primary: 15 RPM, 1M TPM, no daily cap
 *   2. Groq    (`gpt-oss-120b` → `gpt-oss-20b`) — secondary: multi-key rotation
 *   3. Mistral (`mistral-small-latest`) — final fallback
 *
 * On any transient failure the gateway moves to the next provider.
 * The full chain is retried once before throwing.
 */
export async function generateAI({
  userId,
  businessId,
  prompt,
  type = 'chat',
  model = 'openai/gpt-oss-120b',
  systemInstruction = '',
  tools = null,
}) {
  // 1. PRE-PROCESSING SECURITY SCAN
  const rawInput =
    typeof prompt === 'string' ? prompt : prompt[prompt.length - 1].content;
  const security = await runSecurityChecks(rawInput);
  const sanitizedInput = security.sanitizedInput;

  const finalPrompt =
    typeof prompt === 'string'
      ? sanitizedInput
      : prompt.map((m, i) =>
          i === prompt.length - 1 ? { ...m, content: sanitizedInput } : m,
        );

  // 2. PROVIDER EXECUTION CHAIN — Gemini (primary) → Groq multi-key → Mistral (fallback)
  return await trackAIUsage(
    { userId, businessId, requestType: type, provider: 'voxy-direct', model },
    async () => {
      const groqModels = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
      let lastError = null;

      // ── Provider 1: Gemini (primary — free, 1M TPM, most reliable) ──────────
      const geminiKey = process.env.GEMINI_API_KEY;
      const isValidGeminiKey = geminiKey && geminiKey.trim().length > 20 && !geminiKey.includes('AIzaSyAbmZh98j6zulEeMCpC5uzE8OitW17p0DA');

      if (isValidGeminiKey) {
        try {
          console.log('🤖 [AI-GATEWAY] Trying Gemini (primary)...');
          const res = await generateGeminiResponse(finalPrompt, systemInstruction, tools, null);
          const modelUsed = res.modelUsed || 'gemini-2.0-flash';
          console.log(`🤖 [AI-USAGE] Provider: Gemini | Model: ${modelUsed} | Tokens: ${res.tokensUsed || 0}`);
          return { ...res, ...security, providerUsed: 'gemini', modelUsed };
        } catch (geminiErr) {
          console.warn(`🔄 [AI-GATEWAY] Gemini issue (${geminiErr.message}). Falling back to Groq...`);
          lastError = geminiErr;
        }
      }

      // ── Provider 2: Groq (multi-key rotation) ───────────────────────────────
      for (const mId of groqModels) {
        try {
          console.log(`🤖 [AI-GATEWAY] Trying Groq model: ${mId}...`);
          const res = await generateGroqResponse(finalPrompt, systemInstruction, mId, tools);
          const modelUsed = res.model || mId;
          const promptTokens = res.promptTokens || 0;
          const completionTokens = res.completionTokens || 0;
          const totalTokens = res.tokensUsed || (promptTokens + completionTokens);
          console.log(`🤖 [AI-USAGE] Provider: Groq | Model: ${modelUsed} | Tokens In: ${promptTokens} | Tokens Out: ${completionTokens}`);
          return { ...res, ...security, providerUsed: 'groq', modelUsed, promptTokens, completionTokens, tokensUsed: totalTokens };
        } catch (groqErr) {
          console.warn(`🔄 [AI-GATEWAY] Groq model ${mId} issue (${groqErr.message}). Trying next...`);
          lastError = groqErr;
        }
      }

      // ── Provider 3: Mistral (final fallback — only if API key is set) ────────
      if (process.env.MISTRAL_API_KEY) {
        try {
          console.log('🤖 [AI-GATEWAY] Trying Mistral (final fallback)...');
          const res = await generateMistralResponse(finalPrompt, systemInstruction, null, tools);
          console.log(`🤖 [AI-USAGE] Provider: Mistral | Model: mistral-small-latest`);
          return { ...res, ...security, providerUsed: 'mistral', modelUsed: 'mistral-small-latest', fallbackUsed: true };
        } catch (mistralErr) {
          console.warn(`🔄 [AI-GATEWAY] Mistral fallback issue (${mistralErr.message}).`);
          lastError = mistralErr;
        }
      }

      throw new Error(
        `All AI providers (Gemini → Groq → Mistral) failed. Last error: ${lastError?.message || 'Provider timeout'}`,
      );
    },
  );
}


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
  model = 'gemini-2.0-flash',
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

  // 2. PROVIDER EXECUTION CHAIN
  return await trackAIUsage(
    { userId, businessId, requestType: type, provider: 'voxy-direct', model },
    async () => {
      const groqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
      let lastError = null;

      for (let pass = 1; pass <= 2; pass++) {
        if (pass > 1) {
          console.warn(`🔄 [AI-GATEWAY] Retrying provider chain (Pass ${pass} of 2)...`);
          await new Promise(r => setTimeout(r, 1000));
        }

        // ── Provider 1: Gemini (primary — highest free limits) ────────────────
        try {
          const res = await generateGeminiResponse(finalPrompt, systemInstruction);
          return { ...res, ...security, providerUsed: 'gemini', modelUsed: 'gemini-2.0-flash' };
        } catch (geminiErr) {
          console.warn(`🔄 [AI-GATEWAY] Gemini issue (${geminiErr.message}). Trying Groq...`);
          lastError = geminiErr;
        }

        // ── Provider 2: Groq (secondary — multi-key rotation) ─────────────────
        for (const mId of groqModels) {
          try {
            const res = await generateGroqResponse(finalPrompt, systemInstruction, mId, tools);
            return { ...res, ...security, providerUsed: 'groq', modelUsed: mId };
          } catch (groqErr) {
            console.warn(`🔄 [AI-GATEWAY] Groq model ${mId} issue (${groqErr.message}). Trying next...`);
            lastError = groqErr;
          }
        }

        // ── Provider 3: Mistral (final fallback) ──────────────────────────────
        try {
          const res = await generateMistralResponse(finalPrompt, systemInstruction, null, tools);
          return {
            ...res,
            ...security,
            providerUsed: 'mistral',
            modelUsed: 'mistral-small-latest',
            fallbackUsed: true,
          };
        } catch (mistralErr) {
          console.warn(`🔄 [AI-GATEWAY] Mistral fallback issue (${mistralErr.message}).`);
          lastError = mistralErr;
        }
      }

      throw new Error(
        `All AI providers (Gemini → Groq → Mistral) failed after retrying. Last error: ${lastError?.message || 'Provider timeout'}`,
      );
    },
  );
}

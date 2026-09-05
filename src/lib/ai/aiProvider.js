import { trackAIUsage } from './observability.js';
import { runSecurityChecks } from './security.js';
import { generateGroqResponse } from './providers/groq.js';
import { generateGeminiResponse } from './providers/gemini.js';

/**
 * Direct & Resilient AI Provider Layer
 * Uses Groq (high speed, < 500ms) as primary provider with Gemini as fallback.
 */
export async function generateAI({ userId, businessId, prompt, type = 'chat', model = 'openai/gpt-oss-120b', systemInstruction = "", tools = null }) {
  
  // 1. PRE-PROCESSING SECURITY SCAN
  const rawInput = typeof prompt === 'string' ? prompt : prompt[prompt.length - 1].content;
  const security = await runSecurityChecks(rawInput);
  const sanitizedInput = security.sanitizedInput;

  const finalPrompt = typeof prompt === 'string' 
    ? sanitizedInput 
    : prompt.map((m, i) => i === prompt.length - 1 ? { ...m, content: sanitizedInput } : m);

  // 2. DIRECT PROVIDER EXECUTION CHAIN
  return await trackAIUsage(
    { userId, businessId, requestType: type, provider: "voxy-direct", model },
    async () => {
      const modelChain = [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'groq/compound',
        'groq/compound-mini',
        'qwen/qwen3.8-27b'
      ];
      let lastErr = null;

      for (const mId of modelChain) {
        try {
          const res = await generateGroqResponse(finalPrompt, systemInstruction, mId, tools);
          return { ...res, ...security, providerUsed: "groq", modelUsed: mId };
        } catch (groqErr) {
          console.warn(`🔄 [AI-GATEWAY] Groq model ${mId} failed (${groqErr.message}). Trying next locked-in model...`);
          lastErr = groqErr;
        }
      }

      // Fallback: Gemini if available
      try {
        const geminiRes = await generateGeminiResponse(finalPrompt, systemInstruction);
        return { ...geminiRes, ...security, providerUsed: "gemini", fallbackUsed: true };
      } catch (geminiErr) {
        throw new Error(`All locked-in AI models failed. Last error: ${lastErr?.message || geminiErr.message}`);
      }
    }
  );
}

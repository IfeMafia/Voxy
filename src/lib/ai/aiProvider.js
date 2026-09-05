import { trackAIUsage } from './observability.js';
import { runSecurityChecks } from './security.js';
import { generateGroqResponse } from './providers/groq.js';
import { generateGeminiResponse } from './providers/gemini.js';

/**
 * Direct & Resilient AI Provider Layer
 * Uses Groq (primary - high speed, < 500ms) with Gemini (google) as fallback.
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
      const groqModels = [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'groq/compound'
      ];
      let lastError = null;
      
      for (let pass = 1; pass <= 2; pass++) {
        if (pass > 1) {
          console.warn(`🔄 [AI-GATEWAY] Retrying provider chain (Pass ${pass} of 2)...`);
          await new Promise(r => setTimeout(r, 1000));
        }

        // Primary Provider Loop: Groq models
        for (const mId of groqModels) {
          try {
            const res = await generateGroqResponse(finalPrompt, systemInstruction, mId, tools);
            return { ...res, ...security, providerUsed: "groq", modelUsed: mId };
          } catch (groqErr) {
            console.warn(`🔄 [AI-GATEWAY] Groq model ${mId} issue (${groqErr.message}). Trying next Groq model...`);
            lastError = groqErr;
          }
        }

        // Fallback Provider: Google Gemini
        try {
          const geminiRes = await generateGeminiResponse(finalPrompt, systemInstruction);
          return { ...geminiRes, ...security, providerUsed: "gemini", modelUsed: "gemini-2.0-flash", fallbackUsed: true };
        } catch (geminiErr) {
          console.warn(`🔄 [AI-GATEWAY] Gemini fallback issue (${geminiErr.message}).`);
          lastError = geminiErr;
        }
      }

      throw new Error(`All locked Groq & Gemini AI models failed after retrying. Last error: ${lastError?.message || "Provider timeout"}`);
    }
  );
}



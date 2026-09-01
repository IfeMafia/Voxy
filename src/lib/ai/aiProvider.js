import { trackAIUsage } from './observability.js';
import { runSecurityChecks } from './security.js';
import { generateGroqResponse } from './providers/groq.js';
import { generateGeminiResponse } from './providers/gemini.js';

/**
 * Direct & Resilient AI Provider Layer
 * Uses Groq (high speed, < 500ms) as primary provider with Gemini as fallback.
 */
export async function generateAI({ userId, businessId, prompt, type = 'chat', model = 'gemini-2.0-flash', systemInstruction = "" }) {
  
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
      // Primary: Groq (Ultra low latency for fast responses)
      try {
        const fallbackRes = await generateGroqResponse(finalPrompt, systemInstruction);
        return { ...fallbackRes, ...security, providerUsed: "groq" };
      } catch (groqErr) {
        console.info(`🔄 [AI-GATEWAY] Groq unavailable (${groqErr.message}). Failing over to Gemini...`);
        // Fallback: Gemini
        const geminiRes = await generateGeminiResponse(finalPrompt, systemInstruction);
        return { ...geminiRes, ...security, providerUsed: "gemini", fallbackUsed: true };
      }
    }
  );
}

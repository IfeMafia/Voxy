import { trackAIUsage } from './observability.js';
import { callCencoriAI } from './cencori.js';
import { runSecurityChecks } from './cencori-security.js';
import { generateGeminiResponse } from './providers/gemini.js'; // Fallback provider
import { generateGroqResponse } from './providers/groq.js';   // Fallback provider

/**
 * Resilient AI Provider Layer (Step 2)
 * Centralizes primary Cencori execution with robust internal fallbacks.
 */
// 0. Circuit Breaker State (High-Speed Performance optimization)
let cencoriFailures = 0;
let lastFailureTime = 0;
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

export async function generateAI({ userId, businessId, prompt, type = 'chat', model = 'gemini-2.5', systemInstruction = "" }) {
  
  // 1. PRE-PROCESSING SECURITY SCAN
  const rawInput = typeof prompt === 'string' ? prompt : prompt[prompt.length - 1].content;
  const security = await runSecurityChecks(rawInput);
  const sanitizedInput = security.sanitizedInput;

  const finalPrompt = typeof prompt === 'string' 
    ? sanitizedInput 
    : prompt.map((m, i) => i === prompt.length - 1 ? { ...m, content: sanitizedInput } : m);

  // 1b. Circuit Breaker Check
  const isCircuitOpen = cencoriFailures >= FAILURE_THRESHOLD && (Date.now() - lastFailureTime) < COOLDOWN_MS;

  // 2. EXECUTION CHAIN
  return await trackAIUsage(
    { userId, businessId, requestType: type, provider: "voxy-hybrid", model },
    async () => {
      // Logic: Skip Cencori if it's currently failing to keep latency low (< 1.5s)
      const tryCencori = !isCircuitOpen;

      if (tryCencori) {
        try {
          const res = await callCencoriAI({ prompt: finalPrompt, model, metadata: { systemInstruction } });
          cencoriFailures = 0; // Reset on success
          return { ...res, ...security, providerUsed: "cencori" };
        } catch (err) {
          cencoriFailures++;
          lastFailureTime = Date.now();
          console.warn(`🛡️ [AI-GATEWAY] Cencori failed (${cencoriFailures}/${FAILURE_THRESHOLD}). Circuit opening soon.`);
        }
      }

      // Secondary Fallback: Direct Provider (High Speed)
      try {
        const fallbackRes = await generateGroqResponse(finalPrompt, systemInstruction);
        return { ...fallbackRes, ...security, providerUsed: "groq (fallback)", fallbackUsed: true };
      } catch (fallbackErr) {
        const finalRes = await generateGeminiResponse(finalPrompt, systemInstruction);
        return { ...finalRes, ...security, providerUsed: "gemini (fallback)", fallbackUsed: true };
      }
    }
  );
}

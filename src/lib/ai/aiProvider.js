import { trackAIUsage } from './observability.js';
import { runSecurityChecks } from './security.js';
import { generateGroqResponse } from './providers/groq.js';
import { generateOpenRouterResponse } from './providers/openrouter.js';

/**
 * Direct & Resilient AI Provider Layer
 * Locked models for Voxy:
 * 1. GPT-OSS (`openai/gpt-oss-120b`) via Groq (Primary, sub-500ms)
 * 2. Llama 3.3 (`meta-llama/llama-3.3-70b-instruct`) via OpenRouter (Resilient Fallback)
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
      let lastError = null;
      
      for (let pass = 1; pass <= 2; pass++) {
        if (pass > 1) {
          console.warn(`🔄 [AI-GATEWAY] Retrying full provider chain (Pass ${pass} of 2)...`);
          await new Promise(r => setTimeout(r, 1000));
        }

        // Direct request if Llama model is explicitly targeted
        if (model.includes('llama')) {
          try {
            const res = await generateOpenRouterResponse(finalPrompt, systemInstruction, model, tools);
            return { ...res, ...security, providerUsed: "openrouter", modelUsed: model };
          } catch (err) {
            console.warn(`🔄 [AI-GATEWAY] OpenRouter Llama model ${model} failed (${err.message}). Falling back to primary Groq GPT-OSS...`);
            lastError = err;
          }
        }

        // Primary Provider Execution: Groq (openai/gpt-oss-120b)
        try {
          const res = await generateGroqResponse(finalPrompt, systemInstruction, 'openai/gpt-oss-120b', tools);
          return { ...res, ...security, providerUsed: "groq", modelUsed: 'openai/gpt-oss-120b' };
        } catch (groqErr) {
          console.warn(`🔄 [AI-GATEWAY] Groq GPT-OSS failed (${groqErr.message}). Switching to locked fallback Llama model...`);
          lastError = groqErr;
        }

        // Secondary Provider Execution: OpenRouter (meta-llama/llama-3.3-70b-instruct)
        try {
          const llamaRes = await generateOpenRouterResponse(finalPrompt, systemInstruction, 'meta-llama/llama-3.3-70b-instruct', tools);
          return { ...llamaRes, ...security, providerUsed: "openrouter", modelUsed: 'meta-llama/llama-3.3-70b-instruct', fallbackUsed: true };
        } catch (llamaErr) {
          console.warn(`🔄 [AI-GATEWAY] OpenRouter Llama fallback failed (${llamaErr.message}).`);
          lastError = llamaErr;
        }
      }

      throw new Error(`All locked AI models failed after retrying. Last error: ${lastError?.message || "Provider timeout"}`);
    }
  );
}


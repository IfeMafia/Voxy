import { generateGeminiResponse } from "../providers/gemini.js";
import { generateGroqResponse } from "../providers/groq.js";
import { generateCencoriResponse } from "../providers/cencori.js";
import { withTimeout } from "../utils/timeout.js";

const DEFAULT_TIMEOUT = 10000; // 10 seconds

// 1. PROVIDER PRIORITY SYSTEM
const AI_PROVIDERS = [
  {
    name: "cencori",
    priority: 1,
    runner: generateCencoriResponse
  },
  {
    name: "groq",
    priority: 2,
    runner: generateGroqResponse
  },
  {
    name: "gemini",
    priority: 3,
    runner: generateGeminiResponse
  }
];

/**
 * Robust AI Response Generator with Multi-Provider Fallback
 * @param {Array|string} promptOrMessages - Chat history in unified format or a single string prompt
 * @param {string} systemInstruction - System instructions
 */
export async function generateAIResponse(promptOrMessages, systemInstruction = "You are a helpful assistant.") {
  let lastError = null;
  
  // Normalize input: if it's a string, convert to messages format
  const messages = typeof promptOrMessages === 'string' 
    ? [{ role: 'user', parts: [{ text: promptOrMessages }] }]
    : promptOrMessages;

  // 2. UNIFIED REQUEST FUNCTION - Loop through priority order
  for (const provider of AI_PROVIDERS) {
    try {
      console.log(`📡 [AI-CORE] Trying provider: ${provider.name.toUpperCase()} (Priority: ${provider.priority})`);
      const start = Date.now();

      // 3 & 4. FAILURE HANDLING + TIMEOUT CONTROL
      const response = await withTimeout(
        provider.runner(messages, systemInstruction),
        DEFAULT_TIMEOUT,
        provider.name
      );

      const duration = (Date.now() - start) / 1000;
      
      // 7. LOGGING SUCCESS
      console.log(`✅ [AI-CORE] ${provider.name} succeeded (${duration}s) | Tokens: ${response.tokensUsed || 'N/A'}`);
      
      return response;

    } catch (error) {
      lastError = error;
      // 3. FAILURE HANDLING - Log retry/fail
      console.error(`⚠️ [AI-CORE] ${provider.name} failed: ${error.message.split('\n')[0]}. Trying next fallback...`);
      continue;
    }
  }

  // 8. FAIL-SAFE (LAST RESORT)
  console.error("❌ [AI-CORE] ALL AI PROVIDERS FAILED.");
  return {
    text: null,
    provider: "error",
    error: lastError?.message || "All providers failed",
    failed: true
  };
}

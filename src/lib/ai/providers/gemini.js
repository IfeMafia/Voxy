import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiApiKeys() {
  const dynamicEnvKeys = typeof process !== 'undefined' && process.env
    ? Object.keys(process.env)
        .filter(key => /^GEMINI_API_KEY/i.test(key))
        .map(key => process.env[key])
    : [];

  const keys = [
    ...dynamicEnvKeys,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean).flatMap(val => val.split(',')).map(k => k.trim()).filter(Boolean);

  const uniqueKeys = Array.from(new Set(keys));
  return uniqueKeys.length > 0 ? uniqueKeys : ["dummy-key-for-build"];
}

let activeGeminiKeyIndex = 0;

/**
 * Direct Gemini AI Provider (Final Fallback Layer with multi-key rotation)
 */
export const generateGeminiResponse = async (messages, systemInstruction) => {
  const keys = getGeminiApiKeys();
  let attempts = 0;
  const maxAttempts = keys.length;
  let lastError = null;

  while (attempts < maxAttempts) {
    const keyIdx = activeGeminiKeyIndex % keys.length;
    const currentKey = keys[keyIdx];
    const client = new GoogleGenerativeAI(currentKey);

    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction ? {
        role: "system",
        parts: [{ text: systemInstruction }]
      } : undefined
    });

    const chat = model.startChat({
      history: Array.isArray(messages) ? messages.slice(0, -1).map(m => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || (m.parts && m.parts[0] ? m.parts[0].text : '') }]
      })) : []
    });

    const lastMessage = Array.isArray(messages) 
      ? messages[messages.length - 1].content || (messages[messages.length - 1].parts && messages[messages.length - 1].parts[0] ? messages[messages.length - 1].parts[0].text : '')
      : messages;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timed out after 8s')), 8000)
    );

    try {
      const result = await Promise.race([
        chat.sendMessage(lastMessage),
        timeoutPromise
      ]);
      const response = await result.response;
      
      return {
        text: response.text(),
        provider: "gemini",
        tokensUsed: response.usageMetadata?.totalTokenCount || 0
      };
    } catch (err) {
      lastError = err;
      if (keys.length > 1) {
        console.warn(`🔄 [GEMINI-ROTATOR] Key #${keyIdx + 1} issue (${err.message}). Switching to Key #${((keyIdx + 1) % keys.length) + 1}...`);
        activeGeminiKeyIndex = (activeGeminiKeyIndex + 1) % keys.length;
        attempts++;
      } else {
        throw err;
      }
    }
  }

  throw lastError || new Error("All Gemini API keys exhausted or rate limited.");
};

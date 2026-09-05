import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GEMINI_API_KEY is missing. Gemini will fail if called.");
    }
    genAI = new GoogleGenerativeAI(apiKey || "dummy-key-for-build");
  }
  return genAI;
}

/**
 * Direct Gemini AI Provider (Final Fallback Layer)
 */
export const generateGeminiResponse = async (messages, systemInstruction) => {
  const client = getGeminiClient();
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
};

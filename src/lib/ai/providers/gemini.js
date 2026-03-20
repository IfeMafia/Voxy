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

export const generateGeminiResponse = async (messages, systemInstruction) => {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ 
    model: "gemini-2.0-flash", 
  });

  const chat = model.startChat({
    history: messages.slice(0, -1).map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.parts[0].text }]
    })),
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstruction }]
    }
  });

  const lastMessage = messages[messages.length - 1].parts[0].text;
  const result = await chat.sendMessage(lastMessage);
  const response = await result.response;
  
  return {
    text: response.text(),
    provider: "gemini",
    tokensUsed: response.usageMetadata?.totalTokenCount || 0
  };
};

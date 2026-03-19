import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateGeminiResponse = async (messages, systemInstruction) => {
  const model = genAI.getGenerativeModel({ 
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

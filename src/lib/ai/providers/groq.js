import Groq from "groq-sdk";

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GROQ_API_KEY is missing. Groq will fail if called.");
    }
    groqClient = new Groq({ apiKey: apiKey || "dummy-key-for-build" });
  }
  return groqClient;
}

/**
 * Direct Groq AI Provider (Fallback Layer)
 */
export const generateGroqResponse = async (messages, systemInstruction) => {
  const groq = getGroqClient();
  
  // Normalize input messages to Groq's Chat interface
  const groqMessages = [
    { role: "system", content: systemInstruction },
    ...(Array.isArray(messages) ? messages.map(m => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || (m.parts && m.parts[0] ? m.parts[0].text : '')
    })) : [])
  ];

  const modelName = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const completion = await groq.chat.completions.create({
    messages: groqMessages,
    model: modelName,
    temperature: 0.7,
  });

  return {
    text: completion.choices[0]?.message?.content || "",
    provider: "groq",
    tokensUsed: completion.usage?.total_tokens || 0
  };
};

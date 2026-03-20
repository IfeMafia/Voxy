import Groq from "groq-sdk";

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GROQ_API_KEY is missing. Groq will fail if called.");
      // Return a dummy client or handle it in the runner
    }
    groqClient = new Groq({ apiKey: apiKey || "dummy-key-for-build" });
  }
  return groqClient;
}

export const generateGroqResponse = async (messages, systemInstruction) => {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemInstruction },
      ...messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.parts[0].text
      }))
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
  });

  return {
    text: completion.choices[0]?.message?.content || "",
    provider: "groq",
    tokensUsed: completion.usage?.total_tokens || 0
  };
};

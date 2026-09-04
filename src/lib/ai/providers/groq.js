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
export const generateGroqResponse = async (messages, systemInstruction, modelOverride = null, tools = null) => {
  const groq = getGroqClient();
  
  // Normalize input messages to Groq's Chat interface
  const groqMessages = [
    { role: "system", content: systemInstruction },
    ...(Array.isArray(messages) ? messages.map(m => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || (m.parts && m.parts[0] ? m.parts[0].text : '')
    })) : [])
  ];

  const modelName = modelOverride || process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const body = {
    messages: groqMessages,
    model: modelName,
    temperature: 0.7,
  };

  if (Array.isArray(tools) && tools.length > 0) {
    body.tools = tools.map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: "object",
          properties: Object.fromEntries(
            (t.parameters || []).map(p => [p.name, { type: p.type || "string", description: p.description }])
          ),
          required: (t.parameters || []).filter(p => p.required).map(p => p.name)
        }
      }
    }));
    body.tool_choice = "auto";
  }

  const completion = await groq.chat.completions.create(body);
  const choice = completion.choices[0]?.message;

  return {
    text: choice?.content || "",
    tool_calls: choice?.tool_calls || null,
    provider: "groq",
    tokensUsed: completion.usage?.total_tokens || 0
  };
};

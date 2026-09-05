import Groq from "groq-sdk";

function getApiKeys() {
  const envVars = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY2,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_ALT,
    process.env.GROQ_API_KEYS
  ];

  const keys = envVars
    .filter(Boolean)
    .flatMap(val => val.split(','))
    .map(k => k.trim())
    .filter(Boolean);

  const uniqueKeys = Array.from(new Set(keys));
  return uniqueKeys.length > 0 ? uniqueKeys : ["dummy-key-for-build"];
}

let activeKeyIndex = 0;
const groqClientsMap = new Map();

function getGroqClientForKey(apiKey) {
  if (!groqClientsMap.has(apiKey)) {
    groqClientsMap.set(apiKey, new Groq({ apiKey }));
  }
  return groqClientsMap.get(apiKey);
}

/**
 * Direct Groq AI Provider (with instant multi-key rotation on rate limit)
 */
export const generateGroqResponse = async (messages, systemInstruction, modelOverride = null, tools = null) => {
  const keys = getApiKeys();
  let attempts = 0;
  const maxAttempts = keys.length;
  let lastError = null;

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
            (t.parameters || []).map(p => [
              p.name,
              {
                type: p.required ? (p.type || "string") : [p.type || "string", "null"],
                description: p.description
              }
            ])
          ),
          required: (t.parameters || []).filter(p => p.required).map(p => p.name)
        }
      }
    }));
    body.tool_choice = "auto";
  }

  while (attempts < maxAttempts) {
    const keyIdx = activeKeyIndex % keys.length;
    const currentKey = keys[keyIdx];
    const groq = getGroqClientForKey(currentKey);

    try {
      const completion = await groq.chat.completions.create(body, { timeout: 8000 });
      const choice = completion.choices[0]?.message;

      return {
        text: choice?.content || "",
        tool_calls: choice?.tool_calls || null,
        provider: "groq",
        keyIndex: keyIdx,
        tokensUsed: completion.usage?.total_tokens || 0
      };
    } catch (err) {
      lastError = err;
      const isRateLimitOrTimeout = 
        err?.status === 429 || 
        err?.status === 401 || 
        err?.name === 'APIConnectionTimeoutError' ||
        err?.message?.includes('timeout') ||
        err?.message?.includes('Rate limit') || 
        err?.message?.includes('rate_limit') ||
        err?.message?.includes('tokens per day');

      if (isRateLimitOrTimeout && keys.length > 1) {
        console.warn(`🔄 [GROQ-ROTATOR] API Key #${keyIdx + 1} issue (${err.message || err.status}). Switching to API Key #${((keyIdx + 1) % keys.length) + 1} immediately...`);
        activeKeyIndex = (activeKeyIndex + 1) % keys.length;
        attempts++;
      } else {
        throw err;
      }
    }
  }

  throw lastError || new Error("All Groq API keys exhausted or rate limited.");
};

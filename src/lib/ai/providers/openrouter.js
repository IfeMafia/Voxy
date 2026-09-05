/**
 * Direct OpenRouter AI Provider for Llama models
 * Used as locked secondary reasoning provider for Voxy
 */

export const generateOpenRouterResponse = async (messages, systemInstruction, modelOverride = null, tools = null) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured in environment.");
  }

  const formattedMessages = [
    ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
    ...(Array.isArray(messages) ? messages.map(m => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || (m.parts && m.parts[0] ? m.parts[0].text : '')
    })) : typeof messages === 'string' ? [{ role: 'user', content: messages }] : [])
  ];

  const modelName = modelOverride || "meta-llama/llama-3.3-70b-instruct";
  const body = {
    messages: formattedMessages,
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

  let lastError = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://voxy.app",
          "X-Title": "Voxy AI"
        },
        body: JSON.stringify(body)
      });

      const completion = await response.json();
      if (!response.ok) {
        throw new Error(completion.error?.message || `OpenRouter API error ${response.status}`);
      }

      const choice = completion.choices[0]?.message;
      return {
        text: choice?.content || "",
        tool_calls: choice?.tool_calls || null,
        provider: "openrouter",
        tokensUsed: completion.usage?.total_tokens || 0
      };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        console.warn(`🔄 [OPENROUTER] Request attempt ${attempt} failed (${err.message}). Retrying in ${attempt * 500}ms...`);
        await new Promise(r => setTimeout(r, attempt * 500));
      }
    }
  }

  throw lastError || new Error("OpenRouter request failed after maximum retries.");
};

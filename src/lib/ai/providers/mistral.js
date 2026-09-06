/**
 * Mistral AI Provider
 *
 * Primary reasoning provider for Voxy.
 * Uses Mistral's chat completions API directly (fetch-based, no SDK dependency).
 * Supports: tool-calling, system instructions, key rotation.
 *
 * Voxy is an AI-powered sales and support assistant platform that enables
 * businesses to deploy intelligent voice/chat agents. Mistral handles the
 * primary reasoning layer — product lookups, order building, intent resolution,
 * and structured tool invocation — before falling back to Groq or Gemini.
 */

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL   = 'mistral-small-latest'; // fast, cheap, tool-capable

function getMistralApiKeys() {
  const raw = [
    process.env.MISTRAL_API_KEY,
    process.env.MISTRAL_API_KEY2,
    process.env.MISTRAL_API_KEY_2,
  ];
  return raw
    .filter(Boolean)
    .flatMap(v => v.split(','))
    .map(k => k.trim())
    .filter(Boolean);
}

let activeKeyIndex = 0;

/**
 * Mistral AI Provider — primary reasoning provider for Voxy.
 *
 * @param {Array|string} messages     Chat history (Voxy internal format).
 * @param {string}       systemInstruction  The built system prompt.
 * @param {string|null}  modelOverride      Optional model ID override.
 * @param {Array|null}   tools              Voxy tool definitions.
 * @returns {Promise<{text:string, tool_calls:Array|null, provider:string, tokensUsed:number}>}
 */
export const generateMistralResponse = async (
  messages,
  systemInstruction,
  modelOverride = null,
  tools = null,
) => {
  const keys = getMistralApiKeys();
  if (!keys.length) throw new Error('No Mistral API keys configured.');

  const modelName = modelOverride || MISTRAL_MODEL;

  // Build message array
  const mistralMessages = [
    { role: 'system', content: systemInstruction },
    ...(Array.isArray(messages)
      ? messages.map(m => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content || (m.parts?.[0]?.text ?? ''),
        }))
      : []),
  ];

  // Build request body
  const body = {
    model: modelName,
    messages: mistralMessages,
    temperature: 0.7,
  };

  if (Array.isArray(tools) && tools.length > 0) {
    body.tools = tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            (t.parameters || []).map(p => [
              p.name,
              {
                type: p.required ? (p.type || 'string') : [p.type || 'string', 'null'],
                description: p.description,
              },
            ]),
          ),
          required: (t.parameters || []).filter(p => p.required).map(p => p.name),
        },
      },
    }));
    body.tool_choice = 'auto';
  }

  let lastError = null;
  const maxAttempts = keys.length;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const keyIdx = activeKeyIndex % keys.length;
    const apiKey = keys[keyIdx];

    try {
      const res = await fetch(MISTRAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const err = new Error(errBody?.message || `Mistral HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const choice = data.choices?.[0]?.message;

      return {
        text: choice?.content || '',
        tool_calls: choice?.tool_calls || null,
        provider: 'mistral',
        tokensUsed: data.usage?.total_tokens || 0,
        keyIndex: keyIdx,
      };
    } catch (err) {
      lastError = err;
      const rotatable =
        err?.status === 429 ||
        err?.status === 401 ||
        err?.message?.includes('rate') ||
        err?.message?.includes('timeout') ||
        err?.name === 'TimeoutError';

      if (rotatable && keys.length > 1) {
        console.warn(
          `🔄 [MISTRAL-ROTATOR] Key #${keyIdx + 1} issue (${err.message || err.status}). Rotating to key #${((keyIdx + 1) % keys.length) + 1}...`,
        );
        activeKeyIndex = (activeKeyIndex + 1) % keys.length;
        attempts++;
      } else {
        throw err;
      }
    }
  }

  throw lastError || new Error('All Mistral API keys exhausted or rate limited.');
};

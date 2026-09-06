/**
 * Mistral AI Provider
 *
 * Primary reasoning provider for Voxy.
 *
 * Call order:
 *   1. Mistral Agents API  — uses MISTRAL_AGENT_ID + MISTRAL_API_KEY
 *                            (agent has its own system prompt on La Plateforme,
 *                             separate rate limit bucket)
 *   2. Mistral Chat API    — falls back to direct chat/completions if agent call fails
 *                            (model: mistral-small-latest)
 */

const MISTRAL_AGENT_URL      = 'https://api.mistral.ai/v1/agents/completions';
const MISTRAL_CHAT_URL       = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_FALLBACK_MODEL = 'mistral-small-latest';

function getMistralApiKey() {
  return process.env.MISTRAL_API_KEY || null;
}

function getMistralAgentId() {
  return process.env.MISTRAL_AGENT_ID || null;
}

/** Convert Voxy internal message format → Mistral message array */
function buildMessages(messages) {
  return Array.isArray(messages)
    ? messages.map(m => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || (m.parts?.[0]?.text ?? ''),
      }))
    : [];
}

/** Build Mistral-format tool list from Voxy tool definitions */
function buildTools(tools) {
  if (!Array.isArray(tools) || !tools.length) return null;
  return tools.map(t => ({
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
}

async function callMistral(url, body, apiKey) {
  const res = await fetch(url, {
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
  };
}

/**
 * Mistral AI Provider — primary reasoning provider for Voxy.
 *
 * Tries Agents API first (agent ID gives separate quota), then falls
 * back to direct chat completions on the same API key.
 *
 * @param {Array|string} messages
 * @param {string}       systemInstruction
 * @param {string|null}  modelOverride
 * @param {Array|null}   tools
 */
export const generateMistralResponse = async (
  messages,
  systemInstruction,
  modelOverride = null,
  tools = null,
) => {
  const apiKey  = getMistralApiKey();
  const agentId = getMistralAgentId();

  if (!apiKey) throw new Error('No Mistral API key configured (MISTRAL_API_KEY).');

  const mistralMessages = buildMessages(messages);
  const mistralTools    = buildTools(tools);

  // ── Path 1: Mistral Agents API ────────────────────────────────────────────
  // Agent has its own system prompt on La Plateforme; we do NOT pass a system
  // message here — the agent's built-in instructions apply automatically.
  if (agentId) {
    try {
      const body = {
        agent_id: agentId,
        messages: mistralMessages,
      };
      if (mistralTools) {
        body.tools = mistralTools;
        body.tool_choice = 'auto';
      }

      const result = await callMistral(MISTRAL_AGENT_URL, body, apiKey);
      console.log(`✅ [MISTRAL-AGENT] Responded via agent ${agentId}`);
      return { ...result, via: 'agent' };
    } catch (agentErr) {
      console.warn(`🔄 [MISTRAL-AGENT] Agent call failed (${agentErr.message}). Falling back to chat API...`);
    }
  }

  // ── Path 2: Mistral Chat Completions API ──────────────────────────────────
  const modelName = modelOverride || MISTRAL_FALLBACK_MODEL;
  const body = {
    model: modelName,
    messages: [
      { role: 'system', content: systemInstruction },
      ...mistralMessages,
    ],
    temperature: 0.7,
  };
  if (mistralTools) {
    body.tools = mistralTools;
    body.tool_choice = 'auto';
  }

  const result = await callMistral(MISTRAL_CHAT_URL, body, apiKey);
  console.log(`✅ [MISTRAL-CHAT] Responded via chat completions (${modelName})`);
  return { ...result, via: 'chat' };
};

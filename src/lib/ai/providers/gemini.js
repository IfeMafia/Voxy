import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiApiKeys() {
  const dynamicEnvKeys = typeof process !== 'undefined' && process.env
    ? Object.keys(process.env)
        .filter(key => /^GEMINI_API_KEY/i.test(key))
        .map(key => process.env[key])
    : [];

  const keys = [
    ...dynamicEnvKeys,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean).flatMap(val => val.split(',')).map(k => k.trim()).filter(Boolean);

  const uniqueKeys = Array.from(new Set(keys));
  return uniqueKeys.length > 0 ? uniqueKeys : ["dummy-key-for-build"];
}

let activeGeminiKeyIndex = 0;

/**
 * Convert Voxy tool definitions → Gemini FunctionDeclaration format
 * @param {Array} tools
 */
function buildGeminiFunctionDeclarations(tools) {
  if (!Array.isArray(tools) || !tools.length) return null;
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'OBJECT',
      properties: Object.fromEntries(
        (t.parameters || []).map(p => [
          p.name,
          { type: (p.type || 'string').toUpperCase(), description: p.description }
        ])
      ),
      required: (t.parameters || []).filter(p => p.required).map(p => p.name),
    },
  }));
}

/**
 * Gemini AI Provider — primary reasoning provider for Voxy.
 * Supports native function/tool calling via the Google Generative AI SDK.
 *
 * @param {Array|string} messages
 * @param {string}       systemInstruction
 * @param {Array|null}   tools   Voxy tool definitions
 */
export const generateGeminiResponse = async (messages, systemInstruction, tools = null) => {
  const keys = getGeminiApiKeys();
  let attempts = 0;
  const maxAttempts = keys.length;
  let lastError = null;

  const functionDeclarations = buildGeminiFunctionDeclarations(tools);

  while (attempts < maxAttempts) {
    const keyIdx = activeGeminiKeyIndex % keys.length;
    const currentKey = keys[keyIdx];
    const client = new GoogleGenerativeAI(currentKey);

    const modelConfig = {
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction
        ? { role: "system", parts: [{ text: systemInstruction }] }
        : undefined,
    };

    // Attach function declarations when tools are provided
    if (functionDeclarations?.length) {
      modelConfig.tools = [{ functionDeclarations }];
      modelConfig.toolConfig = { functionCallingConfig: { mode: "AUTO" } };
    }

    const model = client.getGenerativeModel(modelConfig);

    // Build history (all turns except the last)
    const history = Array.isArray(messages)
      ? messages.slice(0, -1).map(m => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content || (m.parts?.[0]?.text ?? '') }],
        }))
      : [];

    const lastMessage = Array.isArray(messages)
      ? (messages[messages.length - 1]?.content || messages[messages.length - 1]?.parts?.[0]?.text || '')
      : messages;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timed out after 10s')), 10000)
    );

    try {
      const chat = model.startChat({ history });

      const result = await Promise.race([
        chat.sendMessage(lastMessage),
        timeoutPromise,
      ]);
      const response = await result.response;

      // ── Check for native function call ─────────────────────────────────────
      const fnCalls = response.functionCalls?.();
      if (fnCalls && fnCalls.length > 0) {
        const fc = fnCalls[0];
        return {
          text: '',
          tool_calls: [{
            function: {
              name: fc.name,
              arguments: typeof fc.args === 'string' ? fc.args : JSON.stringify(fc.args),
            },
          }],
          provider: 'gemini',
          tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        };
      }

      // ── Plain text response ────────────────────────────────────────────────
      return {
        text: response.text(),
        tool_calls: null,
        provider: 'gemini',
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      };
    } catch (err) {
      lastError = err;
      if (keys.length > 1) {
        console.warn(`🔄 [GEMINI-ROTATOR] Key #${keyIdx + 1} issue (${err.message}). Switching to Key #${((keyIdx + 1) % keys.length) + 1}...`);
        activeGeminiKeyIndex = (activeGeminiKeyIndex + 1) % keys.length;
        attempts++;
      } else {
        throw err;
      }
    }
  }

  throw lastError || new Error("All Gemini API keys exhausted or rate limited.");
};

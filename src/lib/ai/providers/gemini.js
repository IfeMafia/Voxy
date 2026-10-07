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
const geminiCooldowns = new Map(); // key -> cooldownExpiryTimestamp

/**
 * Pick next available key taking cooldown into account
 */
function getNextGeminiKey(keys) {
  const now = Date.now();
  for (let i = 0; i < keys.length; i++) {
    const idx = (activeGeminiKeyIndex + i) % keys.length;
    const candidate = keys[idx];
    const expiry = geminiCooldowns.get(candidate) || 0;
    if (now > expiry) {
      activeGeminiKeyIndex = (idx + 1) % keys.length;
      return { key: candidate, index: idx };
    }
  }
  // If all are in cooldown, pick round-robin regardless
  const fallbackIdx = activeGeminiKeyIndex % keys.length;
  activeGeminiKeyIndex = (fallbackIdx + 1) % keys.length;
  return { key: keys[fallbackIdx], index: fallbackIdx };
}

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
        (t.parameters || []).map(p => {
          const typeUpper = (p.type || 'string').toUpperCase();
          const propDef = {
            type: typeUpper,
            description: p.description || '',
          };
          if (typeUpper === 'ARRAY') {
            propDef.items = { type: 'STRING' };
          }
          return [p.name, propDef];
        })
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
 * @param {string|null}  modelOverride
 */
export const generateGeminiResponse = async (messages, systemInstruction, tools = null, modelOverride = null) => {
  throw new Error("Gemini provider is disabled. Using Groq only.");
  const keys = getGeminiApiKeys();

  let attempts = 0;
  const maxAttempts = keys.length;
  let lastError = null;

  const functionDeclarations = buildGeminiFunctionDeclarations(tools);
  const targetModel = modelOverride || process.env.GEMINI_MODEL || "gemini-2.5-flash";

  while (attempts < maxAttempts) {
    const { key: currentKey, index: keyIdx } = getNextGeminiKey(keys);
    const client = new GoogleGenerativeAI(currentKey);

    const modelConfig = {
      model: targetModel,
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
      setTimeout(() => reject(new Error('Gemini API request timed out after 15s')), 15000)
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
          modelUsed: targetModel,
          tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        };
      }

      // ── Plain text response ────────────────────────────────────────────────
      return {
        text: response.text(),
        tool_calls: null,
        provider: 'gemini',
        modelUsed: targetModel,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      };
    } catch (err) {
      lastError = err;
      // Mark key with 60-second cooldown on rate limit or failure
      geminiCooldowns.set(currentKey, Date.now() + 60000);
      attempts++;

      if (keys.length > 1) {
        console.warn(`🔄 [GEMINI-ROTATOR] Key #${keyIdx + 1} issue (${err.message}). Trying next key...`);
      } else {
        throw err;
      }
    }
  }

  throw lastError || new Error("All Gemini API keys exhausted or rate limited.");
};

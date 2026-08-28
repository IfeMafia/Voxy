import { generateAI } from "../aiProvider.js";
import { REASONING_MODEL } from "../agent/model.js";

/**
 * Unified AI Response Interface (Step 3)
 * Refactored to route all requests through the resilient Cencori-first provider.
 *
 * @param {Array|string} promptOrMessages - Chat history or simple prompt
 * @param {string} systemInstruction - System context
 * @param {string} userId - Opt tracking id
 * @param {string} businessId - Opt tracking id
 * @param {string} model - Reasoning model id. Defaults to the locked S2 choice
 *   (`agent/model.js`) so the default is one decision in one place, not a literal
 *   duplicated here; callers may still override per request.
 */
export async function generateAIResponse(
  promptOrMessages,
  systemInstruction = "You are a helpful assistant.",
  userId = null,
  businessId = null,
  model = REASONING_MODEL
) {
  // Transfer execution to the central resilient provider
  return await generateAI({
    userId,
    businessId,
    prompt: promptOrMessages,
    systemInstruction,
    type: 'chat',
    model
  });
}

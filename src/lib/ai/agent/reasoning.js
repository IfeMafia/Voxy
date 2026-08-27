/**
 * Reasoning-layer boundary.
 *
 * This is the seam between "the app decided what to ask" and "a model produced a
 * grounded answer." It is deliberately thin in S1: it defines the request/response
 * shape ({@link ReasoningRequest} / {@link ReasoningResponse}) and delegates to the
 * existing unified interface (`generateAIResponse` → `generateAI`), which already
 * carries the resilient provider chain (Cencori → Groq → Gemini), the circuit
 * breaker, security scanning, and observability.
 *
 * WHAT S2 DOES WITH THIS FILE ("AI Model Integration"):
 *   - Formalise a system-instruction builder (friendly/confident/professional,
 *     grounded strictly in real business data — never inventing price/stock/policy).
 *   - Define the conversation-context interface (history window + summary) as the
 *     canonical input, replacing ad-hoc payload assembly in the chat route.
 *   - Add structured error/fallback handling on top of the provider chain
 *     (e.g. a safe deflection + human-handoff path when every provider fails).
 *   - Lock and document the reasoning-model choice in PRD §8.
 *
 * S1 intentionally does NOT implement those — it only guarantees the boundary and
 * a working pass-through so nothing downstream has to reach into provider internals.
 *
 * @see src/lib/ai/core/generateAIResponse.js  (the interface this wraps)
 * @see src/lib/ai/aiProvider.js               (resilient provider chain)
 * @see public/docs/PRD.md  §8  (model choice — to be locked in S2)
 */

import { generateAIResponse } from '../core/generateAIResponse.js';

/**
 * @typedef {import('./types.js').ReasoningRequest} ReasoningRequest
 * @typedef {import('./types.js').ReasoningResponse} ReasoningResponse
 */

/**
 * Run one grounded reasoning turn.
 *
 * @param {ReasoningRequest} request
 * @returns {Promise<ReasoningResponse>}
 */
export async function runReasoning(request) {
  const {
    messages,
    systemInstruction = 'You are Voxy, a helpful business assistant.',
    userId = null,
    businessId = null,
  } = request ?? {};

  if (!messages) {
    throw new Error('runReasoning requires `messages` (a history window or a single prompt string).');
  }

  const result = await generateAIResponse(messages, systemInstruction, userId, businessId);

  // Normalise across whatever the provider chain returned. `generateAI` returns
  // { text, model, providerUsed, ... }; we surface a stable, minimal shape and
  // keep the raw payload for observability without leaking provider specifics.
  return {
    text: result?.text ?? '',
    model: result?.model,
    provider: result?.providerUsed ?? result?.provider,
    raw: result,
  };
}

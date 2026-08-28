/**
 * Reasoning-layer boundary.
 *
 * This is the seam between "the app decided what to ask" and "a model produced a
 * grounded answer." It defines the request/response shape ({@link ReasoningRequest}
 * / {@link ReasoningResponse}) and delegates to the existing unified interface
 * (`generateAIResponse` → `generateAI`), which already carries the resilient
 * provider chain (Cencori → Groq → Gemini), the circuit breaker, security
 * scanning, and observability.
 *
 * WHAT S2 ADDED HERE ("AI Model Integration"):
 *   - A system-instruction builder (`buildSystemInstruction`) — friendly /
 *     confident / professional, grounded strictly in real business data, never
 *     inventing price / stock / policy (PRD §4.1).
 *   - The conversation-context interface (`buildReasoningRequest`) — history
 *     window + rolling summary as the canonical input, so the chat route no longer
 *     hand-assembles payloads.
 *   - Structured error / fallback (`withReasoningFallback`) — a safe deflection +
 *     human-handoff response when the whole provider chain is down (PRD §4.8),
 *     instead of an unhandled throw reaching the customer.
 *   - The locked reasoning-model choice (`REASONING_MODEL`, documented in PRD §8),
 *     threaded through every turn.
 *
 * Backward compatible: callers may still pass an already-shaped
 * `{ messages, systemInstruction }`. Callers that pass raw context
 * (`{ history, summary, grounding }`) get it assembled for them.
 *
 * @see src/lib/ai/core/generateAIResponse.js  (the interface this wraps)
 * @see src/lib/ai/aiProvider.js               (resilient provider chain)
 * @see src/lib/ai/agent/model.js              (locked model choice)
 * @see public/docs/PRD.md  §8                 (model choice — locked in S2)
 */

import { generateAIResponse } from '../core/generateAIResponse.js';
import { REASONING_MODEL } from './model.js';
import { buildSystemInstruction } from './systemInstruction.js';
import { buildReasoningRequest } from './conversationContext.js';
import { withReasoningFallback } from './fallback.js';

/**
 * @typedef {import('./types.js').ReasoningRequest} ReasoningRequest
 * @typedef {import('./types.js').ReasoningResponse} ReasoningResponse
 * @typedef {import('./systemInstruction.js').GroundingContext} GroundingContext
 */

/**
 * Run one grounded reasoning turn.
 *
 * Accepts either shape:
 *   - Canonical context: `{ history, summary?, grounding?, userId?, businessId?, model? }`
 *     — assembled via {@link buildReasoningRequest} (windowed history, summary folded
 *     into the system prompt, guardrails baked in).
 *   - Pre-shaped request: `{ messages, systemInstruction?, userId?, businessId?, model? }`
 *     — used as-is; `systemInstruction` defaults to the grounded persona when omitted.
 *
 * Never throws for a provider outage: a total chain failure resolves to a
 * handoff {@link ReasoningResponse} (`handoff: true`) via {@link withReasoningFallback}.
 *
 * @param {ReasoningRequest & { history?: Array<*>, summary?: string, grounding?: GroundingContext }} request
 * @returns {Promise<ReasoningResponse>}
 */
export async function runReasoning(request) {
  const req = request ?? {};

  // If the caller handed us raw conversation context, build the canonical request
  // (windowed history + summary-in-system-prompt + guardrails). Otherwise take the
  // already-shaped fields as given.
  const usesContext =
    req.history !== undefined || req.summary !== undefined || req.grounding !== undefined;

  const {
    messages,
    systemInstruction = buildSystemInstruction(),
    userId = null,
    businessId = null,
    model = REASONING_MODEL,
  } = usesContext ? buildReasoningRequest(req) : req;

  const hasPrompt =
    typeof messages === 'string' ? messages.trim() !== '' : Array.isArray(messages) && messages.length > 0;
  if (!hasPrompt) {
    throw new Error('runReasoning requires `messages` (a non-empty history window or prompt string) or `history`.');
  }

  // The provider chain fails over internally; a throw here means every provider is
  // down. `withReasoningFallback` turns that (and any empty answer) into a safe
  // human-handoff response rather than letting it reach the customer as an error.
  return withReasoningFallback(async () => {
    const result = await generateAIResponse(messages, systemInstruction, userId, businessId, model);

    // Normalise across whatever the provider chain returned. `generateAI` returns
    // { text, model, providerUsed, ... }; we surface a stable, minimal shape and
    // keep the raw payload for observability without leaking provider specifics.
    return {
      text: result?.text ?? '',
      model: result?.model,
      provider: result?.providerUsed ?? result?.provider,
      raw: result,
    };
  });
}

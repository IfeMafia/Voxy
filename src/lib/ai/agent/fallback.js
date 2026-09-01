/**
 * Structured error / fallback handling — S2 deliverable (d).
 *
 * The provider chain (`aiProvider.js`) already fails *over*: Groq → Gemini.
 * Gemini, with a circuit breaker. So by the time an exception escapes
 * `generateAIResponse`, every provider has already been tried and the whole chain
 * is down. There is no lower layer left to retry — the only correct move is to
 * stop guessing and hand the customer to a human (PRD §4.8).
 *
 * This module gives that a *shape* instead of leaking a raw stack trace to a
 * customer:
 *
 *   - a fixed, honest deflection line (never a fabricated answer — §4.1),
 *   - a typed reason so the caller / logs know *why* we're handing off,
 *   - a `handoff: true` flag on the {@link ReasoningResponse} so the surrounding
 *     route (text or voice) can route to a person, show a "get a human" affordance,
 *     or open a ticket.
 *
 * Handoff is not only for failure. `HANDOFF_REASON` also covers the cases PRD §4.8
 * names — unsupported, sensitive, or an explicit "let me talk to someone" — so
 * callers upstream can build the same structured response deliberately, not just
 * catch it.
 */

/**
 * @typedef {import('./types.js').ReasoningResponse} ReasoningResponse
 */

/**
 * The one thing Voxy says when it cannot answer safely. Deliberately does two
 * things and no more: admits it can't help right now, and promises a human — with
 * no invented facts, no fake apology for a specific product, nothing to walk back.
 * @type {string}
 */
export const SAFE_DEFLECTION =
  "I'm sorry — I can't help with that reliably right now, so I don't want to guess. " +
  'Let me bring in a member of the team to take care of this for you.';

/**
 * Why a turn is being handed to a human. Frozen so a typo throws instead of
 * silently creating a new reason.
 * @readonly
 * @enum {string}
 */
export const HANDOFF_REASON = Object.freeze({
  /** Every provider in the chain failed — no model answer is available. */
  PROVIDER_FAILURE: 'provider_failure',
  /** The request is outside what Voxy is allowed / able to do. */
  UNSUPPORTED: 'unsupported',
  /** Sensitive situation (complaint, dispute, distress) better served by a person. */
  SENSITIVE: 'sensitive',
  /** The customer explicitly asked to speak to a human. */
  EXPLICIT_REQUEST: 'explicit_request',
});

/**
 * Build a normalised handoff {@link ReasoningResponse}. Always safe to return
 * straight to a customer.
 *
 * @param {string} [reason]  One of {@link HANDOFF_REASON}.
 * @param {string} [detail]  Internal detail for logs/observability — NOT shown to the customer.
 * @param {string} [text]    Override the customer-facing line (defaults to {@link SAFE_DEFLECTION}).
 * @returns {ReasoningResponse}
 */
export function buildHandoffResponse(
  reason = HANDOFF_REASON.PROVIDER_FAILURE,
  detail = null,
  text = SAFE_DEFLECTION,
) {
  return {
    text,
    handoff: true,
    handoffReason: reason,
    error: detail,
    model: null,
    provider: null,
    raw: null,
  };
}

/**
 * Run a reasoning call and convert a total-chain failure into a safe handoff
 * response instead of an unhandled throw.
 *
 * Use this to wrap the call into `generateAIResponse` (or anything that resolves
 * to a {@link ReasoningResponse}). A thrown error means the whole provider chain
 * is down, so we return {@link buildHandoffResponse} with
 * `HANDOFF_REASON.PROVIDER_FAILURE`. A resolved-but-empty answer is treated the
 * same way: an empty string is not a safe reply to send a customer.
 *
 * @param {() => Promise<ReasoningResponse>} run  Thunk performing the reasoning call.
 * @param {{ onError?: (err: unknown) => void }} [options]  `onError` hook for logging/observability.
 * @returns {Promise<ReasoningResponse>}
 */
export async function withReasoningFallback(run, { onError } = {}) {
  try {
    const result = await run();
    if (!result || typeof result.text !== 'string' || result.text.trim() === '') {
      return buildHandoffResponse(
        HANDOFF_REASON.PROVIDER_FAILURE,
        'Provider chain returned an empty response.',
      );
    }
    return result;
  } catch (err) {
    if (typeof onError === 'function') {
      try {
        onError(err);
      } catch {
        /* never let a logging failure mask the handoff */
      }
    }
    return buildHandoffResponse(
      HANDOFF_REASON.PROVIDER_FAILURE,
      err instanceof Error ? err.message : String(err),
    );
  }
}

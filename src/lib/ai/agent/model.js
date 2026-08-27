/**
 * Reasoning-model decision — the single source of truth for S2 ("AI Model
 * Integration"). PRD §8 left the reasoning model as an open item; this module is
 * the code-side record of the choice, and `public/docs/PRD.md` §8 carries the
 * human-readable version. Keep the two in sync.
 *
 * DECISION (S2):
 *   Primary reasoning model = `gemini-2.5`, served through the Cencori gateway,
 *   with automatic fallback to Groq `llama-3.3-70b-versatile` and then Google
 *   `gemini-2.0-flash` (the ladder implemented in `src/lib/ai/aiProvider.js`).
 *
 * WHY:
 *   - Multilingual: strong coverage of the five languages V2 must speak
 *     (English, Pidgin, Yoruba, Hausa, Igbo).
 *   - Latency: fast enough for the sub-2s voice turn target (PRD §7).
 *   - Real, not aspirational: it is the model the existing resilient provider
 *     chain already routes through, so the documented fallbacks are exercised
 *     paths rather than a new, untested integration.
 *
 * This is deliberately a constant, not an env var: the *default* reasoning model
 * is a product decision that belongs in code review and the PRD, not in
 * per-environment config. Provider API keys stay in env; the model choice does
 * not.
 */

/**
 * The primary reasoning model id, as understood by the Cencori gateway
 * (`callCencoriAI`). Changing this changes what every Voxy reasoning turn asks
 * for first — update PRD §8 in the same change.
 * @type {string}
 */
export const REASONING_MODEL = 'gemini-2.5';

/**
 * The ordered fallback ladder, for documentation/observability. The actual
 * failover is implemented in `aiProvider.js`; this array is the declarative
 * description of it so tooling and logs can reason about the chain without
 * re-deriving it.
 * @type {ReadonlyArray<{ provider: string, model: string }>}
 */
export const REASONING_FALLBACKS = Object.freeze([
  { provider: 'cencori', model: REASONING_MODEL },
  { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  { provider: 'gemini', model: 'gemini-2.0-flash' },
]);

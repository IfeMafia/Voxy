/**
 * Conversation-context interface — S2 deliverable (c).
 *
 * The canonical way to turn raw conversation state (a list of past messages, an
 * optional rolling summary, and per-business grounding) into a well-formed
 * {@link ReasoningRequest}. It replaces the ad-hoc payload assembly currently done
 * inline in `/api/assistant/chat` (`buildAIPayload` + a hand-built template
 * literal), giving text and voice one shared way to prepare a turn (PRD §4.4).
 *
 * Two design decisions worth calling out:
 *
 * 1. HISTORY WINDOW. We send a bounded window, not the whole transcript: the last
 *    few turns when there is a summary, a few more when there isn't. This mirrors
 *    the existing `buildAIPayload` heuristic so behaviour is unchanged, just
 *    centralised.
 *
 * 2. THE SUMMARY GOES IN THE SYSTEM PROMPT, NOT THE MESSAGES. Only the primary
 *    provider treats a `system`-role message specially; the Groq and Gemini
 *    fallbacks coerce any non-user/assistant role to `user` (see their providers).
 *    So a "system" turn in the array would silently become a user message on
 *    fallback. Folding the summary into `systemInstruction` keeps it authoritative
 *    across every provider in the chain.
 *
 * Pure and side-effect free: it shapes what it's given and fetches nothing.
 */

import { REASONING_MODEL } from './model.js';
import { buildSystemInstruction } from './systemInstruction.js';

/**
 * @typedef {import('./types.js').ConversationTurn} ConversationTurn
 * @typedef {import('./types.js').ReasoningRequest} ReasoningRequest
 * @typedef {import('./systemInstruction.js').GroundingContext} GroundingContext
 */

/** Default number of recent turns to include when a summary IS present. */
const WINDOW_WITH_SUMMARY = 2;
/** Default number of recent turns to include when there is NO summary. */
const WINDOW_WITHOUT_SUMMARY = 5;

/**
 * Coerce one raw message — from the DB, from `buildAIPayload`, or already a
 * {@link ConversationTurn} — into a normalised `{ role, content }`.
 *
 * Accepts, defensively:
 *   - `{ role, content }`                     (already normalised)
 *   - `{ role, parts: [{ text }] }`           (Gemini / buildAIPayload shape)
 *   - `{ sender_type | sender, content|text }`(DB row shapes)
 *   - a bare string                           (treated as a user turn)
 *
 * Anything that looks like the assistant ('model' | 'assistant' | 'ai' | 'bot')
 * maps to `'model'`; everything else maps to `'user'`. Returns `null` for a turn
 * with no usable text so callers can filter it out.
 *
 * @param {*} raw
 * @returns {ConversationTurn | null}
 */
export function normalizeTurn(raw) {
  if (raw == null) return null;

  if (typeof raw === 'string') {
    const content = raw.trim();
    return content ? { role: 'user', content } : null;
  }

  const rawRole = raw.role ?? raw.sender_type ?? raw.sender ?? 'user';
  const role = ['model', 'assistant', 'ai', 'bot'].includes(String(rawRole).toLowerCase())
    ? 'model'
    : 'user';

  const content =
    raw.content ??
    raw.text ??
    (Array.isArray(raw.parts) ? raw.parts.map((p) => p?.text ?? '').join('') : '');

  const trimmed = typeof content === 'string' ? content.trim() : '';
  return trimmed ? { role, content: trimmed } : null;
}

/**
 * Normalise and filter a raw history list into `ConversationTurn[]`.
 * @param {Array<*>} [history]
 * @returns {ConversationTurn[]}
 */
export function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history.map(normalizeTurn).filter(Boolean);
}

/**
 * Keep only the trailing window of turns. The window is smaller when a summary is
 * carrying the older context.
 * @param {ConversationTurn[]} turns
 * @param {boolean} hasSummary
 * @param {{ withSummary?: number, withoutSummary?: number }} [sizes]
 * @returns {ConversationTurn[]}
 */
export function applyWindow(turns, hasSummary, sizes = {}) {
  const size = hasSummary
    ? sizes.withSummary ?? WINDOW_WITH_SUMMARY
    : sizes.withoutSummary ?? WINDOW_WITHOUT_SUMMARY;
  return turns.slice(-size);
}

/**
 * Build the canonical {@link ReasoningRequest} for one turn.
 *
 * @param {Object} input
 * @param {Array<*>} [input.history]        Raw prior messages (any supported shape).
 * @param {string}   [input.summary]        Rolling conversation summary, if any.
 * @param {GroundingContext} [input.grounding] Approved per-business grounding for the system prompt.
 * @param {string}   [input.systemInstruction] Pre-built system prompt; overrides `grounding` when given.
 * @param {string}   [input.userId]
 * @param {string}   [input.businessId]
 * @param {string}   [input.model]          Reasoning model id; defaults to the locked choice.
 * @param {{ withSummary?: number, withoutSummary?: number }} [input.windowSizes]
 * @returns {ReasoningRequest & { model: string }}
 */
export function buildReasoningRequest({
  history = [],
  summary = '',
  grounding = {},
  systemInstruction,
  userId = null,
  businessId = null,
  model = REASONING_MODEL,
  windowSizes,
} = {}) {
  const trimmedSummary = typeof summary === 'string' ? summary.trim() : '';
  const hasSummary = Boolean(trimmedSummary);

  const messages = applyWindow(normalizeHistory(history), hasSummary, windowSizes);

  let instruction = systemInstruction ?? buildSystemInstruction(grounding);
  if (hasSummary) {
    instruction +=
      `\n\n--- CONVERSATION SO FAR (your memory of earlier turns) ---\n${trimmedSummary}\n--- END CONVERSATION SO FAR ---`;
  }

  return { messages, systemInstruction: instruction, userId, businessId, model };
}

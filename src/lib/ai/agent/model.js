/**
 * Locked active AI Reasoning Models for Voxy
 *
 * Provider Rotation Order:
 *   1. Mistral  (`mistral-small-latest`)  — primary, tool-capable, cost-efficient
 *   2. Groq     (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`) — secondary, multi-key rotation
 *   3. Gemini   (`gemini-2.0-flash`)      — final fallback
 */

export const REASONING_MODEL = 'mistral-small-latest';

export const REASONING_FALLBACKS = Object.freeze([
  { provider: 'mistral', model: 'mistral-small-latest' },
  { provider: 'groq',    model: 'openai/gpt-oss-120b' },
  { provider: 'groq',    model: 'openai/gpt-oss-20b'  },
  { provider: 'gemini',  model: 'gemini-2.0-flash'    },
]);

/**
 * Locked active AI Reasoning Models for Voxy
 *
 * Provider Rotation Order:
 *   1. Gemini   (`gemini-2.0-flash`)      — primary: 15 RPM, 1M TPM, no daily cap
 *   2. Groq     (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`) — secondary, multi-key rotation
 *   3. Mistral  (`mistral-small-latest`)  — final fallback
 */

export const REASONING_MODEL = 'gemini-2.0-flash';

export const REASONING_FALLBACKS = Object.freeze([
  { provider: 'gemini',  model: 'gemini-2.0-flash'      },
  { provider: 'groq',    model: 'openai/gpt-oss-120b'   },
  { provider: 'groq',    model: 'openai/gpt-oss-20b'    },
  { provider: 'mistral', model: 'mistral-small-latest'  },
]);

/**
 * Locked active AI Reasoning Models for Voxy
 *
 * Primary Provider: Groq (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`)
 * Fallback Provider: Google Gemini (`gemini-2.0-flash`)
 */

export const REASONING_MODEL = 'openai/gpt-oss-120b';

export const REASONING_FALLBACKS = Object.freeze([
  { provider: 'groq', model: 'openai/gpt-oss-120b' },
  { provider: 'groq', model: 'openai/gpt-oss-20b' },
  { provider: 'gemini', model: 'gemini-2.0-flash' }
]);



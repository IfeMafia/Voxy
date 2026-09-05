/**
 * Reasoning-model choice — direct provider execution without middleman gateways.
 *
 * Primary reasoning models:
 *   - Groq (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `groq/compound`) for ultra-low latency (< 500ms voice turns).
 *   - Google Gemini (`gemini-2.0-flash`) as resilient fallback.
 */

export const REASONING_MODEL = 'openai/gpt-oss-120b';

export const REASONING_FALLBACKS = Object.freeze([
  { provider: 'groq', model: 'openai/gpt-oss-120b' },
  { provider: 'groq', model: 'openai/gpt-oss-20b' },
  { provider: 'groq', model: 'groq/compound' },
  { provider: 'groq', model: 'groq/compound-mini' },
  { provider: 'groq', model: 'qwen/qwen3.8-27b' },
  { provider: 'gemini', model: 'gemini-2.0-flash' },
]);

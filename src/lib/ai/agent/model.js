/**
 * Reasoning-model choice — direct provider execution without middleman gateways.
 *
 * Primary reasoning models:
 *   - Groq (`llama-3.3-70b-versatile`) for ultra-low latency (< 500ms voice turns).
 *   - Google Gemini (`gemini-2.0-flash`) as resilient fallback.
 */

export const REASONING_MODEL = 'openai/gpt-oss-120b';

export const REASONING_FALLBACKS = Object.freeze([
  { provider: 'groq', model: 'openai/gpt-oss-120b' },
  { provider: 'groq', model: 'openai/gpt-oss-20b' },
  { provider: 'groq', model: 'groq/compound' },
]);


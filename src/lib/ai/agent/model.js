/**
 * Reasoning-model choice — direct provider execution without middleman gateways.
 *
 * Primary reasoning models:
 *   - Groq (`llama-3.3-70b-versatile`) for ultra-low latency (< 500ms voice turns).
 *   - Google Gemini (`gemini-2.0-flash`) as resilient fallback.
 */

export const REASONING_MODEL = 'llama-3.3-70b-versatile';

export const REASONING_FALLBACKS = Object.freeze([
  { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  { provider: 'groq', model: 'llama-3.1-8b-instant' },
  { provider: 'groq', model: 'llama3-70b-8192' },
  { provider: 'groq', model: 'mixtral-8x7b-32768' },
  { provider: 'gemini', model: 'gemini-2.0-flash' },
]);


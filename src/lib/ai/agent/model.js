/**
 * Locked active AI Reasoning Models for Voxy
 *
 * Primary Model:  `openai/gpt-oss-120b` (Groq - 265ms response time)
 * Secondary Model: `meta-llama/llama-3.3-70b-instruct` (OpenRouter)
 */

export const REASONING_MODEL = 'openai/gpt-oss-120b';

export const REASONING_FALLBACKS = Object.freeze([
  { provider: 'groq', model: 'openai/gpt-oss-120b' },
  { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct' }
]);


import { sanitizePrompt } from './prompt-sanitizer.js';

/**
 * Security & Input Protection Layer
 * Protects against prompt injection, PII leakage, and malicious intent.
 * 
 * @param {string} input
 * @returns {Promise<{ safe: boolean, sanitizedInput: string, riskLevel: string, wasSanitized: boolean, flags: string[] }>}
 */
export async function runSecurityChecks(input) {
  if (!input || typeof input !== 'string') {
    return { safe: true, sanitizedInput: input, riskLevel: 'low', flags: [] };
  }

  // 1. DETECTION
  const injectionPatterns = [
    { id: 'HIJACK', regex: /ignore (all )?previous instructions/i, risk: 'high' },
    { id: 'LEAK', regex: /system prompt/i, risk: 'high' },
    { id: 'OVERRIDE', regex: /override/i, risk: 'medium' },
    { id: 'DESTRUCTIVE', regex: /delete (all|user|database)/i, risk: 'high' }
  ];

  const piiPatterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /\+?[0-9]{10,15}/g
  };

  const matchedFlags = injectionPatterns.filter(p => p.regex.test(input));
  const hasPII = piiPatterns.email.test(input) || piiPatterns.phone.test(input);

  // Determine Overall Risk
  const riskLevel = matchedFlags.some(f => f.risk === 'high') ? 'high' 
                  : (matchedFlags.length > 0 || hasPII) ? 'medium' 
                  : 'low';

  // 2. SANITIZATION
  let sanitized = sanitizePrompt(input);
  
  // Mask PII
  sanitized = sanitized.replace(piiPatterns.email, '[PROTECTED_EMAIL]');
  sanitized = sanitized.replace(piiPatterns.phone, '[PROTECTED_PHONE]');

  const wasSanitized = sanitized !== input;
  const isSafe = riskLevel !== 'high' || wasSanitized;

  return {
    safe: isSafe,
    sanitizedInput: sanitized,
    riskLevel,
    wasSanitized,
    flags: matchedFlags.map(f => f.id)
  };
}

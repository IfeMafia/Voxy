import { franc } from 'franc';

/**
 * VOXY Multilingual Support & Language Detection Module (Task S11 / IFE-42)
 *
 * Provides language auto-detection (using `franc` + Nigerian Pidgin heuristics),
 * explicit language preference overrides, and business policy fallback logic for:
 *   - English (en)
 *   - Nigerian Pidgin (pcm)
 *   - Yoruba (yo)
 *   - Hausa (ha)
 *   - Igbo (ig)
 */

export const LANGUAGE_REGISTRY = {
  en: { code: 'en', iso639_3: 'eng', name: 'English' },
  pcm: { code: 'pcm', iso639_3: 'pcm', name: 'Nigerian Pidgin' },
  yo: { code: 'yo', iso639_3: 'yor', name: 'Yoruba' },
  ha: { code: 'ha', iso639_3: 'hau', name: 'Hausa' },
  ig: { code: 'ig', iso639_3: 'ibo', name: 'Igbo' },
};

const LANG_MAP = {
  yor: 'yo',
  ibo: 'ig',
  hau: 'ha',
  eng: 'en',
  pcm: 'pcm',
};

const CODE_TO_NAME = {
  en: 'English',
  pcm: 'Nigerian Pidgin',
  yo: 'Yoruba',
  ha: 'Hausa',
  ig: 'Igbo',
};

const ALIAS_MAP = {
  english: 'en',
  en: 'en',
  eng: 'en',
  pidgin: 'pcm',
  pcm: 'pcm',
  'nigerian pidgin': 'pcm',
  yoruba: 'yo',
  yo: 'yo',
  yor: 'yo',
  hausa: 'ha',
  ha: 'ha',
  hau: 'ha',
  igbo: 'ig',
  ig: 'ig',
  ibo: 'ig',
};

// Common Nigerian Pidgin markers & n-grams for fast detection
const PIDGIN_MARKERS = [
  /\bhow\s+far\b/i,
  /\bwetin\b/i,
  /\bdey\b/i,
  /\babeg\b/i,
  /\bno\s+be\b/i,
  /\bsha\b/i,
  /\bna\s+so\b/i,
  /\bpikin\b/i,
  /\babi\b/i,
  /\bmake\s+i\b/i,
  /\bshey\b/i,
  /\bunah\b/i,
  /\bgo\s+dey\b/i,
  /\boya\b/i,
  /\bgbagbe\b/i,
  /\bwaka\b/i,
  /\bchop\b/i,
  /\bfit\s+pay\b/i,
  /\bwan\s+buy\b/i,
  /\bna\b/i,
];

/**
 * Checks if input text exhibits Nigerian Pidgin characteristics.
 * @param {string} text
 * @returns {boolean}
 */
export function isPidgin(text) {
  if (!text || typeof text !== 'string') return false;
  return PIDGIN_MARKERS.some((regex) => regex.test(text));
}

/**
 * Normalize any input language identifier string (code or name) to standard code.
 * @param {string} lang
 * @returns {string} Standard code ('en', 'pcm', 'yo', 'ha', 'ig')
 */
export function normalizeLanguageCode(lang) {
  if (!lang || typeof lang !== 'string') return 'en';
  const clean = lang.trim().toLowerCase();
  return ALIAS_MAP[clean] || 'en';
}

/**
 * Normalize code to human-readable language name.
 * @param {string} code
 * @returns {string}
 */
export function getLanguageName(code) {
  const normCode = normalizeLanguageCode(code);
  return CODE_TO_NAME[normCode] || 'English';
}

/**
 * Detect language from message text.
 *
 * @param {string} text - Input text
 * @returns {{ langCode: string, langName: string, raw: string }}
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { langCode: 'en', langName: 'English', raw: 'und' };
  }

  const cleaned = text.trim();

  // 1. Check Pidgin heuristics first (since franc lacks native Pidgin n-gram model)
  if (isPidgin(cleaned)) {
    return { langCode: 'pcm', langName: 'Nigerian Pidgin', raw: 'pcm' };
  }

  // 2. Short inputs default to English unless Pidgin markers were found
  if (cleaned.length < 8) {
    return { langCode: 'en', langName: 'English', raw: 'short' };
  }

  // 3. Run franc detection over target Nigerian languages & English
  const detected = franc(cleaned, {
    only: ['eng', 'yor', 'hau', 'ibo'],
    minLength: 3,
  });

  if (detected === 'und' || !LANG_MAP[detected]) {
    return { langCode: 'en', langName: 'English', raw: detected };
  }

  const code = LANG_MAP[detected];
  return {
    langCode: code,
    langName: CODE_TO_NAME[code] || 'English',
    raw: detected,
  };
}

/**
 * Resolves effective language for a message turn, taking into account:
 * 1. Explicit customer/business language preference override (if provided)
 * 2. Automatic language detection (franc + Pidgin heuristics)
 * 3. Business supportedLanguages policy validation & graceful fallback
 *
 * @param {Object} params
 * @param {string} [params.text] - Incoming customer message
 * @param {string} [params.preferredLanguage] - Explicit language override ('yo', 'Pidgin', 'ha', etc.)
 * @param {string[]} [params.supportedLanguages] - Languages allowed by business profile (defaults to ['en'])
 * @returns {{
 *   langCode: string,
 *   langName: string,
 *   isSupported: boolean,
 *   isFallback: boolean,
 *   detectedCode: string,
 *   requestedCode: string
 * }}
 */
export function resolveLanguage({ text = '', preferredLanguage = null, supportedLanguages = null } = {}) {
  // 1. Determine requested/detected language code
  let requestedCode = null;
  let detectedCode = 'en';

  if (text && typeof text === 'string' && text.trim().length > 0) {
    const det = detectLanguage(text);
    detectedCode = det.langCode;
  }

  if (preferredLanguage && typeof preferredLanguage === 'string' && preferredLanguage.trim().length > 0) {
    requestedCode = normalizeLanguageCode(preferredLanguage);
  } else {
    requestedCode = detectedCode;
  }

  // 2. Resolve business supported languages (normalize list, defaulting to ['en'])
  let allowedCodes = ['en'];
  if (Array.isArray(supportedLanguages) && supportedLanguages.length > 0) {
    allowedCodes = supportedLanguages.map((l) => normalizeLanguageCode(l));
  }

  // 3. Evaluate support & fallback
  const isSupported = allowedCodes.includes(requestedCode);
  const finalCode = isSupported ? requestedCode : (allowedCodes[0] || 'en');
  const isFallback = !isSupported;

  return {
    langCode: finalCode,
    langName: CODE_TO_NAME[finalCode] || 'English',
    isSupported,
    isFallback,
    detectedCode,
    requestedCode,
  };
}

export default {
  LANGUAGE_REGISTRY,
  isPidgin,
  normalizeLanguageCode,
  getLanguageName,
  detectLanguage,
  resolveLanguage,
};

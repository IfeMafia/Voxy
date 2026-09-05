import { franc } from 'franc';

/**
 * VOXY Multilingual Support & Language Detection Module (Task S11 / IFE-42)
 *
 * Provides language auto-detection (using `franc` + Nigerian Pidgin, Yoruba, Hausa & Igbo heuristics),
 * explicit language preference overrides, business-level gating, and policy fallback logic for:
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

// Fast English markers to prevent false-positive mis-classifications on short queries
const ENGLISH_MARKERS = [
  /\b(i\s+want|how\s+much|what\s+is|show\s+me|do\s+you\s+have|can\s+i|price|order|buy|laptop|phone|macbook|iphone|hello|hi|thanks|thank\s+you)\b/i,
];

// Fast Nigerian Pidgin markers & n-grams for informal detection
const PIDGIN_MARKERS = [
  /\bhow\s+far\b/i,
  /\bhow\s+(you|u|body)\s+dey\b/i,
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
  /\bunah?\b/i,
  /\bgo\s+dey\b/i,
  /\boya\b/i,
  /\bgbagbe\b/i,
  /\bwaka\b/i,
  /\bchop\b/i,
  /\bfit\b/i,
  /\bwan\b/i,
  /\bcommot\b/i,
  /\bdon\b/i,
  /\bwey\b/i,
  /\bsef\b/i,
  /\bgat\b/i,
  /\bkuku\b/i,
  /\bdem\b/i,
  /\bna\b/i,
];

const YORUBA_MARKERS = [
  /\bbawo\b/i,
  /\bẹ?\s*kàásán\b/i,
  /\bekaaro\b/i,
  /\bekasan\b/i,
  /\beku\s+irole\b/i,
  /\bmo\s+fe\b/i,
  /\bjowo\b/i,
  /\bese\s+o\b/i,
  /\bse\s+dada\b/i,
  /\bse\s+alaafia\b/i,
  /\bki\s+ni\b/i,
  /\belo\s+ni\b/i,
  /\bawa\b/i,
  /\bwon\b/i,
];

const HAUSA_MARKERS = [
  /\bsannu\b/i,
  /\bina\s+kwana\b/i,
  /\bnagode\b/i,
  /\byaya\b/i,
  /\bmuna\s+da\b/i,
  /\bnawa\s+ne\b/i,
  /\bsai\s+an\s+juma\b/i,
];

const IGBO_MARKERS = [
  /\bndeewo\b/i,
  /\bkedu\b/i,
  /\bdaalu\b/i,
  /\bbiko\b/i,
  /\bimela\b/i,
  /\bnnọọ\b/i,
  /\bego\s+ole\b/i,
  /\bka\s+odi\b/i,
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

  // 1. Fast heuristic check for Pidgin & local Nigerian phrases
  if (isPidgin(cleaned)) {
    return { langCode: 'pcm', langName: 'Nigerian Pidgin', raw: 'pcm' };
  }
  if (YORUBA_MARKERS.some((regex) => regex.test(cleaned))) {
    return { langCode: 'yo', langName: 'Yoruba', raw: 'yo' };
  }
  if (HAUSA_MARKERS.some((regex) => regex.test(cleaned))) {
    return { langCode: 'ha', langName: 'Hausa', raw: 'ha' };
  }
  if (IGBO_MARKERS.some((regex) => regex.test(cleaned))) {
    return { langCode: 'ig', langName: 'Igbo', raw: 'ig' };
  }

  // 2. Fast check for common English phrases
  if (ENGLISH_MARKERS.some((regex) => regex.test(cleaned))) {
    return { langCode: 'en', langName: 'English', raw: 'eng' };
  }

  // 3. Short inputs without specific markers default to English
  if (cleaned.length < 10) {
    return { langCode: 'en', langName: 'English', raw: 'short' };
  }

  // 4. Run franc detection over target Nigerian languages & English
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
 * 1. Business-level gating check (isMultilingualEnabled)
 * 2. Explicit customer/business language preference override (if provided)
 * 3. Automatic language detection (franc + Pidgin & local heuristics)
 * 4. Session language thread persistence across code-switches
 * 5. Business supportedLanguages policy validation & graceful fallback
 *
 * @param {Object} params
 * @param {string} [params.text] - Incoming customer message
 * @param {string} [params.preferredLanguage] - Explicit language override ('yo', 'Pidgin', 'ha', etc.)
 * @param {string} [params.currentSessionLanguage] - Previously established conversation language ('pcm', 'yo', etc.)
 * @param {string[]} [params.supportedLanguages] - Languages allowed by business profile (defaults to ['en'])
 * @returns {{
 *   langCode: string,
 *   langName: string,
 *   isSupported: boolean,
 *   isFallback: boolean,
 *   isMultilingualEnabled: boolean,
 *   detectedCode: string,
 *   requestedCode: string,
 *   allowedLanguages: string[]
 * }}
 */
export function resolveLanguage({ text = '', preferredLanguage = null, currentSessionLanguage = null, supportedLanguages = null } = {}) {
  // 1. Resolve business supported languages (normalize list, defaulting to ['en'])
  let allowedCodes = ['en'];
  if (Array.isArray(supportedLanguages) && supportedLanguages.length > 0) {
    allowedCodes = Array.from(new Set(supportedLanguages.map((l) => normalizeLanguageCode(l))));
  }

  // Check if business has multilingual support enabled
  // Multilingual is enabled if the store has configured more than 1 language or a non-English language
  const isMultilingualEnabled = allowedCodes.length > 1 || (allowedCodes.length === 1 && allowedCodes[0] !== 'en');

  // Business Gate: If business has NOT enabled multilingual support, gate it strictly to English
  if (!isMultilingualEnabled) {
    return {
      langCode: 'en',
      langName: 'English',
      isSupported: true,
      isFallback: false,
      isMultilingualEnabled: false,
      detectedCode: 'en',
      requestedCode: 'en',
      allowedLanguages: ['English'],
    };
  }

  // Multilingual IS enabled for this business!
  let detectedCode = 'en';
  if (text && typeof text === 'string' && text.trim().length > 0) {
    const det = detectLanguage(text);
    detectedCode = det.langCode;
  }

  let requestedCode = detectedCode;

  if (preferredLanguage && typeof preferredLanguage === 'string' && preferredLanguage.trim().length > 0) {
    requestedCode = normalizeLanguageCode(preferredLanguage);
  } else if (currentSessionLanguage && currentSessionLanguage !== 'en') {
    // Preserve established conversation thread language unless customer explicitly requests a language change in text
    const explicitSwitchMatch = (text || '').match(/\b(speak|switch|change|talk)\s+(in|to)\s+(english|pidgin|yoruba|hausa|igbo|en|pcm|yo|ha|ig)\b/i);
    if (explicitSwitchMatch) {
      requestedCode = normalizeLanguageCode(explicitSwitchMatch[3]);
    } else {
      requestedCode = normalizeLanguageCode(currentSessionLanguage);
    }
  }

  const isSupported = allowedCodes.includes(requestedCode);
  const finalCode = isSupported ? requestedCode : allowedCodes[0];
  const isFallback = !isSupported;

  return {
    langCode: finalCode,
    langName: getLanguageName(finalCode),
    isSupported,
    isFallback,
    isMultilingualEnabled: true,
    detectedCode,
    requestedCode,
    allowedLanguages: allowedCodes.map((c) => getLanguageName(c)),
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

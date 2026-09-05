import { generateYarnGptSpeech, YARNGPT_VOICES } from '../utils/yarnGptTts.js';
import { generateHybridSpeech } from '../utils/hybridTts.js';
import { sanitizeForSpeech } from '../utils/voiceSanitizer.js';

/**
 * Base Voice Provider Interface
 */
export class VoiceProvider {
  /**
   * Synthesize text to speech
   * @param {string} text - Input text to convert to speech
   * @param {Object} options - Provider options (voice, language, etc.)
   * @returns {Promise<{ audioUrl: string, provider: string, voice: string, cleanText: string }>}
   */
  async synthesize(text, options = {}) {
    throw new Error('synthesize method must be implemented by concrete subclass');
  }

  /**
   * Check if provider is available and configured
   * @returns {boolean}
   */
  isAvailable() {
    return true;
  }
}

/**
 * YarnGPT Provider for Authentic Nigerian Voice Synthesis
 */
export class YarnGptProvider extends VoiceProvider {
  constructor(apiKey = process.env.YARNGPT_API_KEY) {
    super();
    this.apiKey = apiKey;
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async synthesize(text, options = {}) {
    const cleanText = sanitizeForSpeech(text, options.maxLength || 400);
    if (!cleanText) {
      throw new Error('No speakable text provided for synthesis');
    }

    if (!this.isAvailable()) {
      throw new Error('YarnGPT API key is not configured');
    }

    const requestedVoice = options.voice || 'Chinenye';
    const voice = YARNGPT_VOICES.find(
      (v) => v.toLowerCase() === requestedVoice.toLowerCase()
    ) || 'Chinenye';

    const audioUrl = await generateYarnGptSpeech(cleanText, {
      voice,
      apiKey: this.apiKey,
      timeoutMs: options.timeoutMs || 12000,
    });

    return {
      audioUrl,
      provider: 'yarngpt',
      voice,
      cleanText,
    };
  }
}

/**
 * Hybrid TTS Provider (EdgeTTS / Google TTS Fallback)
 */
export class HybridTtsProvider extends VoiceProvider {
  async synthesize(text, options = {}) {
    const cleanText = sanitizeForSpeech(text, options.maxLength || 400);
    if (!cleanText) {
      throw new Error('No speakable text provided for synthesis');
    }

    const language = options.language || 'english';
    const audioUrl = await generateHybridSpeech(cleanText, language);

    return {
      audioUrl,
      provider: 'hybrid',
      voice: 'hybrid',
      cleanText,
    };
  }
}

/**
 * Resolve active voice provider dynamically with automatic fallback
 * @param {Object} options
 * @returns {VoiceProvider}
 */
export function getVoiceProvider(options = {}) {
  const yarnGpt = new YarnGptProvider(options.apiKey || process.env.YARNGPT_API_KEY);
  
  if (options.forceHybrid) {
    return new HybridTtsProvider();
  }

  if (yarnGpt.isAvailable()) {
    return yarnGpt;
  }

  return new HybridTtsProvider();
}

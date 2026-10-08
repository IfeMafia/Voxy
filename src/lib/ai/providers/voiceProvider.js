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

  isAvailable() { return true; }
}

/**
 * Automatically maps language selection to the best authentic native voice
 * unless an explicit custom business voice override was specified.
 */
export function getBestVoiceForLanguage(requestedVoice, language) {
  if (requestedVoice && requestedVoice !== 'Chinenye' && requestedVoice !== 'default') {
    return requestedVoice;
  }
  const lang = (language || '').toLowerCase().trim();
  if (lang === 'yo' || lang.includes('yoruba')) return 'Idera';
  if (lang === 'ha' || lang.includes('hausa')) return 'Zainab';
  if (lang === 'ig' || lang.includes('igbo')) return 'Chinenye';
  if (lang === 'pcm' || lang.includes('pidgin')) return 'Osagie';
  return 'Chinenye';
}

// Runtime validity flag — once a key returns 401, skip YarnGPT for the rest of the process lifetime
let _yarnGptKeyDead = false;

/**
 * YarnGPT Provider for Authentic Nigerian Voice Synthesis
 */
export class YarnGptProvider extends VoiceProvider {
  constructor(apiKey = process.env.YARNGPT_API_KEY) {
    super();
    this.apiKey = apiKey;
  }

  isAvailable() {
    if (_yarnGptKeyDead) return false;
    // YARNGPT_ENABLED=false in .env disables it without removing the key
    if (process.env.YARNGPT_ENABLED === 'false') return false;
    return Boolean(this.apiKey && this.apiKey.trim().length > 10 && !this.apiKey.startsWith('dummy'));
  }

  async synthesize(text, options = {}) {
    const cleanText = sanitizeForSpeech(text, options.maxLength || 400);
    if (!cleanText) throw new Error('No speakable text provided for synthesis');
    if (!this.isAvailable()) throw new Error('YarnGPT API key is not configured or disabled');

    const targetVoiceName = getBestVoiceForLanguage(options.voice, options.language);
    const voice = YARNGPT_VOICES.find(
      (v) => v.toLowerCase() === targetVoiceName.toLowerCase()
    ) || 'Chinenye';

    try {
      const audioUrl = await generateYarnGptSpeech(cleanText, {
        voice,
        apiKey: this.apiKey,
        timeoutMs: options.timeoutMs || 6000,
      });
      return { audioUrl, provider: 'yarngpt', voice, cleanText };
    } catch (err) {
      // 401 = invalid key — mark dead so we never try again this session
      if (err.message.includes('401') || err.message.includes('INVALID_API_KEY')) {
        console.warn('[VoiceProvider] YarnGPT key is invalid — disabling for this session.');
        _yarnGptKeyDead = true;
      }
      throw err;
    }
  }
}

/**
 * Hybrid TTS Provider (MsEdge Neural / ElevenLabs Fallback)
 */
export class HybridTtsProvider extends VoiceProvider {
  async synthesize(text, options = {}) {
    const cleanText = sanitizeForSpeech(text, options.maxLength || 400);
    if (!cleanText) throw new Error('No speakable text provided for synthesis');

    const language = options.language || 'english';
    const audioUrl = await generateHybridSpeech(cleanText, language);
    return { audioUrl, provider: 'hybrid', voice: 'hybrid', cleanText };
  }
}

/**
 * Resolve active voice provider dynamically with automatic fallback
 */
export function getVoiceProvider(options = {}) {
  if (options.forceHybrid) return new HybridTtsProvider();

  const yarnGpt = new YarnGptProvider(options.apiKey || process.env.YARNGPT_API_KEY);
  if (yarnGpt.isAvailable()) return yarnGpt;

  return new HybridTtsProvider();
}

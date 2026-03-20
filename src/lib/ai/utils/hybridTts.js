import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

/**
 * Hybrid Multilingual Text-to-Speech (Serverless-Safe)
 * 
 * Primary: MsEdge Neural Voices
 * Fallback: Direct Google Translate TTS (HTTP, no npm package validation)
 * 
 * Returns base64 Data URIs instead of writing to disk to prevent 
 * Vercel/AWS Lambda read-only filesystem crashes (ENOENT /var/task).
 * 
 * @param {string} text - The input text to convert to speech
 * @param {string} detectedLanguage - english, yoruba, igbo, or hausa
 * @returns {Promise<string>} Base64 audio data URI playable in the browser
 */
export async function generateHybridSpeech(text, detectedLanguage = 'english') {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.error('[HYBRID TTS] Empty input provided, returning null.');
    return null;
  }

  const normalizedLang = detectedLanguage?.toLowerCase() || 'english';

  // --- PRIMARY ENGINE: MsEdge Neural Voices ---
  try {
    const edgeVoiceMap = {
      'english': 'en-NG-AbeoNeural',
      'yoruba':  'yo-NG-OluNeural',
      'hausa':   'ha-NG-AminaNeural',
      'igbo':    'ig-NG-NkechiNeural',
      'unsupported': 'en-US-AriaNeural'
    };

    let selectedEdgeVoice = edgeVoiceMap[normalizedLang];
    let edgeText = text;

    if (!selectedEdgeVoice) {
      console.warn(`[HYBRID TTS: MSEDGE] Fallback active: '${normalizedLang}' is unsupported.`);
      selectedEdgeVoice = edgeVoiceMap['unsupported'];
      edgeText = "Language not supported.";
    }

    console.log(`[HYBRID TTS] Attempting Primary Engine (MsEdge) using ${selectedEdgeVoice}`);
    
    const tts = new MsEdgeTTS();
    await tts.setMetadata(selectedEdgeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // Process stream into buffer in memory
    const stream = tts.toStream(edgeText);
    const chunks = [];

    await new Promise((resolve, reject) => {
      stream.audioStream.on('data', chunk => chunks.push(chunk));
      stream.audioStream.on('end', resolve);
      stream.audioStream.on('error', reject);
    });

    const audioBuffer = Buffer.concat(chunks);
    
    // Validate: MsEdge can silently produce empty/tiny output for some voices
    if (audioBuffer.length < 1024) {
      console.warn(`[HYBRID TTS: MSEDGE] Audio buffer too small (${audioBuffer.length} bytes) for voice ${selectedEdgeVoice}. Falling back...`);
      throw new Error(`MsEdge produced insufficient audio (${audioBuffer.length} bytes)`);
    }

    console.log(`[HYBRID TTS: MSEDGE] Generated ${audioBuffer.length} bytes of audio`);
    const base64Audio = audioBuffer.toString('base64');
    
    return `data:audio/mp3;base64,${base64Audio}`;

  } catch (primaryError) {
    console.warn('[HYBRID TTS] Primary Engine (MsEdge) failed. Attempting Fallback...', primaryError.message);
    
    // --- FALLBACK ENGINE: Direct Google Translate TTS (HTTP) ---
    // Bypasses the google-tts-api npm package which rejects yo/ig/ha language codes.
    // Google Translate itself DOES support Yoruba, Igbo, and Hausa for TTS.
    try {
      const gttsLangMap = {
        'english': 'en',
        'yoruba':  'yo',
        'hausa':   'ha',
        'igbo':    'ig',
        'unsupported': 'en' 
      };

      let gttsLang = gttsLangMap[normalizedLang];
      let gttsText = text;

      if (!gttsLang) {
        gttsLang = gttsLangMap['unsupported'];
        gttsText = "Language not supported.";
      }

      console.log(`[HYBRID TTS] Using Fallback Engine (Google Translate Direct) for '${gttsLang}'`);

      const audioBuffer = await fetchGoogleTranslateTTS(gttsText, gttsLang);
      
      if (audioBuffer.length < 1024) {
        throw new Error(`Google Translate TTS produced insufficient audio (${audioBuffer.length} bytes)`);
      }

      console.log(`[HYBRID TTS: GOOGLE-DIRECT] Generated ${audioBuffer.length} bytes of audio`);
      const base64Audio = audioBuffer.toString('base64');
      return `data:audio/mp3;base64,${base64Audio}`;
      
    } catch (fallbackError) {
      console.error('[HYBRID TTS] Fallback Engine also failed:', fallbackError);
      throw new Error('All TTS engines failed to generate audio.');
    }
  }
}

/**
 * Fetch TTS audio directly from Google Translate's endpoint.
 * Supports yo, ig, ha, en — no npm package validation blocking.
 * 
 * For long text (>200 chars), splits into chunks and concatenates audio.
 * 
 * @param {string} text - Text to synthesize
 * @param {string} lang - BCP-47 language code (yo, ig, ha, en)
 * @returns {Promise<Buffer>} MP3 audio buffer
 */
async function fetchGoogleTranslateTTS(text, lang) {
  const MAX_CHUNK_LENGTH = 200;
  const textChunks = splitTextIntoChunks(text, MAX_CHUNK_LENGTH);
  const audioBuffers = [];

  for (const chunk of textChunks) {
    const encodedText = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}&textlen=${chunk.length}&ttsspeed=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Translate TTS returned ${response.status} for lang '${lang}'`);
    }

    const arrayBuffer = await response.arrayBuffer();
    audioBuffers.push(Buffer.from(arrayBuffer));
  }

  return Buffer.concat(audioBuffers);
}

/**
 * Split text into chunks at sentence/word boundaries.
 * Google Translate TTS has a ~200 character limit per request.
 */
function splitTextIntoChunks(text, maxLength) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at sentence boundary first
    let splitIdx = remaining.lastIndexOf('. ', maxLength);
    if (splitIdx === -1 || splitIdx < maxLength * 0.3) {
      // Try comma
      splitIdx = remaining.lastIndexOf(', ', maxLength);
    }
    if (splitIdx === -1 || splitIdx < maxLength * 0.3) {
      // Try space
      splitIdx = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIdx === -1 || splitIdx < maxLength * 0.3) {
      // Hard split
      splitIdx = maxLength;
    }

    chunks.push(remaining.slice(0, splitIdx + 1).trim());
    remaining = remaining.slice(splitIdx + 1).trim();
  }

  return chunks.filter(c => c.length > 0);
}

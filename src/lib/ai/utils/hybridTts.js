import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

/**
 * PRODUCTION-READY Hybrid Multilingual TTS
 *
 * Tier 1: ElevenLabs multilingual_v2 (Yoruba & Igbo) — best quality
 * Tier 2: MsEdge Neural Nigerian voices — free, fast, reliable
 */
export async function generateHybridSpeech(text, detectedLanguage = 'english') {
  if (!text || typeof text !== 'string' || text.trim() === '') return null;

  const lang = normalizeLanguage(detectedLanguage);
  const elKey = process.env.ELEVENLABS_API_KEY;

  // ─── TIER 1: ElevenLabs (Yoruba & Igbo) ───
  if (elKey && (lang === 'yoruba' || lang === 'igbo')) {
    try {
      console.log(`[TTS T1] ElevenLabs: ${lang}`);
      const audioBuffer = await queryElevenLabs(text, lang, elKey);
      if (audioBuffer && audioBuffer.length > 2000) {
        console.log(`[TTS T1] ✅ ElevenLabs Success (${audioBuffer.length}B)`);
        return `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
      }
    } catch (e) {
      console.warn(`[TTS T1] ElevenLabs failed:`, e.message);
    }
  }

  // ─── TIER 2: MsEdge Neural (reliable free Nigerian voices) ───
  const tier2 = await tryMsEdgeVoice(text, lang);
  if (tier2) return tier2;

  throw new Error('All TTS engines failed to generate audio.');
}

/** Normalize any language name or code to a canonical name */
function normalizeLanguage(lang) {
  if (!lang) return 'english';
  const l = lang.toLowerCase().trim();
  if (l === 'yo' || l.includes('yoruba')) return 'yoruba';
  if (l === 'ig' || l.includes('igbo')) return 'igbo';
  if (l === 'ha' || l.includes('hausa')) return 'hausa';
  if (l === 'pcm' || l.includes('pidgin')) return 'pidgin';
  return 'english';
}

/** Pick the best MsEdge neural voice per language */
function getMsEdgeVoice(lang) {
  const voices = {
    yoruba:  'en-NG-AbeoNeural',   // Male Nigerian — works well with Yoruba loanwords
    igbo:    'en-NG-EzinneNeural', // Female Nigerian — natural Igbo prosody
    hausa:   'en-NG-AbeoNeural',   // Nigerian English for Hausa
    pidgin:  'en-NG-AbeoNeural',   // Nigerian English for Pidgin
    english: 'en-NG-EzinneNeural', // Clean Nigerian English
  };
  return voices[lang] || 'en-NG-AbeoNeural';
}

async function queryElevenLabs(text, lang, apiKey) {
  const voiceId = lang === 'igbo'
    ? 'EXAVITQu4vr4xnSDxMaL' // Sarah — clear female for Igbo
    : 'IKne3meq5aSn9XLyUdCD'; // Charlie — authoritative male for Yoruba

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.15,
          use_speaker_boost: true
        }
      }),
    }
  );

  if (!response.ok) throw new Error(`ElevenLabs HTTP ${response.status}`);
  const ab = await response.arrayBuffer();
  return Buffer.from(ab);
}

async function tryMsEdgeVoice(text, lang) {
  try {
    const voice = getMsEdgeVoice(lang);
    console.log(`[TTS T2] MsEdge: ${voice} for ${lang}`);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    // Split long text into sentence chunks so MsEdge doesn't choke
    const chunks = splitIntoChunks(text, 800);
    const allBuffers = [];

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const streamObj = tts.toStream(chunk);
      const chunkBufs = [];

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 12000);
        streamObj.audioStream.on('data', c => chunkBufs.push(c));
        streamObj.audioStream.on('end', () => { clearTimeout(timeout); resolve(); });
        streamObj.audioStream.on('error', (e) => { clearTimeout(timeout); reject(e); });
      });

      if (chunkBufs.length > 0) allBuffers.push(Buffer.concat(chunkBufs));
    }

    const buffer = Buffer.concat(allBuffers);
    if (buffer && buffer.length > 100) {
      console.log(`[TTS T2] ✅ MsEdge Success (${buffer.length}B)`);
      return `data:audio/mp3;base64,${buffer.toString('base64')}`;
    }
    return null;
  } catch (e) {
    console.warn('[TTS T2] MsEdge failed:', e.message);
    return null;
  }
}

function splitIntoChunks(text, maxChars) {
  if (text.length <= maxChars) return [text];
  const result = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars) {
      if (current) result.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result.length ? result : [text.slice(0, maxChars)];
}

import { NextResponse } from 'next/server';
import { sanitizeForSpeech } from '@/lib/ai/utils/voiceSanitizer';
import { generateYarnGptSpeech } from '@/lib/ai/utils/yarnGptTts';
import { generateHybridSpeech } from '@/lib/ai/utils/hybridTts';

export async function POST(req) {
  try {
    const { text, language = 'english', voice = 'Chinenye' } = await req.json().catch(() => ({}));

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    // Task S10: Sanitize markdown, emojis, currency, & structure for natural voice pacing
    const cleanText = sanitizeForSpeech(text, 400);
    if (!cleanText) {
      return NextResponse.json({ success: false, error: 'No speakable text' }, { status: 400 });
    }

    let audioUrl = null;
    let provider = 'yarngpt';

    // Task S9: Attempt YarnGPT Nigerian voice synthesis if key is present
    if (process.env.YARNGPT_API_KEY) {
      try {
        audioUrl = await generateYarnGptSpeech(cleanText, { voice });
      } catch (err) {
        console.warn('[TTS Route] YarnGPT failed, falling back to hybrid TTS:', err?.message);
      }
    }

    // Fallback to EdgeTTS / Google TTS if YarnGPT not configured or failed
    if (!audioUrl) {
      provider = 'hybrid';
      audioUrl = await generateHybridSpeech(cleanText, language);
    }

    return NextResponse.json({
      success: true,
      provider,
      voice: provider === 'yarngpt' ? voice : 'hybrid',
      audioUrl,
      cleanText
    });
  } catch (error) {
    console.error('[TTS Route Error]:', error?.message);
    return NextResponse.json({
      success: false,
      error: error?.message || 'TTS generation failed'
    }, { status: 500 });
  }
}

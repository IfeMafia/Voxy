import { NextResponse } from 'next/server';
import { getVoiceProvider } from '@/lib/ai/providers/voiceProvider';

export async function POST(req) {
  try {
    const { text, language = 'english', voice = 'Chinenye' } = await req.json().catch(() => ({}));

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    let result = null;
    const provider = getVoiceProvider();

    try {
      result = await provider.synthesize(text, { voice, language });
    } catch (err) {
      console.warn('[TTS Route] Preferred provider failed, falling back to hybrid provider:', err?.message);
      const fallbackProvider = getVoiceProvider({ forceHybrid: true });
      result = await fallbackProvider.synthesize(text, { voice, language });
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      voice: result.voice,
      audioUrl: result.audioUrl,
      cleanText: result.cleanText
    });
  } catch (error) {
    console.error('[TTS Route Error]:', error?.message);
    return NextResponse.json({
      success: false,
      error: error?.message || 'TTS generation failed'
    }, { status: 500 });
  }
}


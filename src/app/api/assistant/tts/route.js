import { NextResponse } from 'next/server';
import { generateHybridSpeech } from '@/lib/ai/utils/hybridTts';

function cleanMarkdownForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/#+\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/[•\-\*]\s+/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

export async function POST(req) {
  try {
    const { text, language = 'english' } = await req.json().catch(() => ({}));

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    const cleanText = cleanMarkdownForSpeech(text);
    if (!cleanText) {
      return NextResponse.json({ success: false, error: 'No speakable text' }, { status: 400 });
    }

    // Limit length for real-time speech response (< 400 chars for low latency)
    const speakableSnippet = cleanText.length > 400 ? cleanText.slice(0, 400) + '...' : cleanText;

    const audioUrl = await generateHybridSpeech(speakableSnippet, language);

    return NextResponse.json({
      success: true,
      audioUrl,
      cleanText: speakableSnippet
    });
  } catch (error) {
    console.warn('[TTS Route] Fallback to client synthesis:', error?.message);
    return NextResponse.json({
      success: false,
      error: error?.message || 'TTS generation failed'
    }, { status: 500 });
  }
}

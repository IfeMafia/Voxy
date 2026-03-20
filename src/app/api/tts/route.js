import { NextResponse } from 'next/server';
import { detectLanguage } from '@/lib/langDetect';
import { generateHybridSpeech } from '@/lib/ai/utils/hybridTts';

/**
 * POST /api/tts
 * 
 * Standalone multilingual Text-to-Speech endpoint.
 * Uses MsEdge Neural voices (primary) + Google TTS API (fallback).
 * Supports: Yoruba (yo), Igbo (ig), Hausa (ha), English (en).
 * 
 * Request body: { "text": "user input text" }
 * Response: JSON { audioUrl: string (base64 data URI), detectedLanguage: string }
 */

// Simple in-memory rate limiter
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

// Language usage stats (in-memory)
const langUsageLog = { yoruba: 0, igbo: 0, hausa: 0, english: 0 };

function getRateLimitKey(req) {
  return req.headers.get('x-forwarded-for')
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateLimiter.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimiter.set(key, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup stale entries every 5 min
if (typeof globalThis.__ttsRateLimiterCleanup === 'undefined') {
  globalThis.__ttsRateLimiterCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimiter) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
        rateLimiter.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// Map franc langCode to hybridTts language names
const CODE_TO_LANG = {
  yo: 'yoruba',
  ig: 'igbo',
  ha: 'hausa',
  en: 'english',
};

export async function POST(req) {
  try {
    // Rate limiting
    const clientKey = getRateLimitKey(req);
    if (!checkRateLimit(clientKey)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in a minute.' },
        { status: 429 }
      );
    }

    // Parse body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { text } = body || {};

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Field "text" is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text exceeds maximum length of 5000 characters' },
        { status: 400 }
      );
    }

    // Detect language offline via franc
    const detection = detectLanguage(text);
    const hybridLang = CODE_TO_LANG[detection.langCode] || 'english';

    console.log(`[TTS API] Detected: ${hybridLang} (franc raw: ${detection.raw})`);

    // Track usage
    if (langUsageLog[hybridLang] !== undefined) {
      langUsageLog[hybridLang]++;
    }

    // Generate speech via existing hybrid engine (MsEdge → Google TTS fallback)
    const audioDataUri = await generateHybridSpeech(text.trim(), hybridLang);

    if (!audioDataUri) {
      return NextResponse.json(
        { error: 'Failed to generate audio' },
        { status: 500 }
      );
    }

    console.log(`[TTS API] Generated audio for "${text.slice(0, 50)}..." [${hybridLang}]`);

    return NextResponse.json({
      success: true,
      audioUrl: audioDataUri,
      detectedLanguage: hybridLang,
      langCode: detection.langCode,
    });
  } catch (error) {
    console.error('[TTS API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during speech synthesis' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tts — Health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'voxy-tts',
    engine: 'hybrid (MsEdge Neural + Google TTS)',
    supportedLanguages: [
      'yoruba (yo-NG-OluNeural)',
      'igbo (ig-NG-NkechiNeural)',
      'hausa (ha-NG-AminaNeural)',
      'english (en-NG-AbeoNeural)',
    ],
    usage: langUsageLog,
  });
}

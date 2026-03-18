import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Import the existing chat handler to prevent logic duplication
import { POST as handleChatGenerate } from '@/app/api/assistant/chat/route';

async function transcribeAudio(audioBlob) {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    // Groq's high-speed Whisper model
    formData.append("model", "whisper-large-v3-turbo"); 

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq STT Error Object:", errText);
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Groq STT Error:', error);
    throw new Error('Speech-to-Text conversion failed');
  }
}

async function generateChatResponse(conversationId, transcript) {
  // 1. Save transcript as a customer message first
  await db.query(
    'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3)',
    [conversationId, 'customer', transcript]
  );

  // 2. Wrap conversationId in a fake Request to reuse the exact chat logic endpoint
  const mockReq = new Request('http://localhost/api/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId }),
  });

  // 3. Call the handler natively
  const chatRes = await handleChatGenerate(mockReq);
  const chatData = await chatRes.json();

  if (!chatData.success || !chatData.message) {
    throw new Error(chatData.error || 'Failed to generate chat response from AI');
  }

  // AI response is safely stored in DB already by handleChatGenerate
  return chatData.message.content;
}

async function generateSpeech(text) {
  try {
    const tempFileName = `tts_${crypto.randomBytes(8).toString('hex')}.mp3`;
    const tempDir = path.join(process.cwd(), 'public', 'temp_voice');
    
    // Ensure directory exists
    await fs.mkdir(tempDir, { recursive: true }).catch(() => {});
    
    const filePath = path.join(tempDir, tempFileName);
    
    // Use MsEdgeTTS for high-quality, free natural voice
    // en-US-AriaNeural is a highly realistic standard female Microsoft Edge voice
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    await tts.toFile(filePath, text);
    
    // AUTO-CLEANUP: Schedule file deletion after 5 minutes to prevent server disk bloat
    setTimeout(() => {
      fs.unlink(filePath)
        .then(() => console.log(`[VOICE CLEANUP] Auto-deleted ${tempFileName}`))
        .catch(err => console.error(`[VOICE CLEANUP] Failed to delete ${tempFileName}:`, err));
    }, 5 * 60 * 1000); // 5 minutes in ms
    
    return `/temp_voice/${tempFileName}`;
  } catch (error) {
    console.error('TTS Error:', error);
    throw new Error('Text-to-Speech conversion failed');
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio');
    const conversationId = formData.get('conversationId');

    if (!audioBlob || !conversationId) {
      return NextResponse.json({ success: false, error: 'Audio file and conversation ID are required' }, { status: 400 });
    }

    // 1. Convert Audio to Text (using Groq Whisper)
    const transcript = await transcribeAudio(audioBlob);
    if (!transcript.trim()) {
      return NextResponse.json({ success: false, error: 'Could not transcribe any speech' }, { status: 400 });
    }

    console.log(`[VOICE] Transcribed: "${transcript}"`);

    // 2. Chat Processing (Ensures scope, context, DB logging)
    const aiResponseText = await generateChatResponse(conversationId, transcript);
    console.log(`[VOICE] AI Response: "${aiResponseText}"`);

    // 3. Convert Text to Speech (using Google TTS)
    let audioUrl = null;
    if (aiResponseText) {
      audioUrl = await generateSpeech(aiResponseText);
    }

    return NextResponse.json({ 
      success: true, 
      text: transcript,
      aiText: aiResponseText,
      audioUrl 
    });

  } catch (error) {
    console.error('Voice Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

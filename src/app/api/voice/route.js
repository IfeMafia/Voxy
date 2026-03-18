import { NextResponse } from 'next/server';
import db from '@/lib/db';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Import the existing chat handler to prevent logic duplication
import { POST as handleChatGenerate } from '@/app/api/assistant/chat/route';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function transcribeAudio(audioFile) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });
    return transcription.text;
  } catch (error) {
    console.error('Whisper STT Error:', error);
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
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Create a local temp file in the public directory to serve directly
    const tempFileName = `tts_${crypto.randomBytes(8).toString('hex')}.mp3`;
    const tempDir = path.join(process.cwd(), 'public', 'temp_voice');
    
    // Ensure directory exists
    await fs.mkdir(tempDir, { recursive: true }).catch(() => {});
    
    const filePath = path.join(tempDir, tempFileName);
    await fs.writeFile(filePath, buffer);
    
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

    // Convert Blob to File object for OpenAI API
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
    const audioFile = new File([audioBuffer], "audio.webm", {
       type: audioBlob.type || 'audio/webm',
    });

    // 1. Convert Audio to Text (STT)
    const transcript = await transcribeAudio(audioFile);
    if (!transcript.trim()) {
      return NextResponse.json({ success: false, error: 'Could not transcribe any speech' }, { status: 400 });
    }

    console.log(`[VOICE] Transcribed: "${transcript}"`);

    // 2. Chat Processing (Ensures scope, context, DB logging)
    const aiResponseText = await generateChatResponse(conversationId, transcript);
    console.log(`[VOICE] AI Response: "${aiResponseText}"`);

    // 3. Convert Text to Speech (TTS)
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

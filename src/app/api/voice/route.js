import { NextResponse } from 'next/server';
import db from '@/lib/db';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { generateHybridSpeech } from '@/lib/ai/utils/hybridTts';
import { detectLanguageGemini } from '@/lib/ai/utils/language';
import { trackUsage } from '@/lib/tracking';
import { transcribeAudioHybrid } from '@/lib/ai/utils/hybridStt';
import { getBaseUrl } from '@/lib/utils';

// Import the existing chat handler to prevent logic duplication
import { POST as handleChatGenerate } from '@/app/api/assistant/chat/route';

async function transcribeAudio(audioBlob) {
  try {
    return await transcribeAudioHybrid(audioBlob, "audio/webm");
  } catch (error) {
    console.error('Voice Route STT Error:', error);
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
  const mockReq = new Request(`${getBaseUrl()}/api/assistant/chat`, {
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
  return {
    text: chatData.message.content,
    language: chatData.language || 'english'
  };
}

// Removed generateGoogleSpeech -> delegated to generateHybridSpeech in src/lib/ai/utils/hybridTts.js

export async function POST(req) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio');
    const conversationId = formData.get('conversationId');
    const role = formData.get('role'); // Added: Role of the sender ('customer' or 'owner')

    if (!audioBlob || !conversationId) {
      return NextResponse.json({ success: false, error: 'Audio file and conversation ID are required' }, { status: 400 });
    }

    const convRes = await db.query('SELECT business_id FROM conversations WHERE id = $1', [conversationId]);
    const businessId = convRes.rows[0]?.business_id;

    // 1. Convert Audio to Text (using Groq Whisper)
    const sttStartTime = Date.now();
    const transcript = await transcribeAudio(audioBlob);
    const sttDurationSeconds = Math.round((Date.now() - sttStartTime) / 1000) || 1;
    
    if (businessId) {
      await trackUsage({
        businessId,
        type: 'stt',
        tokensUsed: null,
        duration: sttDurationSeconds,
        costEstimate: sttDurationSeconds * 0.0001 // ~$0.006 per min
      });
    }
    if (!transcript.trim()) {
      return NextResponse.json({ success: false, error: 'Could not transcribe any speech' }, { status: 400 });
    }

    console.log(`[VOICE] Role: ${role}, Transcribed: "${transcript}"`);

    // 2. Chat Processing (Ensures scope, context, DB logging)
    let aiResponseText = null;
    let detectedLanguage = 'english';
    
    // ONLY generate AI response if it's a CUSTOMER speaking
    if (role !== 'owner') {
      // 2a. Detect Language early for voice flow early rejection
      detectedLanguage = await detectLanguageGemini(transcript);
      console.log(`[VOICE] Detected Language: ${detectedLanguage}`);

      if (detectedLanguage === 'unsupported') {
        aiResponseText = "Sorry, this language is not supported. Please use English, Yoruba, Hausa, or Igbo.";
        detectedLanguage = 'english'; // Default to English for the rejection audio
        
        // Save the customer message and AI rejection to DB
        await db.query(
          'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3)',
          [conversationId, 'customer', transcript]
        );
        await db.query(
          'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3)',
          [conversationId, 'ai', aiResponseText]
        );
      } else {
        const chatResponse = await generateChatResponse(conversationId, transcript);
        aiResponseText = chatResponse.text;
        detectedLanguage = chatResponse.language;
        console.log(`[VOICE] AI Response (${detectedLanguage}): "${aiResponseText}"`);
      }
    } else {
      // If it's the owner, just save the message to DB and don't trigger AI
      await db.query(
        'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3)',
        [conversationId, 'owner', transcript]
      );
    }

    // 3. Convert Text to Speech (using Hybrid TTS: MsEdge Primary, GoogleTTS API Fallback)
    let audioUrl = null;
    if (aiResponseText) {
      const ttsStartTime = Date.now();
      // Requirement: Free High-quality Generation
      audioUrl = await generateHybridSpeech(aiResponseText, detectedLanguage);
      const ttsDurationSeconds = Math.round((Date.now() - ttsStartTime) / 1000) || 1;
      
      if (businessId) {
        await trackUsage({
          businessId,
          type: 'tts',
          tokensUsed: aiResponseText.length, // track characters as tokens for TTS
          duration: ttsDurationSeconds,
          costEstimate: aiResponseText.length * 0.000015 // MsEdge rate approximation or 0
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      text: transcript,
      aiText: aiResponseText,
      audioUrl 
    });

  } catch (error) {
    console.error('Voice Route Error:', error);
    const status = error.message?.includes('NO_CREDITS') ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function DELETE(req) {
  try {
    const { url } = await req.json();
    if (!url || !url.startsWith('/temp_voice/')) {
      return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
    }

    const fileName = url.replace('/temp_voice/', '');
    const filePath = path.join(process.cwd(), 'public', 'temp_voice', fileName);

    if (fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
      console.log(`[VOICE] Manually deleted ${fileName}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Voice Delete Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

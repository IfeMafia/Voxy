import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { detectLanguageGemini } from '@/lib/ai/utils/language';

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
  return {
    text: chatData.message.content,
    language: chatData.language || 'english'
  };
}

async function generateSpeech(text, language = 'english') {
  try {
    const tempFileName = `tts_${crypto.randomBytes(8).toString('hex')}.mp3`;
    const tempDir = path.join(process.cwd(), 'public', 'temp_voice');
    
    // Ensure directory exists
    if (!fs.existsSync(tempDir)) {
      await fsPromises.mkdir(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, tempFileName);
    
    const tts = new MsEdgeTTS();
    
    // Voice Mapping for Nigerian context
    const voiceMap = {
      'english': 'en-NG-AbeoNeural',
      'yoruba': 'yo-NG-OluNeural',
      'hausa': 'ha-NG-AminaNeural',
      'igbo': 'ig-NG-NkechiNeural'
    };
    
    const selectedVoice = voiceMap[language] || voiceMap['english'];
    console.log(`[VOICE] Using TTS voice: ${selectedVoice} for language: ${language}`);
    
    await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // Use manual stream to fix the weird ENOENT: .../xxx.mp3/audio.mp3 on some systems
    const stream = tts.toStream(text);
    const writer = fs.createWriteStream(filePath);
    stream.audioStream.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', (err) => {
        console.error('Writer Stream Error:', err);
        reject(err);
      });
    });
    
    // AUTO-CLEANUP: Schedule file deletion after 15 minutes (as requested: "audio is deleting to early")
    setTimeout(async () => {
      try {
        if (fs.existsSync(filePath)) {
          await fsPromises.unlink(filePath);
          console.log(`[VOICE CLEANUP] Auto-deleted ${tempFileName}`);
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`[VOICE CLEANUP] Failed to delete ${tempFileName}:`, err);
        }
      }
    }, 15 * 60 * 1000); // 15 minutes
    
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
    const role = formData.get('role'); // Added: Role of the sender ('customer' or 'owner')

    if (!audioBlob || !conversationId) {
      return NextResponse.json({ success: false, error: 'Audio file and conversation ID are required' }, { status: 400 });
    }

    // 1. Convert Audio to Text (using Groq Whisper)
    const transcript = await transcribeAudio(audioBlob);
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

    // 3. Convert Text to Speech (using Edge TTS) - Only if we have an AI response
    let audioUrl = null;
    if (aiResponseText) {
      audioUrl = await generateSpeech(aiResponseText, detectedLanguage);
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

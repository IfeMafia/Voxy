import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createConversationEngine } from '@/lib/ai/agent/conversationEngine';
import { transcribeAudioHybrid } from '@/lib/ai/utils/hybridStt';
import { getVoiceProvider } from '@/lib/ai/providers/voiceProvider';
import { getAuthUser } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const startTime = Date.now();

  try {
    let businessId = null;
    let conversationId = null;
    let customerId = null;
    let userMessage = null;
    let voice = 'Chinenye';
    let audioBuffer = null;
    let mimeType = 'audio/webm';

    let preferredLanguage = null;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      businessId = formData.get('businessId');
      conversationId = formData.get('conversationId');
      customerId = formData.get('customerId');
      userMessage = formData.get('message');
      voice = formData.get('voice') || 'Chinenye';
      preferredLanguage = formData.get('language') || formData.get('preferredLanguage') || null;

      const audioFile = formData.get('audio');
      if (audioFile && typeof audioFile.arrayBuffer === 'function') {
        const arrayBuffer = await audioFile.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
        mimeType = audioFile.type || 'audio/webm';
      }
    } else {
      const body = await req.json().catch(() => ({}));
      businessId = body.businessId;
      conversationId = body.conversationId;
      customerId = body.customerId;
      userMessage = body.message;
      voice = body.voice || 'Chinenye';
      preferredLanguage = body.language || body.preferredLanguage || null;
      
      if (body.audioBase64) {
        audioBuffer = Buffer.from(body.audioBase64, 'base64');
        mimeType = body.mimeType || 'audio/webm';
      }
    }

    const authUser = getAuthUser(req);
    if (!businessId && authUser?.businessId) {
      businessId = authUser.businessId;
    }

    if (!businessId && conversationId && prisma?.conversation?.findUnique) {
      try {
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { businessId: true }
        });
        if (conv?.businessId) {
          businessId = conv.businessId;
        }
      } catch (e) {}
    }

    if (!businessId && prisma?.business?.findFirst) {
      try {
        const firstBiz = await prisma.business.findFirst({ select: { id: true } });
        if (firstBiz?.id) {
          businessId = firstBiz.id;
        }
      } catch (e) {}
    }

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'businessId is required' },
        { status: 400 }
      );
    }

    // Business authorization check if user is authenticated
    if (authUser && authUser.businessId && authUser.businessId !== businessId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized cross-business voice interaction' },
        { status: 403 }
      );
    }


    // 1. Perform STT if audio file is provided and no text was explicitly passed
    let finalUserText = userMessage ? String(userMessage).trim() : '';

    if (!finalUserText && audioBuffer && audioBuffer.length > 0) {
      try {
        console.log(`🎙️ [VoiceChat API] Transcribing ${audioBuffer.length} bytes of audio (${mimeType})...`);
        finalUserText = await transcribeAudioHybrid(audioBuffer, mimeType);
      } catch (sttErr) {
        console.error('[VoiceChat STT Error]:', sttErr?.message);
        return NextResponse.json(
          {
            success: false,
            error: `Speech transcription failed: ${sttErr?.message || 'Unable to process audio'}`,
            stage: 'stt'
          },
          { status: 422 }
        );
      }
    }

    if (!finalUserText) {
      return NextResponse.json(
        { success: false, error: 'No speech or text message detected. Please speak clearly.' },
        { status: 400 }
      );
    }

    // 2. Ensure Conversation Record exists
    if (!conversationId) {
      if (prisma?.conversation?.create) {
        try {
          if (!customerId && prisma?.customer?.create) {
            const cust = await prisma.customer.create({
              data: { businessId, channel: 'voice', name: 'Voice Customer' }
            });
            customerId = cust.id;
          }

          if (customerId) {
            const newConv = await prisma.conversation.create({
              data: { businessId, customerId, status: 'active', messages: [] }
            });
            conversationId = newConv.id;
          }
        } catch (dbErr) {
          console.warn('[VoiceChat API] DB conversation fallback:', dbErr?.message);
        }
      }
      if (!conversationId) {
        conversationId = `conv_voice_${randomUUID()}`;
      }
    }

    // 3. Process message through existing Voxy Voice AI Agent Engine (voiceMode=true for spoken responses)
    const engine = createConversationEngine({ businessId, db: prisma, voiceMode: true });

    const processPromise = engine.processMessage({
      conversationId,
      message: finalUserText,
      preferredLanguage
    });

    // 28s gives the full tool-loop time to complete:
    // AI turn (~5s) + tool exec + AI turn (~5s) + Paystack API (~3s) + final AI turn (~5s) = ~18-25s
    // The old 10s timeout was firing before payment_request could finish, returning a dead-end.
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          conversationId,
          response: "Sorry, that took a bit longer than expected. Could you please repeat your order for me?",
          language: { langName: preferredLanguage || 'English' },
          intent: 'order_placement'
        });
      }, 28000);
    });

    const agentResult = await Promise.race([processPromise, timeoutPromise]);

    const agentReplyText = agentResult.response || "I understand. How else can I assist you today?";
    const activeLanguageName = agentResult.language?.langName || 'English';

    // 4. Generate TTS via Voice Provider (YarnGPT with Hybrid fallback)
    // Wrap TTS in a 12s deadline — MsEdge fallback is fast (~2-3s)
    let ttsResult = null;
    // Use preferred language code first (frontend provides "yo", "ig", etc.)
    // Fall back to the language name from the AI if code is missing
    const ttsLanguage = preferredLanguage || activeLanguageName;
    try {
      const voiceProvider = getVoiceProvider();
      const ttsPromise = voiceProvider.synthesize(agentReplyText, { voice, language: ttsLanguage, timeoutMs: 6000 });
      const ttsDeadline = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TTS synthesis timed out after 12s')), 12000)
      );
      ttsResult = await Promise.race([ttsPromise, ttsDeadline]);
    } catch (ttsErr) {
      console.warn('[VoiceChat TTS Warning] Primary provider failed, using hybrid fallback:', ttsErr?.message);
      const fallbackProvider = getVoiceProvider({ forceHybrid: true });
      ttsResult = await fallbackProvider.synthesize(agentReplyText, { voice, language: ttsLanguage });
    }

    // Return production voice response envelope
    return NextResponse.json({
      success: true,
      conversationId: agentResult.conversationId,
      userTranscript: finalUserText,
      message: {
        role: 'assistant',
        content: agentReplyText
      },
      paymentUrl: agentResult.paymentUrl || null,
      orderId: agentResult.orderId || null,
      audioUrl: ttsResult.audioUrl,
      provider: ttsResult.provider,
      voice: ttsResult.voice,
      cleanText: ttsResult.cleanText,
      language: agentResult.language,
      intent: agentResult.intent,
      handoff: agentResult.handoff,
      latencyMs: Date.now() - startTime
    });

  } catch (error) {
    console.error('[VoiceChat API Internal Error]:', error);
    const fallbacks = [
      "I didn't quite catch that clearly. Could you please say that once more?",
      "My line broke up for a quick second. What were you saying?",
      "Sorry about that, I missed your last phrase. Could you repeat that for me?",
      "I had a tiny audio hiccup on my end. Please go ahead and repeat what you said.",
      "Network was a bit shaky just now. What item were you asking about?"
    ];
    const dynamicReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Voice turn processing failed',
        message: {
          role: 'assistant',
          content: dynamicReply
        },
        latencyMs: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

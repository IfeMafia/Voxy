import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateAIResponse } from "@/lib/ai/core/generateAIResponse";
import { 
  buildBusinessSummary, 
  shouldIncludeBusinessContext, 
  buildAIPayload,
  summarizeConversation,
  detectIntent
} from '@/lib/ai-context';
import { notifyBusiness } from '@/lib/notifications';
import { detectLanguageGemini, validateResponseLanguage } from '@/lib/ai/utils/language';

export async function POST(req) {
  try {
    const body = await req.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Conversation ID is required' }, { status: 400 });
    }

    // 1. Fetch Conversation and Business Context
    const conversationRes = await db.query(
      `SELECT c.*, b.name as business_name, b.category, b.assistant_tone, b.assistant_instructions, b.description as business_desc, b.ai_summary,
              u.name as actual_customer_name
       FROM conversations c
       JOIN businesses b ON c.business_id = b.id
       LEFT JOIN users u ON c.customer_id = u.id
       WHERE c.id = $1`,
      [conversationId]
    );

    if (conversationRes.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const conv = conversationRes.rows[0];

    // 1b. Check if AI is enabled for this conversation
    const isAiAllowed = conv.ai_allowed !== false; // Default true if null
    const isAiEnabled = conv.ai_enabled !== false; // Default true if null
    
    if (!isAiAllowed || !isAiEnabled) {
      return NextResponse.json({ 
        success: true, 
        message: null,
        info: !isAiAllowed ? 'AI is disallowed by business.' : 'AI is disabled for this conversation.'
      });
    }

    // 2. Fetch last message for intent detection and language detection
    const lastMsgRes = await db.query(
      'SELECT content FROM messages WHERE conversation_id = $1 AND sender_type = $2 ORDER BY created_at DESC LIMIT 1',
      [conversationId, 'customer']
    );
    const lastMessage = lastMsgRes.rows[0]?.content || '';

    // 2b. MULTILINGUAL DETECTION (NEW)
    const detectedLanguage = await detectLanguageGemini(lastMessage);
    console.log(`[AI-CHAT] Detected Language: ${detectedLanguage}`);

    if (detectedLanguage === 'unsupported') {
      const unsupportedResponse = "Sorry, this language is not supported. Please use English, Yoruba, Hausa, or Igbo.";
      const saveRes = await db.query(
        'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3) RETURNING *',
        [conversationId, 'ai', unsupportedResponse]
      );
      return NextResponse.json({ success: true, message: saveRes.rows[0], language: 'unsupported' });
    }

    // 3. INTENT DETECTION & ESCALATION
    const intent = detectIntent(lastMessage, { 
      category: conv.category, 
      description: conv.business_desc 
    });

    console.log(`🧠 Intent detected: ${intent}`);

    // A. Out of Scope Handling
    if (intent === 'out_of_scope') {
      const staticResponse = `Sorry, I can only assist with queries related to ${conv.category || 'our services'}. We offer ${conv.ai_summary || conv.business_desc || 'a variety of features'}. Let me know how I can help.`;
      
      const saveRes = await db.query(
        'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3) RETURNING *',
        [conversationId, 'ai', staticResponse]
      );

      return NextResponse.json({ success: true, message: saveRes.rows[0] });
    }

    // B. Human Escalation/Support Handling
    if (intent === 'human_request' || intent === 'support') {
      await notifyBusiness(conversationId, 'high');
      
      const staticResponse = "I’ve notified the business. They’ll respond shortly, usually within a few minutes. Please hold on.";
      
      const saveRes = await db.query(
        'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3) RETURNING *',
        [conversationId, 'ai', staticResponse]
      );

      return NextResponse.json({ success: true, message: saveRes.rows[0] });
    }

    // 4. PREPARE AI PAYLOAD
    // Check if we need to summarize first
    let convSummary = conv.summary;
    if (!convSummary) {
      convSummary = await summarizeConversation(conversationId);
    }

    const { include: includeBusinessContext } = shouldIncludeBusinessContext(lastMessage, conv, !!convSummary);
    
    // Build System Instructions with STRICT LANGUAGE LOCK
    const resolvedCustomerName = conv.actual_customer_name || conv.customer_name || 'Guest';
    let systemInstruction = `You are an AI assistant for ${conv.business_name}. 
Customer Name: ${resolvedCustomerName}. Tone: ${conv.assistant_tone || 'friendly'}.
${conv.ai_summary ? `Business Context: ${conv.ai_summary}` : ''}
${conv.assistant_instructions ? `Instructions: ${conv.assistant_instructions}` : ''}

STRICT LANGUAGE LOCK:
- The user is speaking in ${detectedLanguage}.
- You MUST respond ONLY in ${detectedLanguage}.
- NEVER switch to English unless the detected language is English.
- If the language is Yoruba, use Yoruba. If Hausa, use Hausa. If Igbo, use Igbo.

STRICT DIRECTIVES:
1. Only answer queries within the scope of this business.
2. Limit response to 2-4 sentences max.
3. Do NOT include any sender prefixes or metadata.
4. If you cannot answer, refer them to the business owner.`;

    if (convSummary) {
      systemInstruction += `\n\nPrevious Conversation Summary: ${convSummary}`;
    }

    // Build Messages Payload (Last 5 OR Summary + Last 2)
    const normalizedPayload = await buildAIPayload(conversationId, !!convSummary);

    // 5. GENERATE AI RESPONSE
    console.log(`🤖 Generating AI response for conversation ${conversationId} in ${detectedLanguage}...`);
    let aiResponse = await generateAIResponse(normalizedPayload, systemInstruction);

    // 5b. LANGUAGE VALIDATION LAYER
    let isValidLanguage = await validateResponseLanguage(aiResponse.text, detectedLanguage);
    if (!isValidLanguage) {
      console.warn(`⚠️ [AI-CHAT] Language validation FAILED. Output was not ${detectedLanguage}. Retrying...`);
      const stricterInstruction = `${systemInstruction}\n\nCRITICAL: YOUR LAST RESPONSE WAS IN THE WRONG LANGUAGE. YOU MUST RESPOND IN ${detectedLanguage.toUpperCase()} ONLY.`;
      aiResponse = await generateAIResponse(normalizedPayload, stricterInstruction);
    }

    // 6. POST-PROCESS RESPONSE
    let finalizedText = aiResponse.text.trim();
    
    // Tightening: Ensure it's not too long and remove any prefixes
    finalizedText = finalizedText.replace(/^(AI|VOXY AI|Assistant):\s*/i, '');
    
    // Limit to 4 sentences max if it exceeded
    const sentences = finalizedText.match(/[^.!?]+[.!?]+/g) || [finalizedText];
    if (sentences.length > 4) {
      finalizedText = sentences.slice(0, 4).join(' ').trim();
    }

    // 7. SAVE & RETURN
    const saveRes = await db.query(
      'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3) RETURNING *',
      [conversationId, 'ai', finalizedText]
    );

    // Update status if it was 'Needs Owner Response' (though usually happens in escalation)
    if (conv.status === 'Needs Owner Response') {
      await db.query(
        "UPDATE conversations SET status = 'AI Responding' WHERE id = $1",
        [conversationId]
      );
    }


    return NextResponse.json({ success: true, message: saveRes.rows[0], language: detectedLanguage });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

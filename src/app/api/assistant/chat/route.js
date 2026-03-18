import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateText } from '@/lib/gemini';
import { 
  buildBusinessSummary, 
  shouldIncludeBusinessContext, 
  getRecentMessages, 
  summarizeConversation,
  detectIntent
} from '@/lib/ai-context';

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

    console.log(`[AI-CHAT] AI Permission: ${isAiAllowed}, AI Enabled: ${isAiEnabled}`);
    
    if (!isAiAllowed || !isAiEnabled) {
      console.log(`[AI-CHAT] AI is BLOCKED (Allowed: ${isAiAllowed}, Enabled: ${isAiEnabled}). Skipping response.`);
      return NextResponse.json({ 
        success: true, 
        message: null,
        info: !isAiAllowed ? 'AI is disallowed by business.' : 'AI is disabled for this conversation.'
      });
    }

    // Check if we need to summarize first (e.g. if conversation has grown large)
    let convSummary = conv.summary;
    if (!convSummary) {
      convSummary = await summarizeConversation(conversationId);
      if (convSummary) conv.summary = convSummary; // Update local ref
    }

    // 2. Fetch recent message history
    // Requirement: If messages > 10 (summary exists), send summary + last 2–3 messages.
    // Otherwise send last 5 messages.
    let limit = 5;
    if (convSummary) limit = 3;

    const chatHistory = await getRecentMessages(conversationId, limit);
    const lastMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].content : '';

    // 3. Determine if we need full business context injected into System Prompt
    const resolvedCustomerName = conv.actual_customer_name || conv.customer_name || 'Guest';
    let systemInstruction = `CRITICAL: You are speaking with ${resolvedCustomerName}. Always try to use their name naturally in your responses!
CRITICAL DIRECTIVE: Do NOT include any sender prefixes, names, timestamps, or "AI:" tags. Start immediately with your message text.`;

    const { include: includeBusinessContext, intent } = shouldIncludeBusinessContext(lastMessage, !!convSummary);
    
    console.log(`🧠 Intent detected: ${intent} | Context injection: ${includeBusinessContext ? 'YES' : 'NO'}`);
    
    if (includeBusinessContext) {
      let aiSummary = conv.ai_summary;
      if (!aiSummary) {
         // Fallback generation if business was created before the optimization
         aiSummary = await buildBusinessSummary(conv.business_id);
      }
      
      systemInstruction = `You are an AI assistant for a business.\nBusiness Profile: ${aiSummary || 'No details provided.'}\n\n${systemInstruction}`;
    }

    // Add conversation memory summary if it exists
    if (convSummary) {
      systemInstruction += `\n\nPrevious Conversation Summary: ${convSummary}`;
    }

    // 4. Construct structured payload for the AI model
    let messagesPayload = chatHistory.map(m => ({
      // Gemini expects 'model' for the AI and 'user' for human
      role: m.sender_type === 'ai' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Gemini API requires the first message to be 'user' and roles to alternate.
    if (messagesPayload.length > 0 && messagesPayload[0].role === 'model') {
       messagesPayload.unshift({ role: 'user', parts: [{ text: '[Conversation resumed]' }] });
    }
    
    // Ensure alternating roles
    const normalizedPayload = [];
    for (const msg of messagesPayload) {
      if (normalizedPayload.length === 0) {
        normalizedPayload.push(msg);
      } else {
        const lastMsg = normalizedPayload[normalizedPayload.length - 1];
        if (lastMsg.role === msg.role) {
          // Merge consecutive messages from same role
          lastMsg.parts[0].text += `\\n\\n${msg.parts[0].text}`;
        } else {
          normalizedPayload.push(msg);
        }
      }
    }

    const aiRequest = {
      contents: normalizedPayload
    };

    const aiOptions = {
      systemInstruction
    };

    // 5. Generate AI Message
    console.log(`🤖 Generating AI response for conversation ${conversationId}... (Tokens optimized!)`);
    const aiResponse = await generateText(aiRequest, aiOptions);

    // 6. Save AI Message to Database
    const saveRes = await db.query(
      'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3) RETURNING *',
      [conversationId, 'ai', aiResponse]
    );

    // 7. Update conversation status if it was 'Needs Owner Response'
    if (conv.status === 'Needs Owner Response') {
      await db.query(
        "UPDATE conversations SET status = 'AI Responding' WHERE id = $1",
        [conversationId]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: saveRes.rows[0]
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

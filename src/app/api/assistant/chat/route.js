import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateText } from '@/lib/gemini';

export async function POST(req) {
  try {
    const body = await req.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Conversation ID is required' }, { status: 400 });
    }

    // 1. Fetch Conversation and Business Context
    const conversationRes = await db.query(
      `SELECT c.*, b.name as business_name, b.category, b.assistant_tone, b.assistant_instructions, b.description as business_desc
       FROM conversations c
       JOIN businesses b ON c.business_id = b.id
       WHERE c.id = $1`,
      [conversationId]
    );

    if (conversationRes.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const conv = conversationRes.rows[0];

    // 2. Fetch recent message history (last 10 messages)
    const messagesRes = await db.query(
      `SELECT sender_type, content 
       FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [conversationId]
    );

    // Reverse to get chronological order
    const chatHistory = messagesRes.rows.reverse();

    // 3. Construct the prompt
    const prompt = `
You are an AI assistant for "${conv.business_name}", a business in the ${conv.category} category.
Business Description: ${conv.business_desc || 'No description provided.'}
Tone of Voice: ${conv.assistant_tone || 'Professional and helpful'}
Instructions: ${conv.assistant_instructions || 'Answer customer questions politely and accurately.'}

Customer Name: ${conv.customer_name || 'Guest'}

Recent Conversation History:
${chatHistory.map(m => `${m.sender_type.toUpperCase()}: ${m.content}`).join('\n')}

Based on the history and business rules, provide a helpful response as the business AI assistant. 
CRITICAL: You are speaking with ${conv.customer_name || 'Guest'}. Always try to use their name naturally in your responses, especially for greetings or when answering direct inquiries!
CRITICAL DIRECTIVE: Do NOT include any sender prefixes, names, timestamps, or "AI:" tags at the beginning of your response. Start your response immediately with your message text. Keep it concise and natural.
`;

    // 4. Generate AI Message
    console.log(`🤖 Generating AI response for conversation ${conversationId}...`);
    const aiResponse = await generateText(prompt);

    // 5. Save AI Message to Database
    const saveRes = await db.query(
      'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3) RETURNING *',
      [conversationId, 'ai', aiResponse]
    );

    // 6. Update conversation status if it was 'Needs Owner Response'
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

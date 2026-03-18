import db from '@/lib/db';
import { generateText } from '@/lib/gemini';

/**
 * 1. BUSINESS CONTEXT COMPRESSION
 * Generates an AI-friendly summary of the business and stores it in the database.
 * Call this when a business profile is created or updated.
 */
export async function buildBusinessSummary(businessId) {
  const res = await db.query('SELECT name, category, description, business_hours, assistant_tone, assistant_instructions FROM businesses WHERE id = $1', [businessId]);
  if (res.rowCount === 0) return null;

  const b = res.rows[0];
  
  // Format business hours into a readable string
  let hoursStr = "Not specified.";
  if (b.business_hours) {
    try {
      const hours = typeof b.business_hours === 'string' ? JSON.parse(b.business_hours) : b.business_hours;
      hoursStr = Object.entries(hours)
        .filter(([day, data]) => data && !data.isClosed)
        .map(([day, data]) => `${day}: ${data.open} - ${data.close}`)
        .join(', ');
      
      const closedDays = Object.entries(hours)
        .filter(([day, data]) => data && data.isClosed)
        .map(([day]) => day)
        .join(', ');
        
      if (closedDays) hoursStr += ` | Closed on: ${closedDays}`;
    } catch (e) {
      hoursStr = JSON.stringify(b.business_hours);
    }
  }

  const compressionPrompt = `
Compress the following business profile into a dense, AI-friendly system prompt (max 100-150 tokens). 
Include exactly: name, category, core description, business hours/availability, tone, and key assistant instructions. 
Do not talk in the first person. Output ONLY the compressed summary.

Name: ${b.name}
Category: ${b.category}
Description: ${b.description}
Hours: ${hoursStr}
Tone: ${b.assistant_tone}
Instructions: ${b.assistant_instructions}
  `.trim();

  let aiSummary = '';
  try {
    aiSummary = await generateText(compressionPrompt);
    aiSummary = aiSummary.trim();
    
    await db.query('UPDATE businesses SET ai_summary = $1 WHERE id = $2', [aiSummary, businessId]);
    return aiSummary;
  } catch (error) {
    console.error('Error generating AI business summary:', error);
    // fallback if AI fails
    aiSummary = `${b.name} (${b.category}). ${b.description}. Hours: ${hoursStr}. Tone: ${b.assistant_tone}. Rules: ${b.assistant_instructions}`;
    await db.query('UPDATE businesses SET ai_summary = $1 WHERE id = $2', [aiSummary, businessId]);
    return aiSummary;
  }
}

/**
 * 2. INTENT DETECTION
 * Simple regex and keyword matcher to classify user intent without an LLM call.
 */
export function detectIntent(message) {
  if (!message || typeof message !== 'string') return 'conversation';

  const lowerMsg = message.toLowerCase();

  // Pattern sets
  const intents = {
    order_request: [
      /i (want|need) to (order|buy|book|get)/,
      /can i (order|get|have)/,
      /(order|buy|book|get) (some|a|an)/,
      /\b(order|buy|purchase|book|reserve)\b/
    ],
    support: [
      /(not working|broken|delay)/,
      /where is my (order|stuff)/,
      /i have a (problem|issue|complaint)/,
      /\b(problem|issue|complain|complaint|help|refund|missing|wrong)\b/
    ],
    business_info: [
      /what do you (sell|offer|have)/,
      /how much (is it|does it cost)/,
      /are you (open|closed)/,
      /where are you (located|based)/,
      /\b(price|cost|costing|service|menu|offer|available|open|close|hours|location|address)\b/
    ]
  };

  // Match against sets in priority order
  for (const intent of ['support', 'order_request', 'business_info']) {
    for (const pattern of intents[intent]) {
      if (pattern.test(lowerMsg)) {
        return intent;
      }
    }
  }

  return 'conversation';
}

/**
 * 3. CONDITIONAL CONTEXT INJECTION
 * Determines if the business context should be sent to the AI.
 * We send it if there's no conversation summary (meaning it's new) 
 * OR if the message intent requires core business knowledge.
 */
export function shouldIncludeBusinessContext(messageContent, hasSummary) {
  // Always include if the conversation is new enough that we haven't summarized it yet
  if (!hasSummary) return { include: true, intent: 'new_conversation' };

  const intent = detectIntent(messageContent);
  
  if (intent === 'business_info' || intent === 'order_request' || intent === 'support') {
    return { include: true, intent };
  }
  
  return { include: false, intent };
}

/**
 * 4. CONVERSATION WINDOW LIMIT
 * Fetch only the most recent messages. limit defaults to 5.
 */
export async function getRecentMessages(conversationId, limit = 5) {
  const res = await db.query(
    `SELECT sender_type, content 
     FROM messages 
     WHERE conversation_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [conversationId, limit]
  );
  // reverse to return chronological order
  return res.rows.reverse();
}

/**
 * 5. CONVERSATION MEMORY (SUMMARIZATION)
 * If message count > 10, summarize the conversation up to this point and store it.
 */
export async function summarizeConversation(conversationId) {
  // Check total message count
  const countRes = await db.query('SELECT COUNT(*) FROM messages WHERE conversation_id = $1', [conversationId]);
  const count = parseInt(countRes.rows[0].count, 10);
  
  if (count <= 10) return null; // No need to summarize yet

  // Fetch all messages (or you could fetch last 10 if avoiding huge context)
  const msgsRes = await db.query(
    'SELECT sender_type, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId]
  );
  
  const historyText = msgsRes.rows.map(m => `${m.sender_type.toUpperCase()}: ${m.content}`).join('\n');
  
  const summarizePrompt = `
Summarize the following conversation concisely (max 100 tokens). 
Highlight the main issue/inquiry of the customer and what the AI has resolved or stated so far.

Conversation:
${historyText}
  `.trim();

  try {
    const summary = await generateText(summarizePrompt);
    await db.query('UPDATE conversations SET summary = $1 WHERE id = $2', [summary.trim(), conversationId]);
    return summary.trim();
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return null;
  }
}

import db from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { generateAIResponse } from './ai/core/generateAIResponse';
import { trackAIUsage } from './ai/observability';

/**
 * 1. BUSINESS CONTEXT COMPRESSION
 * Generates an AI-friendly summary of the business and stores it in the database.
 * Call this when a business profile is created or updated.
 */
export async function buildBusinessSummary(businessId) {
  try {
    let b = null;
    if (prisma?.business?.findUnique) {
      b = await prisma.business.findUnique({ where: { id: businessId } });
    }
    if (!b) {
      const res = await db.query(
        'SELECT name, category, description, hours as business_hours, "aiConfig", "contactPhone" as phone, address FROM "Business" WHERE id = $1',
        [businessId]
      );
      if (res.rowCount === 0) return null;
      b = res.rows[0];
    }
    if (!b) return null;

    // Format business hours into a readable string
    let hoursStr = "Not specified.";
    const businessHours = b.hours || b.business_hours;
    if (businessHours) {
      try {
        const hours = typeof businessHours === 'string' ? JSON.parse(businessHours) : businessHours;
        const openDays = Object.entries(hours)
          .filter(([day, data]) => data && !data.closed)
          .map(([day, data]) => `${day}: ${data.open} - ${data.close}`);
        const closedDays = Object.entries(hours)
          .filter(([day, data]) => data && data.closed)
          .map(([day]) => day);
          
        if (openDays.length > 0) {
          hoursStr = openDays.join(', ');
          if (closedDays.length > 0) hoursStr += ` | Closed on: ${closedDays.join(', ')}`;
        } else if (closedDays.length > 0) {
          hoursStr = `Closed every day (${closedDays.join(', ')})`;
        }
      } catch (e) {
        hoursStr = typeof businessHours === 'object' ? JSON.stringify(businessHours) : String(businessHours);
      }
    }

    const addr = typeof b.address === 'object' ? b.address : {};
    const locationStr = [addr?.street, addr?.city, addr?.state].filter(Boolean).join(', ') || 'Not specified.';
    const tone = b.aiConfig?.tone || b.assistant_tone || 'professional';
    const instructions = b.aiConfig?.rules || b.assistant_instructions || '';

    const compressionPrompt = `
Compress the following business profile into a dense, AI-friendly system prompt (max 100-120 tokens). 
Include exactly: name, category, phone number, location, short description, business hours, tone, and key assistant instructions. 
Do not talk in the first person. Output ONLY the compressed summary.

Name: ${b.name}
Category: ${b.category || 'N/A'}
Phone: ${b.phone || b.contactPhone || 'Not specified'}
Location: ${locationStr}
Description: ${b.description || ''}
Hours: ${hoursStr}
Tone: ${tone}
Instructions: ${instructions}
    `.trim();

    let aiSummary = '';
    try {
      const aiResponse = await trackAIUsage({
        userId: null,
        businessId,
        requestType: 'system',
        provider: 'voxy-hybrid',
        model: 'business-summarizer'
      }, async () => await generateAIResponse(compressionPrompt, "Compress business profiles for systems."));
      aiSummary = aiResponse.text.trim();
    } catch (error) {
      console.error('Error generating AI business summary:', error);
      aiSummary = `${b.name} (${b.category || 'Business'}). Phone: ${b.phone || b.contactPhone || 'N/A'}. Location: ${locationStr}. ${b.description || ''}. Hours: ${hoursStr}. Tone: ${tone}.`;
      if (aiSummary.length > 600) aiSummary = aiSummary.substring(0, 600) + '...';
    }

    return aiSummary;
  } catch (err) {
    console.error('Error in buildBusinessSummary:', err?.message);
    return null;
  }
}

/**
 * 2. INTENT DETECTION
 * Simple regex and keyword matcher to classify user intent without an LLM call.
 * @param {string} message - The user message
 * @param {Object} business - The business context (category, description)
 */
export function detectIntent(message, business = null) {
  if (!message || typeof message !== 'string') return 'conversation';

  const lowerMsg = message.toLowerCase();

  // Pattern sets
  const intents = {
    human_request: [
      /\b(human|owner|agent|person|someone|representative|staff|speak to someone|talk to someone|speak to a person)\b/i,
      /speak with (the|a) (owner|manager|person|human)/,
      /can i (speak|talk) to a (human|person|agent|owner)/,
      /let me (speak|talk) to (someone|a human)/
    ],
    order_request: [
      /i (want|need) to (order|buy|book|get|purchase)/,
      /can i (order|get|have|buy|book)/,
      /(order|buy|book|get|purchase) (some|a|an)/,
      /\b(order|buy|purchase|book|reserve|checkout|payment|price|cost)\b/
    ],
    support: [
      /(not working|broken|delay|failed|error|wrong|missing)/,
      /where is my (order|stuff|package|delivery)/,
      /i have a (problem|issue|complaint|trouble)/,
      /\b(problem|issue|complain|complaint|help|refund|missing|wrong|broken|fix)\b/
    ],
    business_info: [
      /what do you (sell|offer|have|do)/,
      /how much (is it|does it cost)/,
      /are you (open|closed)/,
      /where are you (located|based)/,
      /\b(price|cost|costing|service|menu|offer|available|open|close|hours|location|address|services|products)\b/
    ]
  };

  // 1. Check for Human/Support Escalation (Highest Priority)
  for (const pattern of intents.human_request) {
    if (pattern.test(lowerMsg)) return 'human_request';
  }

  // 2. Check for Support/Problem
  for (const pattern of intents.support) {
    if (pattern.test(lowerMsg)) return 'support';
  }

  // 3. Check for Out of Scope (if business context provided)
  if (business && (business.category || business.description)) {
    const scopeKeywords = [
      ...(business.category ? business.category.toLowerCase().split(/[ ,&]+/) : []),
      ...(business.description ? business.description.toLowerCase().split(/[ ,&]+/).filter(w => w.length > 3) : [])
    ];
    
    const unrelatedKeywords = ['weather', 'politics', 'news', 'joke', 'poem', 'story', 'history', 'science', 'math', 'code', 'programming'];
    const matchesUnrelated = unrelatedKeywords.some(kw => lowerMsg.includes(kw));
    
    if (lowerMsg.length > 10 && matchesUnrelated) {
      const matchesBusiness = scopeKeywords.some(kw => kw.length > 2 && lowerMsg.includes(kw));
      if (!matchesBusiness) return 'out_of_scope';
    }
  }

  // 4. Check for Business Info / Order
  for (const intent of ['business_info', 'order_request']) {
    for (const pattern of intents[intent]) {
      if (pattern.test(lowerMsg)) return intent;
    }
  }

  return 'conversation';
}

/**
 * 3. CONDITIONAL CONTEXT INJECTION
 * Determines if the business context should be sent to the AI.
 * @param {string} messageContent - Current user message
 * @param {Object} business - Business object
 * @param {boolean} hasSummary - Whether conversation has a summary
 */
export function shouldIncludeBusinessContext(messageContent, business, hasSummary) {
  const intent = detectIntent(messageContent, business);

  if (!hasSummary) return { include: true, intent: intent === 'conversation' ? 'new_conversation' : intent };
  
  if (intent === 'business_info' || intent === 'order_request' || intent === 'support') {
    return { include: true, intent };
  }
  
  return { include: false, intent };
}

/**
 * 4. CONVERSATION WINDOW LIMIT & PAYLOAD BUILDING
 * Ensures we don't exceed token limits by selecting appropriate message history.
 * Rule: Last 5 messages OR (Summary + Last 2 messages)
 */
export async function buildAIPayload(conversationId, hasSummary) {
  const limit = hasSummary ? 2 : 5;
  const messages = await getRecentMessages(conversationId, limit);
  
  return messages.map(m => ({
    role: m.sender_type === 'ai' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
}

export async function getRecentMessages(conversationId, limit = 5) {
  try {
    if (prisma?.conversation?.findUnique) {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { messages: true }
      });
      const msgs = Array.isArray(conv?.messages) ? conv.messages : [];
      return msgs.slice(-limit).map(m => ({
        sender_type: m.role === 'model' || m.sender === 'ai' ? 'ai' : 'user',
        content: m.content || m.text || ''
      }));
    }
  } catch (err) {
    console.warn('[ai-context] getRecentMessages error:', err?.message);
  }
  return [];
}

/**
 * 5. CONVERSATION MEMORY (SUMMARIZATION)
 * If message count > 10, summarize the conversation up to this point and store it.
 */
export async function summarizeConversation(conversationId) {
  try {
    if (!prisma?.conversation?.findUnique) return null;

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, businessId: true, messages: true }
    });

    if (!conv) return null;

    const msgs = Array.isArray(conv.messages) ? conv.messages : [];
    if (msgs.length <= 10) return null; // No need to summarize yet

    const historyText = msgs.map(m => `${(m.role || m.sender || 'user').toUpperCase()}: ${m.content || m.text || ''}`).join('\n');
    
    const summarizePrompt = `
Summarize the following conversation concisely (max 100 tokens). 
Highlight the main issue/inquiry of the customer and what the AI has resolved or stated so far.

Conversation:
${historyText}
    `.trim();

    const aiResponse = await trackAIUsage({
      userId: null,
      businessId: conv.businessId,
      requestType: 'system',
      provider: 'voxy-hybrid',
      model: 'conversation-summarizer'
    }, async () => await generateAIResponse(summarizePrompt, "Summarize conversations for memory."));
    
    return aiResponse?.text?.trim() || null;
  } catch (error) {
    console.error('Error generating conversation summary:', error?.message);
    return null;
  }
}

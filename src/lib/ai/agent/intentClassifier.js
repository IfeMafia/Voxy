/**
 * S4: Intent Classifier for Voxy Customer Conversation Engine.
 *
 * Classifies customer input into one of:
 * - GREETING
 * - PRODUCT_INQUIRY
 * - RECOMMENDATION_REQUEST
 * - ORDER_INTENT
 * - SUPPORT_POLICY
 * - HUMAN_HANDOFF (PRD §4.8)
 *
 * Implements high-speed heuristic & regex classification (< 5ms)
 * with support for Nigerian vernacular and Pidgin phrases.
 */

import { IntentType, HandoffReason } from './types.js';

// Regex patterns for fast, deterministic intent routing
const HUMAN_HANDOFF_PATTERNS = [
  // Explicit human / agent / boss requests
  /\b(talk|speak|connect|chat|transfer)\s+(to|with)?\s*(a\s+)?(human|agent|person|representative|manager|owner|boss|bosses|staff|real person)\b/i,
  /\b(call|contact|get|give|reach)\s+(me\s+)?(the\s+)?(owner|manager|boss|bosses|admin|human|helpline|support line|contact|number)\b/i,
  /\b(boss'?s?|manager'?s?|owner'?s?)\s+(number|phone|contact|line|email)\b/i,
  /\blet\s+me\s+(talk|speak)\s+(to|with)\b/i,
  /\b(real\s+person|human\s+being|live\s+agent|talk\s+to\s+human)\b/i,
  /\b(need\s+a\s+human|want\s+a\s+human|get\s+a\s+human)\b/i,
  /^(yeah|yes|sure|ok|okay|please)\s+(do\s+that|connect|forward|notify|call|reach\s+out)$/i,

  // Complex complaints, hostility, fraud, legal threats
  /\b(fraud|scam|scammers|robbery|thieves|stole|police|lawyer|sue|court|efcc)\b/i,
  /\b(terrible|horrible|useless|worst|unacceptable)\s+(service|product|store|experience)\b/i,
  /\b(debited\s+twice|double\s+charge|charged\s+me\s+twice|take\s+my\s+money)\b/i,
  /\b(give\s+me\s+my\s+money\s+back|demanded?\s+a\s+refund\s+now)\b/i,
  /\b(escalate|file\s+a\s+complaint|report\s+you)\b/i
];

const GREETING_PATTERNS = [
  /^(hi|hello|hey|hiya|howdy|holla|greetings|welcome|how\s+far|wetin\s+dey|kedu|bawo|bawo\s+ni|sannu)[\s!.,?-]*(good\s+(morning|afternoon|evening|day)|how\s+far|wetin\s+dey(\s+happen)?|how\s+are\s+you|how\s+you\s+dey|voxy)?[\s!.,?]*$/i,
  /^(good\s+(morning|afternoon|evening|day))[\s!.,?-]*(hi|hello|hey|how\s+are\s+you|how\s+far|voxy)?[\s!.,?]*$/i,
  /^(how\s+far|wetin\s+dey(\s+happen)?|how\s+are\s+you|how\s+body)[\s!.,?]*$/i
];


const ORDER_INTENT_PATTERNS = [
  /\b(i\s+(want|wan|like)\s+to\s+(buy|order|purchase|pay\s+for))\b/i,
  /\b(place\s+(an\s+)?order|ready\s+to\s+(order|buy|pay|checkout))\b/i,
  /\b(add\s+(to\s+cart|this)|take\s+my\s+order|send\s+(the\s+)?(bill|invoice|account|payment\s+link))\b/i,
  /\b(i\s+take\s+it|i\s+will\s+take|book\s+this|buy\s+now)\b/i
];

const SUPPORT_POLICY_PATTERNS = [
  /\b(return\s+policy|refund\s+policy|exchange\s+policy|cancellation\s+policy)\b/i,
  /\b(can\s+i\s+return|how\s+do\s+i\s+return|get\s+a\s+refund|money\s+back)\b/i,
  /\b(delivery\s+(area|areas|locations|coverage|places|timeline|time|fee))\b/i,
  /\b(do\s+you\s+deliver\s+to|can\s+you\s+deliver\s+to|deliver\s+to|ship\s+to)\b/i,
  /\b(payment\s+method|how\s+do\s+i\s+pay|mode\s+of\s+payment|bank\s+transfer|pos|cash\s+on\s+delivery)\b/i,
  /\b(opening\s+hours|working\s+hours|closing\s+time|when\s+are\s+you\s+open)\b/i
];

const RECOMMENDATION_PATTERNS = [
  /\b(recommend|recommendation|suggest|suggestion|advise)\b/i,
  /\b(what\s+do\s+you\s+recommend|help\s+me\s+(choose|pick|select))\b/i,
  /\b(which\s+(one|product)\s+is\s+(best|better|good\s+for))\b/i,
  /\b(what\s+can\s+i\s+get\s+for|options\s+under|budget\s+of)\b/i,
  /\b(what\s+should\s+i\s+get|looking\s+for\s+something)\b/i
];

const PRODUCT_INQUIRY_PATTERNS = [
  /\b(do\s+you\s+have|is\s+there|available|in\s+stock|out\s+of\s+stock)\b/i,
  /\b(how\s+much|what\s+is\s+the\s+price|price\s+of|cost\s+of|rate\s+for)\b/i,
  /\b(features|specs|specification|size|colors?|colour|weight|capacity)\b/i,
  /\b(show\s+me|tell\s+me\s+about|do\s+you\s+sell)\b/i
];

export class IntentClassifier {
  /**
   * Classifies a customer message into a primary intent.
   *
   * @param {string} text - Raw customer input.
   * @param {Object} [sessionContext={}] - Rolling conversational context.
   * @returns {import('./types.js').IntentClassificationResult}
   */
  static classify(text, sessionContext = {}) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        intent: IntentType.GREETING,
        confidence: 1.0,
        reason: 'Empty or blank input defaulted to greeting',
        entities: {}
      };
    }

    const trimmed = text.trim();

    // 1. Check Human Handoff triggers first (PRD §4.8 non-negotiable priority)
    for (const pattern of HUMAN_HANDOFF_PATTERNS) {
      if (pattern.test(trimmed)) {
        const isExplicit = /\b(human|agent|person|manager|representative|call)\b/i.test(trimmed);
        return {
          intent: IntentType.HUMAN_HANDOFF,
          confidence: 0.98,
          reason: isExplicit ? 'Explicit customer request for human agent' : 'Customer complaint or escalation pattern matched',
          entities: {
            isExplicitHumanRequest: isExplicit,
            sentiment: 'negative',
            handoffReason: isExplicit ? HandoffReason.EXPLICIT_REQUEST : HandoffReason.COMPLEX_COMPLAINT
          }
        };
      }
    }

    // 2. Check Order Intent
    for (const pattern of ORDER_INTENT_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          intent: IntentType.ORDER_INTENT,
          confidence: 0.92,
          reason: 'Customer expressed clear purchase or ordering intent',
          entities: {
            sentiment: 'positive'
          }
        };
      }
    }

    // 3. Check Support & Policy
    for (const pattern of SUPPORT_POLICY_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          intent: IntentType.SUPPORT_POLICY,
          confidence: 0.95,
          reason: 'Customer inquired about business policy, delivery, returns or hours',
          entities: {
            sentiment: 'neutral'
          }
        };
      }
    }

    // 4. Check Recommendation Request
    for (const pattern of RECOMMENDATION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          intent: IntentType.RECOMMENDATION_REQUEST,
          confidence: 0.90,
          reason: 'Customer asked for product advice or recommendation',
          entities: {
            sentiment: 'neutral'
          }
        };
      }
    }

    // 5. Check Pure Greetings (only if short and conversational)
    for (const pattern of GREETING_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          intent: IntentType.GREETING,
          confidence: 0.96,
          reason: 'Greeting phrase matched',
          entities: {
            sentiment: 'positive'
          }
        };
      }
    }

    // 6. Check Product Inquiry
    for (const pattern of PRODUCT_INQUIRY_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          intent: IntentType.PRODUCT_INQUIRY,
          confidence: 0.88,
          reason: 'Customer inquired about product catalog, price, or specifications',
          entities: {
            sentiment: 'neutral'
          }
        };
      }
    }

    // 7. Context-Aware Fallback
    // If the conversation is already discussing ordering or products, bias toward inquiry
    if (sessionContext?.interestedProducts?.length > 0 || sessionContext?.preferredCategory) {
      return {
        intent: IntentType.PRODUCT_INQUIRY,
        confidence: 0.70,
        reason: 'Ambiguous message routed to product inquiry based on active session context',
        entities: {
          sentiment: 'neutral'
        }
      };
    }

    return {
      intent: IntentType.PRODUCT_INQUIRY,
      confidence: 0.60,
      reason: 'Default general inquiry',
      entities: {
        sentiment: 'neutral'
      }
    };
  }
}

export function classifyIntent(text, sessionContext) {
  return IntentClassifier.classify(text, sessionContext);
}

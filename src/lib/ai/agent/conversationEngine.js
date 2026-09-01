/**
 * S4: Customer Conversation Engine & Intent Routing (AI-104).
 *
 * Coordinates conversation state, intent classification, memory retention,
 * policy grounding (S3), and human handoff (PRD §4.8).
 */

import { IntentType, HandoffReason, ConversationStatus } from './types.js';
import { IntentClassifier } from './intentClassifier.js';
import { HandoffManager, createHandoffManager } from './handoffManager.js';
import { GroundingService, createGroundingService } from './knowledge/groundingService.js';
import { runReasoning } from './reasoning.js';
import { buildReasoningRequest } from './conversationContext.js';
import { buildGroundedSystemPrompt } from '../models/promptBuilder.js';
import { SalesPlaybook } from './sales/salesPlaybook.js';
import { ObjectionHandler, ObjectionType } from './sales/objectionHandler.js';

export class ConversationEngine {
  /**
   * @param {Object} options
   * @param {string} options.businessId - Tenant identifier.
   * @param {Object} [options.db] - Optional Prisma / mock database client.
   * @param {HandoffManager} [options.handoffManager]
   * @param {GroundingService} [options.groundingService]
   * @param {Function} [options.reasoningRunner] - Custom runner for reasoning tests.
   */
  constructor(options = {}) {
    if (!options.businessId) {
      throw new Error('[ConversationEngine] businessId is required');
    }

    this.businessId = options.businessId;
    this.db = options.db;
    this.handoffManager = options.handoffManager || createHandoffManager({ db: this.db });
    this.groundingService = options.groundingService || createGroundingService({
      businessId: this.businessId,
      db: this.db
    });
    this.reasoningRunner = options.reasoningRunner || runReasoning;

    // In-memory session context storage for stateful turn retention
    this.sessionStore = new Map();
  }

  /**
   * Gets or initializes session context for a conversation.
   *
   * @param {string} conversationId
   * @returns {import('./types.js').CustomerSessionContext}
   */
  getSessionContext(conversationId) {
    if (!this.sessionStore.has(conversationId)) {
      this.sessionStore.set(conversationId, {
        preferredCategory: null,
        budget: null,
        deliveryLocation: null,
        interestedProducts: [],
        notes: '',
        turnCount: 0
      });
    }
    return this.sessionStore.get(conversationId);
  }

  /**
   * Extracts and updates customer preferences from turn text to retain state.
   *
   * @param {string} text
   * @param {import('./types.js').CustomerSessionContext} context
   */
  updateSessionPreferences(text, context) {
    if (!text || typeof text !== 'string') return;

    // Budget extraction (e.g. 50k, ₦50,000, 500,000, 200k)
    const budgetMatch = text.match(/(?:₦|NGN\s*|budget\s*(?:of|is)?\s*|under\s*)?(\d{1,3}(?:,\d{3})+|\d+)\s*(k|thousand|m|million)?/i);
    if (budgetMatch) {
      let num = parseFloat(budgetMatch[1].replace(/,/g, ''));
      const multiplier = (budgetMatch[2] || '').toLowerCase();
      if (multiplier === 'k' || multiplier === 'thousand') num *= 1000;
      if (multiplier === 'm' || multiplier === 'million') num *= 1000000;
      if (num > 500) {
        context.budget = num;
      }
    }

    // Category extraction
    const categoryMatches = ['phone', 'laptop', 'cake', 'shoe', 'dress', 'gadget', 'pastry', 'electronics'];
    for (const cat of categoryMatches) {
      if (new RegExp(`\\b${cat}s?\\b`, 'i').test(text)) {
        context.preferredCategory = cat;
        break;
      }
    }

    // Delivery location extraction
    const nigerianAreas = ['Lekki', 'Ikeja', 'Victoria Island', 'Ikoyi', 'Yaba', 'Surulere', 'Maitama', 'Garki', 'Wuse', 'Asokoro'];
    let foundArea = null;
    for (const area of nigerianAreas) {
      if (new RegExp(`\\b${area}\\b`, 'i').test(text)) {
        foundArea = area;
        break;
      }
    }

    if (foundArea) {
      context.deliveryLocation = foundArea;
    } else {
      const locationMatch = text.match(/\b(?:in|to|at|deliver to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
      if (locationMatch && !['Nigeria', 'Lagos', 'Abuja', 'Monday', 'Friday'].includes(locationMatch[1])) {
        context.deliveryLocation = locationMatch[1];
      }
    }


    // Product specific mentions
    const productMatch = text.match(/\b(iPhone(?:\s+\d+)?(?:\s+pro|\s+max)?|MacBook|Red Velvet|Chocolate Cake|Airpods|Sneakers)\b/i);
    if (productMatch) {
      const prod = productMatch[0];
      if (!context.interestedProducts.includes(prod)) {
        context.interestedProducts.push(prod);
      }
    }

    context.turnCount = (context.turnCount || 0) + 1;
  }

  /**
   * Loads conversation history from DB or returns provided array.
   *
   * @param {string} conversationId
   * @param {Array} [fallbackHistory=[]]
   * @returns {Promise<{ history: Array, status: string }>}
   */
  async loadConversationHistory(conversationId, fallbackHistory = []) {
    if (this.db?.conversation?.findUnique && conversationId) {
      try {
        const conv = await this.db.conversation.findUnique({
          where: { id: conversationId }
        });
        if (conv) {
          const msgs = Array.isArray(conv.messages) ? conv.messages : [];
          return {
            history: msgs,
            status: conv.status || ConversationStatus.ACTIVE
          };
        }
      } catch (err) {
        console.warn(`[ConversationEngine] DB load failed for ${conversationId}:`, err?.message);
      }
    }

    return {
      history: fallbackHistory,
      status: ConversationStatus.ACTIVE
    };
  }

  /**
   * Saves updated messages to DB if available.
   *
   * @param {string} conversationId
   * @param {Array} updatedMessages
   */
  async persistMessages(conversationId, updatedMessages) {
    if (this.db?.conversation?.update && conversationId) {
      try {
        await this.db.conversation.update({
          where: { id: conversationId },
          data: { messages: updatedMessages }
        });
      } catch (err) {
        console.warn(`[ConversationEngine] DB persist failed for ${conversationId}:`, err?.message);
      }
    }
  }

  /**
   * Main entrypoint for processing a customer message turn.
   *
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {string} params.message - Customer message.
   * @param {Array} [params.history] - Optional explicit history for testing.
   * @returns {Promise<import('./types.js').ProcessMessageResult>}
   */
  async processMessage({ conversationId, message, history: explicitHistory = null }) {
    const startTime = Date.now();
    const session = this.getSessionContext(conversationId);

    // 1. Update rolling session preferences
    this.updateSessionPreferences(message, session);

    // 2. Load conversation history
    const { history: storedHistory, status } = await this.loadConversationHistory(
      conversationId,
      explicitHistory || []
    );

    const history = explicitHistory !== null ? explicitHistory : storedHistory;

    // 3. Classify Customer Intent
    const classification = IntentClassifier.classify(message, session);

    // 4. Check for Human Handoff (PRD §4.8)
    const handoffCheck = this.handoffManager.shouldHandoff(classification, message);

    if (handoffCheck.shouldHandoff || status === ConversationStatus.HANDED_OFF) {
      const businessProfile = await this.groundingService.gateway.getBusinessProfile();
      const handoffResult = await this.handoffManager.triggerHandoff({
        conversationId,
        businessId: this.businessId,
        customerMessage: message,
        reason: handoffCheck.reason || HandoffReason.EXPLICIT_REQUEST,
        businessName: businessProfile?.name || 'our store'
      });

      const responseText = handoffResult.empathyResponse;

      // Persist messages
      const updatedMessages = [
        ...history,
        { role: 'user', content: message, createdAt: new Date().toISOString() },
        { role: 'model', content: responseText, createdAt: new Date().toISOString() }
      ];
      await this.persistMessages(conversationId, updatedMessages);

      return {
        ok: true,
        conversationId,
        response: responseText,
        intent: IntentType.HUMAN_HANDOFF,
        handoff: handoffResult,
        context: session,
        latencyMs: Date.now() - startTime
      };
    }

    // 5. Build Scoped Grounding & Policy Context (S3)
    const groundingContext = await this.groundingService.getGroundingContext();
    const policyChecker = groundingContext.policyChecker;

    let responseText = '';

    // 5b. Check for Sales Objections (PRD §6.4)
    const objection = ObjectionHandler.detectObjection(message);
    if (objection.hasObjection) {
      // Find current product if customer was discussing one
      const currentProductName = session.interestedProducts[session.interestedProducts.length - 1];
      const catalog = groundingContext.profile?.products || [];
      const currentProduct = catalog.find(p => (p.name || '').toLowerCase() === (currentProductName || '').toLowerCase()) || null;

      const objectionResult = ObjectionHandler.handleObjection({
        objectionType: objection.type,
        customerMessage: message,
        currentProduct,
        catalog,
        policies: groundingContext.profile?.policies ? (typeof groundingContext.profile.policies === 'string' ? JSON.parse(groundingContext.profile.policies) : groundingContext.profile.policies) : {},
        businessName: groundingContext.profile?.name || 'our store'
      });

      if (objectionResult.handled) {
        responseText = objectionResult.response;
      }
    }

    // Route Sub-behavior: SUPPORT_POLICY
    if (!responseText && classification.intent === IntentType.SUPPORT_POLICY) {
      const lower = message.toLowerCase();

      if (lower.includes('return')) {
        const ret = policyChecker.getReturnPolicy();
        responseText = ret.message;
      } else if (lower.includes('refund')) {
        const ref = policyChecker.getRefundPolicy();
        responseText = ref.message;
      } else if (lower.includes('delivery') || lower.includes('deliver') || lower.includes('ship')) {
        const location = session.deliveryLocation || message;
        const del = policyChecker.checkDeliveryArea(location);
        responseText = del.message;
      } else if (lower.includes('hour') || lower.includes('open') || lower.includes('close')) {
        responseText = `Our operating hours are: ${JSON.stringify(groundingContext.profile?.hours || 'Mon-Sat 9am-6pm')}.`;
      } else if (lower.includes('pay') || lower.includes('payment')) {
        const pay = policyChecker.getPaymentMethods();
        responseText = pay.message;
      } else {
        const ans = policyChecker.extractPolicyAnswer(message);
        responseText = ans.answer;
      }
    }
    // Route Sub-behavior: GREETING
    else if (!responseText && classification.intent === IntentType.GREETING && history.length <= 1) {
      const bizName = groundingContext.profile?.name || 'Voxy Store';
      responseText = `Hello! Welcome to ${bizName}. How can I assist you today?`;
    }
    // Route Sub-behavior: PRODUCT_INQUIRY, RECOMMENDATION_REQUEST, ORDER_INTENT
    else if (!responseText) {
      // Format session preferences into dynamic reasoning prompt
      const sessionPreferenceNote = [
        session.preferredCategory ? `Customer preferred category: ${session.preferredCategory}.` : '',
        session.budget ? `Customer budget: ₦${session.budget.toLocaleString()}.` : '',
        session.deliveryLocation ? `Customer delivery area: ${session.deliveryLocation}.` : '',
        session.interestedProducts.length ? `Previously interested in: ${session.interestedProducts.join(', ')}.` : ''
      ].filter(Boolean).join(' ');

      const enrichedGrounding = {
        ...groundingContext,
        businessSummary: `${groundingContext.businessSummary}\nActive Customer Preferences: ${sessionPreferenceNote || 'None stated yet.'}`
      };

      const systemPrompt = buildGroundedSystemPrompt(enrichedGrounding);

      // Assemble conversational turns
      const conversationalTurns = [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];

      const reasoningRequest = buildReasoningRequest({
        history: conversationalTurns,
        systemInstruction: systemPrompt,
        businessId: this.businessId
      });


      // Execute reasoning layer
      const reasoningOutput = await this.reasoningRunner(reasoningRequest);
      responseText = reasoningOutput?.text || "I'll check with the business owner and get back to you shortly.";
    }

    // 6. Persist Updated History
    const updatedMessages = [
      ...history,
      { role: 'user', content: message, createdAt: new Date().toISOString() },
      { role: 'model', content: responseText, createdAt: new Date().toISOString() }
    ];
    await this.persistMessages(conversationId, updatedMessages);

    return {
      ok: true,
      conversationId,
      response: responseText,
      intent: classification.intent,
      handoff: { triggered: false },
      context: session,
      latencyMs: Date.now() - startTime
    };
  }
}

export function createConversationEngine(options) {
  return new ConversationEngine(options);
}

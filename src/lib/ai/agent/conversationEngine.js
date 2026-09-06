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
import { createBusinessDataGateway } from './businessData.js';
import { SalesPlaybook } from './sales/salesPlaybook.js';
import { ObjectionHandler, ObjectionType } from './sales/objectionHandler.js';
import { resolveLanguage } from '../../langDetect.js';

export class ConversationEngine {
  /**
   * @param {Object} options
   * @param {string} options.businessId - Tenant identifier.
   * @param {Object} [options.db] - Optional Prisma / mock database client.
   * @param {HandoffManager} [options.handoffManager]
   * @param {GroundingService} [options.groundingService]
   * @param {Function} [options.reasoningRunner] - Custom runner for reasoning tests.
   * @param {boolean} [options.voiceMode] - When true, injects voice-optimised prompt rules.
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
    /** @type {boolean} If true, system prompt is tuned for spoken voice responses. */
    this.voiceMode = options.voiceMode || false;

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


    // Email extraction
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    if (emailMatch) {
      context.customerEmail = emailMatch[0];
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
   * @param {string} [params.preferredLanguage] - Explicit language override ('yo', 'ha', 'pcm', etc.)
   * @param {string} [params.language] - Alias for preferredLanguage
   * @returns {Promise<import('./types.js').ProcessMessageResult>}
   */
  async processMessage({ conversationId, message, history: explicitHistory = null, customerId = null, customerEmail = null, preferredLanguage = null, language = null }) {
    const startTime = Date.now();
    const session = this.getSessionContext(conversationId);

    // 1. Update rolling session preferences
    this.updateSessionPreferences(message, session);

    // Resolve Language Preference & Auto-Detection
    const groundingCtx = await this.groundingService.getGroundingContext();
    const supportedLangs = groundingCtx.profile?.assistantConfig?.languages || groundingCtx.profile?.supportedLanguages || ['en'];
    const resolvedLang = resolveLanguage({
      text: message,
      preferredLanguage: preferredLanguage || language,
      currentSessionLanguage: session.languageCode || null,
      supportedLanguages: supportedLangs,
    });
    session.preferredLanguage = resolvedLang.langName;
    session.languageCode = resolvedLang.langCode;
    if (customerEmail && !session.customerEmail) {
      session.customerEmail = customerEmail;
    }

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

    if (status === ConversationStatus.HANDED_OFF) {
      // Conversation has been taken over by human/business. AI MUST NOT reply.
      const updatedMessages = [
        ...history,
        { role: 'user', content: message, createdAt: new Date().toISOString() }
      ];
      await this.persistMessages(conversationId, updatedMessages);

      return {
        ok: true,
        conversationId,
        response: null,
        intent: IntentType.HUMAN_HANDOFF,
        handoff: {
          triggered: true,
          reason: HandoffReason.EXPLICIT_REQUEST,
          customerMessage: message,
          empathyResponse: null
        },
        language: resolvedLang,
        context: session,
        latencyMs: Date.now() - startTime
      };
    }

    if (handoffCheck.shouldHandoff) {
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
        language: resolvedLang,
        context: session,
        latencyMs: Date.now() - startTime
      };
    }

    // 5. Build Scoped Grounding & Business Context (Task S3 & S4)
    const promptGrounding = await this.groundingService.buildPromptGrounding({
      language: resolvedLang.langName,
      languageCode: resolvedLang.langCode,
      isSupportedLanguage: resolvedLang.isSupported,
      isMultilingualEnabled: resolvedLang.isMultilingualEnabled,
      allowedLanguages: resolvedLang.allowedLanguages,
    });

    // Format session preferences & active state into dynamic context
    const sessionPreferenceNote = [
      session.preferredCategory ? `Preferred Category: ${session.preferredCategory}` : '',
      session.budget ? `Budget Limit: ₦${session.budget.toLocaleString()}` : '',
      session.deliveryLocation ? `Delivery Area: ${session.deliveryLocation}` : '',
      session.customerEmail ? `Customer Email: ${session.customerEmail}` : '',
      session.interestedProducts.length ? `Items of Interest: ${session.interestedProducts.join(', ')}` : ''
    ].filter(Boolean).join(' | ');

    // Check for recent verified payment & receipt for this business
    let receiptNote = '';
    if (this.db?.receipt?.findFirst || this.db?.payment?.findUnique) {
      try {
        let latestReceipt = null;
        const refMatch = message.match(/PAY_[A-Za-z0-9_]+/i);

        if (refMatch) {
          const matchedRef = refMatch[0];
          // If payment is pending in DB when customer returns to chat, attempt verification
          if (this.db?.payment?.findUnique) {
            const p = await this.db.payment.findUnique({ where: { reference: matchedRef } }).catch(() => null);
            if (p && p.status === 'PENDING') {
              try {
                const pMod = await import('@/lib/services/payment-service');
                await pMod.PaymentService.verifyPayment(matchedRef).catch(() => {});
              } catch {}
            }
          }

          if (this.db?.receipt?.findFirst) {
            latestReceipt = await this.db.receipt.findFirst({
              where: { payment: { reference: matchedRef } },
              include: { customer: true, payment: true, order: { include: { items: { include: { product: true } } } } }
            }).catch(() => null);
          }
        }

        if (!latestReceipt && this.db?.receipt?.findFirst) {
          const whereClause = { businessId: this.businessId };
          if (customerId) whereClause.customerId = customerId;
          latestReceipt = await this.db.receipt.findFirst({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { customer: true, payment: true, order: { include: { items: { include: { product: true } } } } }
          }).catch(() => null);
        }

        if (latestReceipt) {
          const amt = (latestReceipt.amountKobo / 100).toLocaleString();
          const itemsStr = (latestReceipt.order?.items || []).map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ');
          receiptNote = `\n[VERIFIED PAYMENT & RECEIPT RECORD]: Receipt #${latestReceipt.receiptNumber} issued. Amount Paid: ₦${amt}. Status: VERIFIED SUCCESS. Ref: ${latestReceipt.payment?.reference || 'N/A'}. Items: ${itemsStr || 'N/A'}. Customer Email: ${latestReceipt.customer?.email || 'N/A'}. (When responding to customer after payment, present a clean formatted markdown receipt showing Receipt #, Amount, Items, Payment Reference, and Status, and state that the payment was verified and receipt has been generated).`;
        }
      } catch (receiptErr) {
        // Soft fallback
      }
    }

    const enrichedGrounding = {
      ...promptGrounding,
      businessSummary: `${promptGrounding.businessSummary}\n[Active Customer Context]: ${sessionPreferenceNote || 'First turn / no specific preferences recorded yet.'}${receiptNote}`
    };

    // Build voice-optimised rules addendum if running in voice mode
    const voiceAddendum = this.voiceMode
      ? '\n\nVOICE MODE RULES (CRITICAL — you are speaking, not writing):\n' +
        '- Respond in SHORT, NATURAL spoken sentences. Maximum 3 sentences per turn.\n' +
        '- NEVER use markdown: no bullet points (*), no bold (**), no headers (#), no tables, no code blocks.\n' +
        '- NEVER read out URLs, long reference numbers, or email addresses verbatim — summarise them instead.\n' +
        '- Speak as if talking on a phone call. Use plain conversational language.\n' +
        '- When listing products, name at most 3 items and offer to share more if needed.\n' +
        '- Numbers and prices: say them naturally, e.g. "fifty thousand naira" not "₦50,000".'
      : '';

    const systemPrompt = buildGroundedSystemPrompt(enrichedGrounding) + voiceAddendum;

    // Assemble conversational turn window
    const conversationalTurns = [
      ...history.map(m => ({ role: m.role === 'model' ? 'model' : 'user', content: m.content })),
      { role: 'user', content: message }
    ];

    const reasoningRequest = {
      ...buildReasoningRequest({
        history: conversationalTurns,
        systemInstruction: systemPrompt,
        businessId: this.businessId
      }),
      context: {
        businessId: this.businessId,
        data: this.groundingService.gateway,
        customerId: customerId || session?.customerId || null,
        customerEmail: customerEmail || session?.customerEmail || null,
        conversationId
      }
    };

    // Build a BusinessDataGateway so tools (product_lookup, recommend_products, etc.)
    // can actually execute DB reads. Without this, every tool call returns MISSING_GATEWAY.
    const dataGateway = createBusinessDataGateway({
      businessId: this.businessId,
      db: this.db
    });

    // If payment reference / receipt is present in context, omit request_payment permission to prevent re-requesting payment
    const hasPaymentRef = Boolean(message.match(/PAY_[A-Za-z0-9_]+/i) || message.match(/REC-[A-Za-z0-9_-]+/i) || receiptNote);
    const permissions = hasPaymentRef
      ? ['read_catalogue', 'draft_order']
      : ['read_catalogue', 'draft_order', 'request_payment'];

    // Execute agentic reasoning engine with multi-tool execution loop
    const reasoningOutput = await this.reasoningRunner({
      ...reasoningRequest,
      context: {
        businessId: this.businessId,
        customerId: customerId || session?.customerId || null,
        customerEmail: customerEmail || session?.customerEmail || null,
        customerName: session?.customerName || null,
        conversationId,
        grantedPermissions: permissions,
        data: dataGateway,
        confirmation: null
      }
    });
    const responseText = reasoningOutput?.text || "I'll check with our store management and get back to you right away.";

    // 6. Check if response indicates AI deflection or handoff to team
    const isDeflection = responseText.includes("member of the team") ||
                         responseText.includes("talk to a human") ||
                         responseText.includes("store management") ||
                         responseText.includes("notify the business owner") ||
                         responseText.includes("bring in a member");

    let handoffResult = { triggered: false };
    if (isDeflection) {
      handoffResult = await this.handoffManager.triggerHandoff({
        conversationId,
        businessId: this.businessId,
        customerMessage: message,
        reason: 'ai_deflection',
        businessName: enrichedGrounding.businessName || 'our store'
      }).catch(() => ({ triggered: true }));
    }

    // 7. Persist Updated History
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
      handoff: handoffResult,
      language: resolvedLang,
      context: session,
      latencyMs: Date.now() - startTime
    };
  }
}

export function createConversationEngine(options) {
  return new ConversationEngine(options);
}

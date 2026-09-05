/**
 * S4: Human Handoff Manager (PRD §4.8).
 *
 * Implements escalation workflows when:
 * 1. Customer explicitly asks for a human / manager / phone call.
 * 2. Complex complaints, financial disputes, or hostile sentiment occur.
 * 3. System detects unrecoverable ambiguity or unsupported operational requests.
 */

import { HandoffReason, ConversationStatus } from './types.js';
import { notifyBusiness } from '../../notifications.js';

export class HandoffManager {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.db] - Optional Prisma or mock db client.
   * @param {Function} [options.notifier] - Notification function.
   */
  constructor(options = {}) {
    this.db = options.db;
    this.notifier = options.notifier || notifyBusiness;
  }

  /**
   * Checks whether a message or classification requires human handoff.
   *
   * @param {import('./types.js').IntentClassificationResult} classification
   * @param {string} customerMessage
   * @returns {{ shouldHandoff: boolean, reason: string|null }}
   */
  shouldHandoff(classification, customerMessage) {
    if (classification?.intent === 'HUMAN_HANDOFF') {
      return {
        shouldHandoff: true,
        reason: classification.entities?.handoffReason || HandoffReason.EXPLICIT_REQUEST
      };
    }

    const lower = (customerMessage || '').toLowerCase();

    if (
      lower.includes('talk to a human') ||
      lower.includes('human agent') ||
      lower.includes('real person') ||
      lower.includes('call the manager')
    ) {
      return {
        shouldHandoff: true,
        reason: HandoffReason.EXPLICIT_REQUEST
      };
    }

    if (
      lower.includes('fraud') ||
      lower.includes('scam') ||
      lower.includes('sue you') ||
      lower.includes('police') ||
      lower.includes('charged twice')
    ) {
      return {
        shouldHandoff: true,
        reason: HandoffReason.COMPLEX_COMPLAINT
      };
    }

    return { shouldHandoff: false, reason: null };
  }

  /**
   * Generates a warm, empathetic response acknowledging escalation to a human.
   *
   * @param {string} reason - One of {@link HandoffReason}.
   * @param {string} [businessName='the business']
   * @returns {string}
   */
  generateEmpathyResponse(reason, businessName = 'our team') {
    switch (reason) {
      case HandoffReason.EXPLICIT_REQUEST:
        return `I understand completely. I am connecting you directly with a human team member at ${businessName}. Someone will respond shortly to assist you!`;

      case HandoffReason.COMPLEX_COMPLAINT:
      case HandoffReason.SENTIMENT_ESCALATION:
        return `I truly apologize for the inconvenience and frustration. I have escalated this conversation directly to the management of ${businessName} so they can review and resolve this for you right away.`;

      case HandoffReason.UNSUPPORTED_REQUEST:
      case HandoffReason.REPEATED_CONFUSION:
      default:
        return `To make sure you get the exact help you need, I am handing this conversation over to the ${businessName} team. An agent will step in shortly.`;
    }
  }

  /**
   * Executes the handoff: updates conversation status and alerts business owner.
   *
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {string} params.businessId
   * @param {string} params.customerMessage
   * @param {string} params.reason
   * @param {string} [params.businessName]
   * @returns {Promise<import('./types.js').HandoffPayload>}
   */
  async triggerHandoff({
    conversationId,
    businessId,
    customerMessage,
    reason = HandoffReason.EXPLICIT_REQUEST,
    businessName = 'our team'
  }) {
    const timestamp = new Date().toISOString();
    const empathyResponse = this.generateEmpathyResponse(reason, businessName);

    // 1. Update DB conversation status if db available
    if (this.db?.conversation?.update && conversationId) {
      try {
        await this.db.conversation.update({
          where: { id: conversationId },
          data: { status: ConversationStatus.HANDED_OFF }
        });
      } catch (err) {
        console.warn(`[HandoffManager] DB status update error for ${conversationId}:`, err?.message);
      }
    }

    // 2. Dispatch real-time escalation notification to owner
    if (conversationId && typeof this.notifier === 'function') {
      try {
        const urgency = reason === HandoffReason.COMPLEX_COMPLAINT ? 'urgent' : 'high';
        await this.notifier(conversationId, urgency);
      } catch (err) {
        console.warn(`[HandoffManager] Notification error for ${conversationId}:`, err?.message);
      }
    }

    return {
      triggered: true,
      reason,
      customerMessage,
      empathyResponse,
      conversationId,
      timestamp
    };
  }
}

export function createHandoffManager(options) {
  return new HandoffManager(options);
}

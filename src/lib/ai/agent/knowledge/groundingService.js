/**
 * GroundingService — Scoped business knowledge retrieval and prompt preparation.
 *
 * WHY THIS EXISTS (PRD §4.1): Voxy must act only on approved business information.
 * Never invent products, prices, stock, discounts, delivery times, or policies.
 *
 * GroundingService enforces:
 *   1. Scoping per businessId — strict multi-tenant isolation, no data leakage.
 *   2. Sanitization — strips internal database IDs, tokens, and credentials.
 *   3. Authoritative policy checking via PolicyChecker.
 *   4. Clean structured context for system instructions and prompt builders.
 */

import { BusinessDataGateway, createBusinessDataGateway } from '../businessData.js';
import { PolicyChecker, createPolicyChecker } from './policyChecker.js';

export class GroundingService {
  /**
   * @param {Object} opts
   * @param {string} [opts.businessId]
   * @param {BusinessDataGateway} [opts.gateway]
   * @param {*} [opts.db] - DB handle or Prisma instance
   */
  constructor({ businessId, gateway, db } = {}) {
    if (gateway) {
      /** @type {BusinessDataGateway} */
      this.gateway = gateway;
      /** @type {string} */
      this.businessId = gateway.businessId;
    } else if (businessId) {
      /** @type {string} */
      this.businessId = businessId;
      /** @type {BusinessDataGateway} */
      this.gateway = createBusinessDataGateway({ businessId, db });
    } else {
      throw new Error('GroundingService requires either a businessId or a BusinessDataGateway instance.');
    }
  }

  /**
   * Fetch verified, sanitized business facts for the scoped businessId.
   * 
   * @returns {Promise<{
   *   profile: Object|null,
   *   policies: Object,
   *   policyChecker: PolicyChecker,
   *   businessSummary: string
   * }>}
   */
  async getGroundingContext() {
    const [rawProfile, rawPolicies] = await Promise.all([
      this.gateway.getBusinessProfile(),
      this.gateway.getPolicies(),
    ]);

    if (!rawProfile) {
      const emptyChecker = createPolicyChecker({ profile: {}, policies: {} });
      return {
        profile: null,
        policies: { returns: null, delivery: null, refunds: null, payment: null },
        policyChecker: emptyChecker,
        businessSummary: 'No business profile found. Do not invent any business details.'
      };
    }

    // 1. Sanitize: Extract only safe, customer-facing fields (NO internal IDs, owner IDs, auth secrets)
    const sanitizedProfile = {
      name: rawProfile.name,
      description: rawProfile.description || '',
      hours: rawProfile.hours || null,
      deliveryAreas: Array.isArray(rawProfile.deliveryAreas) ? [...rawProfile.deliveryAreas] : [],
      deliveryInfo: rawProfile.deliveryInfo || null,
      products: Array.isArray(rawProfile.products) ? rawProfile.products : [],
      contact: {
        phone: rawProfile.contact?.phone || '',
        email: rawProfile.contact?.email || ''
      },
      assistantConfig: {
        tone: rawProfile.assistantConfig?.tone || 'friendly, confident, and professional',
        languages: rawProfile.assistantConfig?.languages || ['en'],
        instructions: rawProfile.assistantConfig?.instructions || ''
      }
    };

    const sanitizedPolicies = {
      returns: rawPolicies.returns || null,
      delivery: rawPolicies.delivery || sanitizedProfile.deliveryInfo || null,
      refunds: rawPolicies.refunds || null,
      payment: rawPolicies.payment || null
    };

    // 2. Instantiate PolicyChecker
    const policyChecker = createPolicyChecker({
      profile: sanitizedProfile,
      policies: sanitizedPolicies
    });

    // 3. Build dense, authoritative business summary for prompt injection
    const summaryLines = [];
    summaryLines.push(`Business Name: ${sanitizedProfile.name}`);
    if (sanitizedProfile.description) {
      summaryLines.push(`Description: ${sanitizedProfile.description}`);
    }

    // Operating Hours
    if (sanitizedProfile.hours) {
      const hoursStr = typeof sanitizedProfile.hours === 'object'
        ? Object.entries(sanitizedProfile.hours)
            .map(([day, val]) => `${day}: ${typeof val === 'object' ? `${val.open || ''}-${val.close || ''}` : val}`)
            .join(', ')
        : String(sanitizedProfile.hours);
      summaryLines.push(`Operating Hours: ${hoursStr}`);
    } else {
      summaryLines.push(`Operating Hours: Not specified (say: "I'll check with the business owner")`);
    }

    // Delivery Areas
    if (sanitizedProfile.deliveryAreas.length > 0) {
      summaryLines.push(`Approved Delivery Areas: ${sanitizedProfile.deliveryAreas.join(', ')}`);
    } else {
      summaryLines.push(`Approved Delivery Areas: None specified (say: "I'll check with the business owner")`);
    }

    // Authoritative Policies
    summaryLines.push('Policies (quote verbatim, never invent):');
    summaryLines.push(`- Return Policy: ${sanitizedPolicies.returns || "Not specified (say: \"I'll check with the business owner\")"}`);
    summaryLines.push(`- Refund Policy: ${sanitizedPolicies.refunds || "Not specified (say: \"I'll check with the business owner\")"}`);
    summaryLines.push(`- Delivery Terms: ${sanitizedPolicies.delivery || "Not specified (say: \"I'll check with the business owner\")"}`);
    summaryLines.push(`- Payment Methods: ${sanitizedPolicies.payment || "Not specified (say: \"I'll check with the business owner\")"}`);

    if (sanitizedProfile.contact.phone || sanitizedProfile.contact.email) {
      const contactStr = [
        sanitizedProfile.contact.phone ? `Phone: ${sanitizedProfile.contact.phone}` : '',
        sanitizedProfile.contact.email ? `Email: ${sanitizedProfile.contact.email}` : ''
      ].filter(Boolean).join(' | ');
      summaryLines.push(`Contact: ${contactStr}`);
    }

    return {
      profile: sanitizedProfile,
      policies: sanitizedPolicies,
      policyChecker,
      businessSummary: summaryLines.join('\n')
    };
  }

  /**
   * Prepares grounding context ready for buildSystemInstruction or prompt builders.
   *
   * @param {{ language?: string, customInstructions?: string }} [opts]
   * @returns {Promise<import('../systemInstruction.js').GroundingContext & { policyChecker: PolicyChecker }>}
   */
  async buildPromptGrounding(opts = {}) {
    const { profile, policies, policyChecker, businessSummary } = await this.getGroundingContext();

    return {
      businessName: profile?.name || '',
      tone: profile?.assistantConfig?.tone || 'friendly, confident, and professional',
      language: opts.language || profile?.assistantConfig?.languages?.[0] || 'English',
      businessSummary,
      assistantInstructions: opts.customInstructions || profile?.assistantConfig?.instructions || '',
      policyChecker,
      profile,
      policies
    };
  }
}

/**
 * Factory for GroundingService.
 * @param {{ businessId?: string, gateway?: BusinessDataGateway, db?: * }} opts
 * @returns {GroundingService}
 */
export function createGroundingService(opts) {
  return new GroundingService(opts);
}

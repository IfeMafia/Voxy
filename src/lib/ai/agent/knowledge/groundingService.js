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
import { getLanguageName } from '../../../langDetect.js';

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
    // 1. Sanitize: Extract only safe, customer-facing fields (NO internal IDs, owner IDs, auth secrets)
    const sanitizedProfile = {
      name: rawProfile.name,
      category: rawProfile.category || '',
      description: rawProfile.description || '',
      hours: rawProfile.hours || null,
      address: rawProfile.address || null,
      socialLinks: rawProfile.socialLinks || null,
      deliveryAreas: Array.isArray(rawProfile.deliveryAreas) ? [...rawProfile.deliveryAreas] : [],
      deliveryInfo: rawProfile.deliveryInfo || null,
      products: Array.isArray(rawProfile.products) ? rawProfile.products : [],
      contact: {
        phone: rawProfile.contact?.phone || rawProfile.contactPhone || rawProfile.phone || '',
        email: rawProfile.contact?.email || rawProfile.email || ''
      },
      assistantConfig: {
        tone: rawProfile.assistantConfig?.tone || 'friendly, confident, and professional',
        languages: rawProfile.assistantConfig?.languages || rawProfile.supportedLanguages || ['en'],
        instructions: rawProfile.assistantConfig?.instructions || ''
      }
    };

    const sanitizedPolicies = {
      returns: rawPolicies.returns || null,
      delivery: rawPolicies.delivery || sanitizedProfile.deliveryInfo || null,
      refunds: rawPolicies.refunds || null,
      payment: rawPolicies.payment || 'Paystack (Card, Bank Transfer, USSD via Paystack payment link)'
    };

    // 2. Instantiate PolicyChecker
    const policyChecker = createPolicyChecker({
      profile: sanitizedProfile,
      policies: sanitizedPolicies
    });

    // 3. Build dense, authoritative business summary for prompt injection
    const summaryLines = [];
    summaryLines.push(`Business Name: ${sanitizedProfile.name}`);
    if (sanitizedProfile.category) {
      summaryLines.push(`Category: ${sanitizedProfile.category}`);
    }
    if (sanitizedProfile.description) {
      summaryLines.push(`Description: ${sanitizedProfile.description}`);
    }

    // Physical Address / Location
    if (sanitizedProfile.address) {
      const addr = typeof sanitizedProfile.address === 'object'
        ? [sanitizedProfile.address.street, sanitizedProfile.address.city, sanitizedProfile.address.state, sanitizedProfile.address.country].filter(Boolean).join(', ')
        : String(sanitizedProfile.address);
      if (addr.trim()) {
        summaryLines.push(`Physical Address / Location: ${addr}`);
      }
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

    // Supported Languages / Language Services
    const supportedLangNames = (sanitizedProfile.assistantConfig.languages || ['en'])
      .map((l) => getLanguageName(l))
      .filter((v, i, a) => a.indexOf(v) === i);
    summaryLines.push(`Supported Languages / Language Services: ${supportedLangNames.join(', ')} (Answer directly when asked what languages are supported)`);

    // Authoritative Policies
    summaryLines.push('Policies (quote verbatim, never invent):');
    summaryLines.push(`- Return Policy: ${sanitizedPolicies.returns || "Not specified (say: \"I'll check with the business owner\")"}`);
    summaryLines.push(`- Refund Policy: ${sanitizedPolicies.refunds || "Not specified (say: \"I'll check with the business owner\")"}`);
    summaryLines.push(`- Delivery Terms: ${sanitizedPolicies.delivery || "Not specified (say: \"I'll check with the business owner\")"}`);
    summaryLines.push(`- Payment Methods: ${sanitizedPolicies.payment || "Not specified (say: \"I'll check with the business owner\")"}`);

    // Official Business Products Catalogue
    if (sanitizedProfile.products && sanitizedProfile.products.length > 0) {
      summaryLines.push('\nOFFICIAL PRODUCT CATALOGUE (THESE ARE THE ONLY PRODUCTS YOU SELL — NEVER INVENT OTHERS):');
      sanitizedProfile.products.forEach(p => {
        const priceStr = typeof p.price === 'number' ? `₦${p.price.toLocaleString()}` : p.price || 'Price on request';
        let stockMeter = 'In stock';
        if (!p.isAvailable || p.stockQuantity === 0) {
          stockMeter = 'Out of stock';
        } else if (p.stockQuantity !== null && p.stockQuantity !== undefined && p.stockQuantity <= 3) {
          stockMeter = 'Low stock (selling fast)';
        }
        summaryLines.push(`- ${p.name}: ${priceStr} | Stock Level: ${stockMeter} | Description: ${p.description || 'N/A'}`);
      });
    } else {
      summaryLines.push('\nOFFICIAL PRODUCT CATALOGUE: Empty (No products listed in store catalogue yet. If asked for recommendations or products, state truthfully that no products are listed yet and offer to check with the business owner).');
    }

    // Contact Details & Social / Online Channels
    const contactParts = [];
    if (sanitizedProfile.contact.phone) contactParts.push(`Phone: ${sanitizedProfile.contact.phone}`);
    if (sanitizedProfile.contact.email) contactParts.push(`Email: ${sanitizedProfile.contact.email}`);

    if (sanitizedProfile.socialLinks && typeof sanitizedProfile.socialLinks === 'object') {
      const s = sanitizedProfile.socialLinks;
      if (s.whatsapp) contactParts.push(`WhatsApp: ${s.whatsapp}`);
      if (s.instagram) contactParts.push(`Instagram: @${s.instagram.replace(/^@/, '')}`);
      if (s.twitter || s.x) contactParts.push(`Twitter/X: @${(s.twitter || s.x).replace(/^@/, '')}`);
      if (s.website) contactParts.push(`Website: ${s.website}`);
      if (s.facebook) contactParts.push(`Facebook: ${s.facebook}`);
    }
    if (contactParts.length > 0) {
      summaryLines.push(`\nContact & Online Channels: ${contactParts.join(' | ')}`);
    }

    // Custom Owner Instructions
    if (sanitizedProfile.assistantConfig.instructions) {
      summaryLines.push(`\nCustom Business Owner Instructions: ${sanitizedProfile.assistantConfig.instructions}`);
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
   * @param {{ language?: string, isSupportedLanguage?: boolean, customInstructions?: string }} [opts]
   * @returns {Promise<import('../systemInstruction.js').GroundingContext & { policyChecker: PolicyChecker }>}
   */
  async buildPromptGrounding(opts = {}) {
    const { profile, policies, policyChecker, businessSummary } = await this.getGroundingContext();

    const supportedLanguages = profile?.assistantConfig?.languages || ['en'];

    return {
      businessName: profile?.name || '',
      tone: profile?.assistantConfig?.tone || 'friendly, confident, and professional',
      language: opts.language || supportedLanguages[0] || 'English',
      isSupportedLanguage: opts.isSupportedLanguage !== undefined ? opts.isSupportedLanguage : true,
      supportedLanguages,
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

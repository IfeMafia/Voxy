/**
 * BusinessDataGateway — the single approved-data read seam for the agent.
 *
 * WHY THIS EXISTS (PRD §4.1): tools and the reasoning layer must never invent
 * products, prices, stock, discounts, delivery times, or policies. The way we
 * guarantee that structurally is: there is exactly ONE object through which the
 * agent may read business facts, and it only ever returns data that came from
 * the business's own approved records. If a fact didn't come through here, the
 * agent doesn't get to state it.
 *
 * S3 IMPLEMENTATION:
 *   - Consolidated business profile read behind `getBusinessProfile()`.
 *   - Consolidated structured policies read behind `getPolicies()`.
 *   - Both methods resolve against injected `db` (Prisma/pool/mock) or dynamically
 *     loads prisma when available, returning contract-compliant normalized data.
 *   - Scoped strictly to `this.businessId` to avoid cross-tenant leakage.
 *
 * @see public/docs/AI_AGENT_BACKEND_CONTRACTS.md
 */

import { NotImplementedError } from './errors.js';

/**
 * @typedef {import('./types.js').ProductRef} ProductRef
 * @typedef {import('./types.js').DraftOrder} DraftOrder
 */

export class BusinessDataGateway {
  /**
   * @param {Object} opts
   * @param {string} opts.businessId - Scopes every read to one business. Required.
   * @param {*} [opts.db] - DB handle or Prisma client (injected, not imported) so this stays testable
   *   and so the live DB module is never pulled into the agent core implicitly.
   * @param {*} [opts.apiClient] - Optional HTTP/API client if fetching over internal REST endpoints.
   */
  constructor({ businessId, db, apiClient } = {}) {
    if (!businessId) {
      throw new Error('BusinessDataGateway requires a businessId — reads are always business-scoped.');
    }
    /** @type {string} */
    this.businessId = businessId;
    /** @private */
    this._db = db ?? null;
    /** @private */
    this._apiClient = apiClient ?? null;
  }

  /**
   * Get DB or Prisma instance safely.
   * @private
   */
  async _resolveDb() {
    if (this._db) return this._db;
    try {
      const { prisma } = await import('../../prisma.js');
      return prisma;
    } catch {
      try {
        const { prisma } = await import('@/lib/prisma');
        return prisma;
      } catch {
        return null;
      }
    }
  }

  /**
   * Business profile (name, hours, delivery areas, policies, assistant config).
   * Contract: T1 §Business Profile Read.
   * 
   * @returns {Promise<Object|null>} Returns formatted profile or null if not found.
   */
  async getBusinessProfile() {
    // 1. Check if custom apiClient provided
    if (this._apiClient && typeof this._apiClient.getBusiness === 'function') {
      const remote = await this._apiClient.getBusiness(this.businessId);
      if (!remote) return null;
      return this._normalizeProfile(remote);
    }

    // 2. Query DB / Prisma
    const db = await this._resolveDb();
    if (!db) {
      throw new Error('BusinessDataGateway: No database connection or DB mock available.');
    }

    let raw = null;
    if (db.business && typeof db.business.findUnique === 'function') {
      raw = await db.business.findUnique({
        where: { id: this.businessId }
      });
    } else if (typeof db.query === 'function') {
      const res = await db.query('SELECT * FROM businesses WHERE id = $1', [this.businessId]);
      raw = res.rows ? res.rows[0] : null;
    } else if (typeof db.getBusinessById === 'function') {
      raw = await db.getBusinessById(this.businessId);
    }

    if (!raw) return null;
    return this._normalizeProfile(raw);
  }

  /**
   * Normalizes raw database or API business record to T1 contract.
   * @private
   */
  _normalizeProfile(raw) {
    let parsedHours = raw.hours ?? raw.business_hours ?? null;
    if (typeof parsedHours === 'string') {
      try {
        parsedHours = JSON.parse(parsedHours);
      } catch {
        // Keep string if not JSON
      }
    }

    let deliveryAreas = [];
    if (Array.isArray(raw.deliveryAreas)) {
      deliveryAreas = raw.deliveryAreas;
    } else if (typeof raw.deliveryInfo === 'string' && raw.deliveryInfo.trim()) {
      try {
        const parsed = JSON.parse(raw.deliveryInfo);
        if (Array.isArray(parsed)) deliveryAreas = parsed;
        else if (Array.isArray(parsed.areas)) deliveryAreas = parsed.areas;
        else deliveryAreas = [raw.deliveryInfo.trim()];
      } catch {
        deliveryAreas = raw.deliveryInfo.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (typeof raw.delivery_info === 'string' && raw.delivery_info.trim()) {
      deliveryAreas = raw.delivery_info.split(',').map(s => s.trim()).filter(Boolean);
    }

    const aiConfig = raw.aiConfig ?? raw.ai_config ?? {};

    return {
      id: raw.id,
      name: raw.name,
      description: raw.description || '',
      hours: parsedHours,
      deliveryAreas,
      deliveryInfo: typeof raw.deliveryInfo === 'string' ? raw.deliveryInfo : (raw.delivery_info || null),
      policies: raw.policies ?? null,
      contact: {
        phone: raw.phone || '',
        email: raw.email || ''
      },
      assistantConfig: {
        tone: aiConfig.tone || raw.assistant_tone || 'friendly, confident, and professional',
        languages: raw.supportedLanguages || ['en'],
        instructions: aiConfig.instructions || raw.assistant_instructions || ''
      }
    };
  }

  /**
   * Structured business policies (returns, delivery, refunds, payment) the agent may cite.
   * Contract: T1 §Policies Read.
   * 
   * @returns {Promise<{ returns: string|null, delivery: string|null, refunds: string|null, payment: string|null }>}
   */
  async getPolicies() {
    const profile = await this.getBusinessProfile();
    if (!profile) {
      return {
        returns: null,
        delivery: null,
        refunds: null,
        payment: null
      };
    }

    // 1. Try to read raw policies field from DB/profile
    const rawPolicies = profile.policies ?? null;
    let parsed = {};

    if (rawPolicies) {
      if (typeof rawPolicies === 'object') {
        parsed = rawPolicies;
      } else if (typeof rawPolicies === 'string') {
        try {
          parsed = JSON.parse(rawPolicies);
        } catch {
          // If plain text, assign to returns or general policy
          parsed = { returns: rawPolicies };
        }
      }
    }

    // 2. Derive delivery policy from deliveryInfo if not explicitly structured
    const deliveryPolicy = parsed.delivery || profile.deliveryInfo || (
      profile.deliveryAreas.length > 0
        ? `We deliver to: ${profile.deliveryAreas.join(', ')}.`
        : null
    );

    return {
      returns: parsed.returns || null,
      delivery: deliveryPolicy,
      refunds: parsed.refunds || null,
      payment: parsed.payment || null
    };
  }

  /**
   * Search the approved catalogue. Returns real products only; an empty array is
   * a valid answer and must be surfaced honestly (do NOT let the model invent a
   * product to fill the gap).
   * Contract: T2 §Product Catalogue Query.
   * @param {{ text?: string, maxPrice?: number, category?: string }} query
   * @returns {Promise<ProductRef[]>}
   */
  async findProducts(query = {}) {
    throw new NotImplementedError(
      'BusinessDataGateway.findProducts',
      'T2 §Product Catalogue Query',
      { businessId: this.businessId, query }
    );
  }

  /**
   * Fetch one product by its catalogue id (used when building an order line).
   * Contract: T2 §Product Read By Id.
   * @param {string} productId
   * @returns {Promise<ProductRef|null>}
   */
  async getProductById(productId) {
    throw new NotImplementedError(
      'BusinessDataGateway.getProductById',
      'T2 §Product Read By Id',
      { businessId: this.businessId, productId }
    );
  }

  /**
   * Read a persisted order (for status questions / receipts).
   * Contract: T6 §Order Read.
   * @param {string} orderId
   * @returns {Promise<DraftOrder|null>}
   */
  async getOrder(orderId) {
    throw new NotImplementedError(
      'BusinessDataGateway.getOrder',
      'T6 §Order Read',
      { businessId: this.businessId, orderId }
    );
  }
}

/**
 * Factory to keep call sites terse and to leave room for pooling/caching later
 * without changing the constructor signature everywhere.
 * @param {{ businessId: string, db?: *, apiClient?: * }} opts
 * @returns {BusinessDataGateway}
 */
export function createBusinessDataGateway(opts) {
  return new BusinessDataGateway(opts);
}

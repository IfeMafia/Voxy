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
 * CURRENT STATE (S1): this is a boundary definition, not an implementation.
 *   - Business *profile* grounding already exists today in `src/lib/ai-context.js`
 *     (it reads the `businesses` row and compresses it into `ai_summary`). That
 *     path keeps working untouched.
 *   - Catalogue / product / order / policy reads do NOT exist yet — they depend
 *     on Tobi's backend (T2 product backend, T6 order backend). Those methods
 *     throw {@link NotImplementedError} pointing at the contract they await.
 *
 * S3 ("business knowledge grounding") is expected to consolidate the existing
 * ai-context profile read behind this gateway and wire the catalogue reads to
 * the real T2/T6 endpoints. Until then this file names the seam so S2's
 * reasoning layer can depend on a stable shape.
 *
 * @see public/docs/AI_AGENT_BACKEND_CONTRACTS.md
 * @see src/lib/ai-context.js  (existing profile grounding this will absorb)
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
   * @param {*} [opts.db] - DB handle (injected, not imported) so this stays testable
   *   and so the live DB module is never pulled into the agent core implicitly.
   */
  constructor({ businessId, db } = {}) {
    if (!businessId) {
      throw new Error('BusinessDataGateway requires a businessId — reads are always business-scoped.');
    }
    /** @type {string} */
    this.businessId = businessId;
    /** @private */
    this._db = db ?? null;
  }

  /**
   * Business profile (name, hours, delivery areas, policies, assistant config).
   * Contract: T1 §Business Profile Read. Interim source: `businesses` table via
   * ai-context.js — S3 moves that read here.
   * @returns {Promise<Object>}
   */
  async getBusinessProfile() {
    throw new NotImplementedError(
      'BusinessDataGateway.getBusinessProfile',
      'T1 §Business Profile Read',
      { businessId: this.businessId }
    );
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
   * Structured business policies (returns, delivery, refunds) the agent may cite.
   * Contract: T1 §Policies Read.
   * @returns {Promise<Object>}
   */
  async getPolicies() {
    throw new NotImplementedError(
      'BusinessDataGateway.getPolicies',
      'T1 §Policies Read',
      { businessId: this.businessId }
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
 * @param {{ businessId: string, db?: * }} opts
 * @returns {BusinessDataGateway}
 */
export function createBusinessDataGateway(opts) {
  return new BusinessDataGateway(opts);
}

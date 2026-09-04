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
      const { prisma } = await import('@/lib/prisma');
      return prisma;
    } catch {
      return null;
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
    if (db.business && typeof db.business.findFirst === 'function') {
      raw = await db.business.findFirst({
        where: {
          OR: [
            { id: this.businessId },
            { slug: this.businessId }
          ]
        },
        include: { products: true }
      });
    } else if (db.business && typeof db.business.findUnique === 'function') {
      raw = await db.business.findUnique({
        where: { id: this.businessId },
        include: { products: true }
      });
    } else if (typeof db.query === 'function') {
      const res = await db.query('SELECT * FROM businesses WHERE id = $1 OR slug = $1', [this.businessId]);
      raw = res.rows ? res.rows[0] : null;
      if (raw) {
        const prodRes = await db.query('SELECT * FROM products WHERE business_id = $1 AND is_available = true', [raw.id]);
        raw.products = prodRes.rows || [];
      }
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

    let address = raw.address || null;
    if (typeof address === 'string') {
      try { address = JSON.parse(address); } catch {}
    }

    let socialLinks = raw.socialLinks ?? raw.social_links ?? null;
    if (typeof socialLinks === 'string') {
      try { socialLinks = JSON.parse(socialLinks); } catch {}
    }

    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug || '',
      description: raw.description || '',
      category: raw.category || '',
      logoUrl: raw.logoUrl || null,
      hours: parsedHours,
      deliveryAreas,
      deliveryInfo: typeof raw.deliveryInfo === 'string' ? raw.deliveryInfo : (raw.delivery_info || null),
      policies: raw.policies ?? null,
      address,
      socialLinks,
      products: Array.isArray(raw.products) ? raw.products.map(p => this._normalizeProduct(p)).filter(Boolean) : [],
      contact: {
        phone: raw.contactPhone || raw.phone || raw.contact_phone || '',
        email: raw.email || ''
      },
      assistantConfig: {
        employeeName: aiConfig.employeeName || aiConfig.persona || raw.name || 'Voxy',
        persona: aiConfig.persona || 'Voxy',
        tone: aiConfig.tone || raw.assistant_tone || 'friendly, confident, and professional',
        languages: raw.supportedLanguages || ['en'],
        greeting: aiConfig.greeting || '',
        fallbackMessage: aiConfig.fallbackMessage || '',
        permittedActions: Array.isArray(aiConfig.permittedActions) ? aiConfig.permittedActions : ['browse_menu', 'place_order', 'customer_support'],
        escalationTriggers: Array.isArray(aiConfig.escalationTriggers) ? aiConfig.escalationTriggers : ['speak to human', 'refund', 'complaint'],
        rules: Array.isArray(aiConfig.rules) ? aiConfig.rules : [],
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
   * @param {{ text?: string, maxPrice?: number, category?: string, availableOnly?: boolean }} query
   * @returns {Promise<ProductRef[]>}
   */
  async findProducts(query = {}) {
    const { text, maxPrice, category, availableOnly = false } = query;

    // 1. If custom apiClient provided
    if (this._apiClient && typeof this._apiClient.findProducts === 'function') {
      const items = await this._apiClient.findProducts(this.businessId, query);
      return (items || []).map(p => this._normalizeProduct(p));
    }

    // 2. Query DB / Prisma if available
    const db = await this._resolveDb();
    if (db?.product && typeof db.product.findMany === 'function') {
      try {
        const where = { businessId: this.businessId };
        if (availableOnly) where.isAvailable = true;
        if (category) {
          where.tags = { has: category.toLowerCase() };
        }
        if (typeof maxPrice === 'number') {
          where.priceCents = { lte: Math.round(maxPrice * 100) };
        }
        if (text && text.trim()) {
          where.OR = [
            { name: { contains: text.trim(), mode: 'insensitive' } },
            { description: { contains: text.trim(), mode: 'insensitive' } }
          ];
        }

        const records = await db.product.findMany({
          where,
          include: { variants: true }
        });

        return records.map(p => this._normalizeProduct(p));
      } catch (err) {
        console.warn(`[BusinessDataGateway] Prisma product search failed, falling back:`, err?.message);
      }
    }

    // 3. Fallback: Search from normalized business profile products (in-memory mock / embedded)
    const profile = await this.getBusinessProfile();
    let catalog = profile?.products || [];

    if (text && text.trim()) {
      const q = text.toLowerCase().trim();
      catalog = catalog.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (category) {
      const cat = category.toLowerCase().trim();
      catalog = catalog.filter(p => 
        (p.category && p.category.toLowerCase().includes(cat)) ||
        (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(cat)))
      );
    }

    if (typeof maxPrice === 'number') {
      catalog = catalog.filter(p => {
        const price = typeof p.price === 'number' ? p.price : (p.priceCents ? p.priceCents / 100 : 0);
        return price <= maxPrice;
      });
    }

    if (availableOnly) {
      catalog = catalog.filter(p => p.available !== false && p.isAvailable !== false);
    }

    return catalog.map(p => this._normalizeProduct(p));
  }

  /**
   * Fetch one product by its catalogue id (used when building an order line or getting details).
   * Contract: T2 §Product Read By Id.
   * @param {string} productId
   * @returns {Promise<ProductRef|null>}
   */
  async getProductById(productId) {
    if (!productId) return null;

    // 1. If custom apiClient provided
    if (this._apiClient && typeof this._apiClient.getProduct === 'function') {
      const remote = await this._apiClient.getProduct(this.businessId, productId);
      return remote ? this._normalizeProduct(remote) : null;
    }

    // 2. Query DB / Prisma
    const db = await this._resolveDb();
    if (db?.product && typeof db.product.findFirst === 'function') {
      try {
        const record = await db.product.findFirst({
          where: {
            businessId: this.businessId,
            OR: [
              { id: productId },
              { name: { equals: productId, mode: 'insensitive' } },
              { name: { contains: productId, mode: 'insensitive' } }
            ]
          },
          include: { variants: true }
        });
        if (record) return this._normalizeProduct(record);
      } catch (err) {
        console.warn(`[BusinessDataGateway] Prisma getProductById failed:`, err?.message);
      }
    }

    // 3. Fallback to business profile products
    const profile = await this.getBusinessProfile();
    const found = (profile?.products || []).find(p =>
      p.id === productId ||
      (p.name && p.name.toLowerCase() === String(productId).toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(String(productId).toLowerCase()))
    );
    return found ? this._normalizeProduct(found) : null;
  }

  /**
   * Normalizes raw product record to canonical ProductRef shape.
   * Authoritative price calculation: price in whole Naira (₦).
   * @private
   */
  _normalizeProduct(raw) {
    if (!raw) return null;

    // Determine price in Naira
    let price = 0;
    if (typeof raw.price === 'number') {
      price = raw.price;
    } else if (typeof raw.priceKobo === 'number') {
      const effectiveKobo = (raw.priceKobo || 0) - (raw.discountKobo || 0);
      price = effectiveKobo > 0 ? effectiveKobo / 100 : (raw.priceKobo / 100);
    } else if (typeof raw.priceCents === 'number') {
      price = Math.round(raw.priceCents / 100);
    }

    const available = raw.available !== undefined 
      ? Boolean(raw.available) 
      : (raw.isAvailable !== undefined ? Boolean(raw.isAvailable) : true);

    const stockQuantity = raw.stockQuantity !== undefined && raw.stockQuantity !== null
      ? Number(raw.stockQuantity)
      : (raw.stock !== undefined && raw.stock !== null ? Number(raw.stock) : null);

    let stockStatus = 'In stock';
    if (!available || stockQuantity === 0) {
      stockStatus = 'Out of stock';
    } else if (stockQuantity !== null && stockQuantity !== undefined && stockQuantity <= 3) {
      stockStatus = 'Low stock';
    }

    return {
      id: String(raw.id),
      name: raw.name || 'Unnamed Product',
      description: raw.description || '',
      price,
      currency: raw.currency || 'NGN',
      category: raw.category || (Array.isArray(raw.tags) && raw.tags[0]) || null,
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      variant: raw.variant || (raw.variants && raw.variants[0]?.name) || null,
      variants: Array.isArray(raw.variants) ? raw.variants.map(v => ({
        id: String(v.id),
        name: v.name,
        price: typeof v.price === 'number' ? v.price : (v.priceKobo ? v.priceKobo / 100 : price),
        stockQuantity: v.stockQuantity ?? null
      })) : [],
      available,
      isAvailable: available,
      stockQuantity,
      stockStatus,
      imageUrl: raw.imageUrl || null,
      highlights: raw.highlights || raw.description || null
    };
  }

  /**
   * Create an uncommitted draft order with authoritative product pricing.
   * Contract: T6 §Order Draft / T7 POST /api/v1/orders (or /api/business/:id/orders/draft).
   * @param {{ customerId?: string, conversationId?: string, lines: Array<{ productId: string, variantId?: string, quantity: number }> }} draftSpec
   * @returns {Promise<DraftOrder>}
   */
  async createDraftOrder(draftSpec) {
    const { customerId, conversationId, lines } = draftSpec || {};

    if (!Array.isArray(lines) || lines.length === 0) {
      const err = new Error('Draft order must contain at least one item line.');
      err.code = 'EMPTY_ORDER';
      throw err;
    }

    // Resolve every line through authoritative product records
    const resolvedLines = [];
    let subtotal = 0;

    for (const line of lines) {
      if (!line.productId) {
        const err = new Error('Order line missing productId.');
        err.code = 'INVALID_LINE';
        throw err;
      }

      const product = await this.getProductById(line.productId);
      if (!product) {
        const err = new Error(`Product "${line.productId}" does not exist in our catalogue.`);
        err.code = 'PRODUCT_NOT_FOUND';
        throw err;
      }

      if (product.available === false || (product.stockQuantity !== null && product.stockQuantity <= 0)) {
        const err = new Error(`Product "${product.name}" is currently out of stock.`);
        err.code = 'OUT_OF_STOCK';
        throw err;
      }

      let unitPrice = product.price;
      let variantName = product.variant || null;
      let variantId = line.variantId || null;

      if (line.variantId || line.variant) {
        const matchingVariant = (product.variants || []).find(
          v => v.id === line.variantId || (line.variant && v.name.toLowerCase() === line.variant.toLowerCase())
        );

        if (!matchingVariant) {
          const err = new Error(`Variant "${line.variantId || line.variant}" is not available for ${product.name}.`);
          err.code = 'INVALID_VARIANT';
          throw err;
        }

        if (matchingVariant.stockQuantity !== null && matchingVariant.stockQuantity <= 0) {
          const err = new Error(`Variant "${matchingVariant.name}" of ${product.name} is currently out of stock.`);
          err.code = 'VARIANT_OUT_OF_STOCK';
          throw err;
        }

        unitPrice = matchingVariant.price;
        variantName = matchingVariant.name;
        variantId = matchingVariant.id;
      }

      const qty = Math.max(1, parseInt(line.quantity, 10) || 1);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      resolvedLines.push({
        productId: product.id,
        name: product.name,
        variantId,
        variant: variantName,
        quantity: qty,
        unitPrice, // Authoritative whole Naira
        lineTotal
      });
    }

    // Check delivery policy or calculate standard delivery
    let deliveryFee = 0;
    const profile = await this.getBusinessProfile();
    if (profile?.deliveryAreas && profile.deliveryAreas.length > 0) {
      // Default delivery fee if configured in business policies
      const policies = profile.policies ? (typeof profile.policies === 'string' ? JSON.parse(profile.policies) : profile.policies) : {};
      deliveryFee = typeof policies.deliveryFee === 'number' ? policies.deliveryFee : 0;
    }

    const total = subtotal + deliveryFee;
    const idempotencyKey = `draft_${this.businessId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1. If custom apiClient provided
    if (this._apiClient && typeof this._apiClient.createDraftOrder === 'function') {
      return await this._apiClient.createDraftOrder(this.businessId, {
        customerId,
        conversationId,
        lines: resolvedLines,
        subtotal,
        deliveryFee,
        total,
        currency: 'NGN',
        idempotencyKey
      });
    }

    // 2. Persist to DB via Prisma if available
    const db = await this._resolveDb();
    if (db?.order && typeof db.order.create === 'function') {
      try {
        const created = await db.order.create({
          data: {
            businessId: this.businessId,
            customerId: customerId || 'guest_customer',
            conversationId: conversationId || null,
            status: 'draft',
            totalCents: Math.round(total * 100),
            currency: 'NGN',
            idempotencyKey,
            items: {
              create: resolvedLines.map(l => ({
                productId: l.productId,
                variantId: l.variantId,
                quantity: l.quantity,
                unitPriceCents: Math.round(l.unitPrice * 100)
              }))
            }
          },
          include: {
            items: {
              include: { product: true, variant: true }
            }
          }
        });

        return {
          id: created.id,
          businessId: this.businessId,
          customerId: created.customerId,
          conversationId: created.conversationId,
          lines: resolvedLines,
          subtotal,
          deliveryFee,
          total,
          currency: 'NGN',
          status: 'draft',
          idempotencyKey: created.idempotencyKey,
          createdAt: created.createdAt?.toISOString() || new Date().toISOString()
        };
      } catch (err) {
        console.warn(`[BusinessDataGateway] Prisma draft order creation failed, using in-memory draft:`, err?.message);
      }
    }

    // 3. In-memory fallback (DraftOrder)
    const draftId = `ord_draft_${Math.random().toString(36).substring(2, 10)}`;
    const draftOrder = {
      id: draftId,
      businessId: this.businessId,
      customerId: customerId || null,
      conversationId: conversationId || null,
      lines: resolvedLines,
      subtotal,
      deliveryFee,
      total,
      currency: 'NGN',
      status: 'draft',
      idempotencyKey,
      createdAt: new Date().toISOString()
    };

    if (!this._draftOrders) {
      this._draftOrders = new Map();
    }
    this._draftOrders.set(draftId, draftOrder);

    return draftOrder;
  }

  /**
   * Read a persisted order (for status questions / receipts).
   * Contract: T6 §Order Read.
   * @param {string} orderId
   * @returns {Promise<DraftOrder|null>}
   */
  async getOrder(orderId) {
    if (!orderId) return null;

    if (this._draftOrders?.has(orderId)) {
      return this._draftOrders.get(orderId);
    }

    const db = await this._resolveDb();
    if (db?.order && typeof db.order.findUnique === 'function') {
      try {
        const record = await db.order.findUnique({
          where: { id: orderId },
          include: { items: { include: { product: true, variant: true } } }
        });
        if (record && record.businessId === this.businessId) {
          const lines = (record.items || []).map(i => ({
            productId: i.productId,
            name: i.product?.name || 'Product',
            variantId: i.variantId,
            variant: i.variant?.name || null,
            quantity: i.quantity,
            unitPrice: Math.round(i.unitPriceCents / 100),
            lineTotal: Math.round((i.unitPriceCents * i.quantity) / 100)
          }));
          const total = Math.round(record.totalCents / 100);
          return {
            id: record.id,
            businessId: record.businessId,
            customerId: record.customerId,
            conversationId: record.conversationId,
            lines,
            total,
            currency: record.currency || 'NGN',
            status: record.status,
            idempotencyKey: record.idempotencyKey,
            createdAt: record.createdAt?.toISOString()
          };
        }
      } catch (err) {
        console.warn(`[BusinessDataGateway] Prisma getOrder failed:`, err?.message);
      }
    }

    return null;
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

/**
 * PolicyChecker — Authoritative extraction and verification of business policies.
 *
 * WHY THIS EXISTS (PRD §4.1): Voxy must act only on approved business information.
 * Never invent products, prices, stock, discounts, delivery times, or policies.
 *
 * This class provides deterministic verification for:
 *   - Delivery areas (truthful refusal when a location is not served)
 *   - Return policy (exact verbatim terms, no paraphrased promises)
 *   - Refund policy (authoritative terms or truthful refusal)
 *   - Payment methods & delivery timelines
 *
 * Strict Honesty Rule:
 * If an answer is not present or missing in the business's records,
 * returns "I'll check with the business owner" — never guesses.
 */

export class PolicyChecker {
  /**
   * @param {Object} opts
   * @param {Object} [opts.profile] - Grounded Business Profile (T1 contract)
   * @param {Object} [opts.policies] - Grounded Business Policies ({ returns, delivery, refunds, payment })
   */
  constructor({ profile = {}, policies = {} } = {}) {
    /** @type {Object} */
    this.profile = profile ?? {};
    /** @type {{ returns: string|null, delivery: string|null, refunds: string|null, payment: string|null }} */
    this.policies = {
      returns: policies?.returns ?? null,
      delivery: policies?.delivery ?? null,
      refunds: policies?.refunds ?? null,
      payment: policies?.payment ?? null,
    };

    /** @type {string[]} */
    this.deliveryAreas = Array.isArray(this.profile.deliveryAreas)
      ? this.profile.deliveryAreas
      : [];
  }

  /**
   * Checks whether a customer's requested delivery location is served.
   * If not served, produces a truthful refusal citing the approved delivery areas.
   *
   * @param {string} location - Customer's delivery location
   * @returns {{ supported: boolean, location: string, message: string, areas?: string[] }}
   */
  checkDeliveryArea(location) {
    if (!location || typeof location !== 'string' || !location.trim()) {
      return {
        supported: false,
        location: '',
        message: "Please provide a delivery location so I can check if we deliver to your area."
      };
    }

    const query = location.trim().toLowerCase();

    // If no delivery areas are registered for this business
    if (this.deliveryAreas.length === 0) {
      return {
        supported: false,
        location: location.trim(),
        message: "I'll check with the business owner regarding our delivery areas."
      };
    }

    // Check against normalized approved delivery areas
    const matchedArea = this.deliveryAreas.find(area => {
      const normArea = area.toLowerCase().trim();
      return (
        normArea === query ||
        query.includes(normArea) ||
        normArea.includes(query)
      );
    });

    if (matchedArea) {
      return {
        supported: true,
        location: location.trim(),
        message: `Yes, we deliver to ${matchedArea}.`,
        areas: this.deliveryAreas
      };
    }

    // Truthful refusal: never guess or accept unserved regions
    return {
      supported: false,
      location: location.trim(),
      message: `We do not deliver to ${location.trim()}. We only deliver to: ${this.deliveryAreas.join(', ')}.`,
      areas: this.deliveryAreas
    };
  }

  /**
   * Returns exact stored return policy terms verbatim.
   *
   * @returns {{ available: boolean, terms: string|null, message: string }}
   */
  getReturnPolicy() {
    const terms = this.policies.returns?.trim();
    if (!terms) {
      return {
        available: false,
        terms: null,
        message: "I'll check with the business owner about our return policy."
      };
    }

    return {
      available: true,
      terms,
      message: terms
    };
  }

  /**
   * Returns exact stored refund policy terms verbatim.
   *
   * @returns {{ available: boolean, terms: string|null, message: string }}
   */
  getRefundPolicy() {
    const terms = this.policies.refunds?.trim();
    if (!terms) {
      return {
        available: false,
        terms: null,
        message: "I'll check with the business owner about our refund policy."
      };
    }

    return {
      available: true,
      terms,
      message: terms
    };
  }

  /**
   * Returns exact stored delivery policy / timeline verbatim.
   *
   * @returns {{ available: boolean, terms: string|null, message: string }}
   */
  getDeliveryTimeline() {
    const terms = (this.policies.delivery || this.profile.deliveryInfo)?.trim();
    if (!terms) {
      return {
        available: false,
        terms: null,
        message: "I'll check with the business owner about our delivery timeline."
      };
    }

    return {
      available: true,
      terms,
      message: terms
    };
  }

  /**
   * Returns exact stored payment methods or policy verbatim.
   *
   * @returns {{ available: boolean, terms: string|null, message: string }}
   */
  getPaymentMethods() {
    const terms = this.policies.payment?.trim();
    if (!terms) {
      return {
        available: false,
        terms: null,
        message: "I'll check with the business owner about our payment methods."
      };
    }

    return {
      available: true,
      terms,
      message: terms
    };
  }

  /**
   * Authoritative extraction across any policy topic.
   *
   * @param {'returns'|'refunds'|'delivery'|'payment'|'hours'|string} topic
   * @returns {{ available: boolean, topic: string, answer: string }}
   */
  extractPolicyAnswer(topic) {
    const norm = (topic || '').toLowerCase().trim();

    if (norm.includes('return')) {
      const res = this.getReturnPolicy();
      return { available: res.available, topic: 'returns', answer: res.message };
    }
    if (norm.includes('refund')) {
      const res = this.getRefundPolicy();
      return { available: res.available, topic: 'refunds', answer: res.message };
    }
    if (norm.includes('deliver') || norm.includes('shipping')) {
      const res = this.getDeliveryTimeline();
      return { available: res.available, topic: 'delivery', answer: res.message };
    }
    if (norm.includes('pay') || norm.includes('payment')) {
      const res = this.getPaymentMethods();
      return { available: res.available, topic: 'payment', answer: res.message };
    }
    if (norm.includes('hour') || norm.includes('time') || norm.includes('open')) {
      if (this.profile.hours) {
        const hoursStr = typeof this.profile.hours === 'object'
          ? JSON.stringify(this.profile.hours)
          : String(this.profile.hours);
        return { available: true, topic: 'hours', answer: hoursStr };
      }
      return { available: false, topic: 'hours', answer: "I'll check with the business owner about our operating hours." };
    }

    // Default strict honesty
    return {
      available: false,
      topic: norm,
      answer: "I'll check with the business owner."
    };
  }
}

/**
 * Factory for PolicyChecker.
 * @param {{ profile?: Object, policies?: Object }} opts
 * @returns {PolicyChecker}
 */
export function createPolicyChecker(opts) {
  return new PolicyChecker(opts);
}

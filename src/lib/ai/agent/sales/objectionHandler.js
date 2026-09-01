/**
 * S5: Objection Handler & Boundary Enforcement (AI-105).
 *
 * Implements graceful objection handling per PRD §6.4 & §4.1:
 * - Price concerns: Emphasize value/quality or suggest a real budget-friendly alternative from catalog.
 *   CRITICAL RULE: NEVER hallucinate unauthorized discounts, price cuts, or promo codes.
 * - Delivery time concerns: Cite approved delivery timelines and policy truthfully without false promises.
 * - Sizing/Fit concerns: Reference size guides and official return/exchange window.
 * - Authenticity/Trust: Reassure with genuine warranty or official store origin.
 */

export const ObjectionType = {
  PRICE: 'price',
  DELIVERY_TIME: 'delivery_time',
  DELIVERY_COST: 'delivery_cost',
  SIZING_OR_FIT: 'sizing_or_fit',
  TRUST_OR_AUTHENTICITY: 'trust_or_authenticity',
  GENERAL: 'general'
};

export class ObjectionHandler {
  /**
   * Detects if the customer's message contains an objection.
   *
   * @param {string} message
   * @returns {{ hasObjection: boolean, type: string | null }}
   */
  static detectObjection(message) {
    if (!message || typeof message !== 'string') {
      return { hasObjection: false, type: null };
    }

    const lower = message.toLowerCase();

    // 1. Price objections
    const pricePatterns = [
      /\btoo expensive\b/,
      /\btoo high\b/,
      /\bcostly\b/,
      /\bprice is high\b/,
      /\bany discount\b/,
      /\bcan you reduce\b/,
      /\bcut price\b/,
      /\bcheaper (?:one|option|version|alternative)?\b/,
      /\bcan('?t| not) afford\b/,
      /\bbeyond my budget\b/,
      /\bover my budget\b/,
      /\bexpensive o\b/,
      /\be cost die\b/,
      /\bbeg reduce\b/,
      /\blast price\b/
    ];
    if (pricePatterns.some(p => p.test(lower))) {
      return { hasObjection: true, type: ObjectionType.PRICE };
    }

    // 2. Delivery time objections
    const deliveryTimePatterns = [
      /\btoo long\b/,
      /\btakes too long\b/,
      /\bneed it urgent(?:ly)?\b/,
      /\bneed it today\b/,
      /\bwhy 2 days\b/,
      /\bwhy (\d+) days\b/,
      /\bcan you deliver right now\b/,
      /\btoo slow\b/
    ];
    if (deliveryTimePatterns.some(p => p.test(lower))) {
      return { hasObjection: true, type: ObjectionType.DELIVERY_TIME };
    }

    // 3. Delivery cost objections
    const deliveryCostPatterns = [
      /\bdelivery is expensive\b/,
      /\bshipping is high\b/,
      /\bfree delivery\b/,
      /\bwaive delivery\b/
    ];
    if (deliveryCostPatterns.some(p => p.test(lower))) {
      return { hasObjection: true, type: ObjectionType.DELIVERY_COST };
    }

    // 4. Sizing / Fit / Color objections
    const sizingPatterns = [
      /\bwhat if (?:the )?size is wrong\b/,
      /\bwhat if it doesn'?t fit\b/,
      /\bnot sure of my size\b/,
      /\bwrong size\b/,
      /\bwill it fit\b/,
      /\bdoes not fit\b/,
      /\bdoesn'?t fit\b/
    ];
    if (sizingPatterns.some(p => p.test(lower))) {
      return { hasObjection: true, type: ObjectionType.SIZING_OR_FIT };
    }

    // 5. Trust / Authenticity
    const trustPatterns = [
      /\bis it original\b/,
      /\bis this fake\b/,
      /\bhow am i sure\b/,
      /\bhope you are not scam\b/,
      /\bis it authentic\b/,
      /\bcan i trust you\b/
    ];
    if (trustPatterns.some(p => p.test(lower))) {
      return { hasObjection: true, type: ObjectionType.TRUST_OR_AUTHENTICITY };
    }

    return { hasObjection: false, type: null };
  }

  /**
   * Generates a grounded, policy-compliant response to customer objections.
   * Strictly avoids hallucinating discounts or unverified promises.
   *
   * @param {Object} params
   * @param {string} params.objectionType
   * @param {string} params.customerMessage
   * @param {Object} [params.currentProduct]
   * @param {Array<Object>} [params.catalog=[]]
   * @param {Object} [params.policies={}]
   * @param {string} [params.businessName='we']
   * @returns {{ handled: boolean, response: string, suggestedAlternative: Object | null }}
   */
  static handleObjection({
    objectionType,
    customerMessage,
    currentProduct = null,
    catalog = [],
    policies = {},
    businessName = 'our store'
  }) {
    switch (objectionType) {
      case ObjectionType.PRICE: {
        // Look for an actual budget-friendly alternative in the catalog
        let budgetAlternative = null;
        if (currentProduct && catalog.length > 0) {
          budgetAlternative = catalog.find(item => {
            if (item.id === currentProduct.id) return false;
            const sameCategory = (item.category && currentProduct.category && item.category === currentProduct.category) ||
              (item.name && currentProduct.name && item.name.split(' ')[0] === currentProduct.name.split(' ')[0]);
            return sameCategory && item.price && item.price < currentProduct.price;
          });
        }

        if (budgetAlternative) {
          const altPrice = `₦${Number(budgetAlternative.price).toLocaleString()}`;
          return {
            handled: true,
            suggestedAlternative: budgetAlternative,
            response: `I understand your budget consideration! Our prices are fixed to ensure consistent genuine quality. However, if you would prefer a more budget-friendly option, we have the ${budgetAlternative.name} at ${altPrice}, which offers great performance at a lower price point. Would you like details on that?`
          };
        }

        // Standard non-discounting value defense
        const prodName = currentProduct?.name || 'our products';
        return {
          handled: true,
          suggestedAlternative: null,
          response: `I completely understand that price is an important factor. All our prices for ${prodName} are set strictly according to official business pricing to guarantee original quality and warranty. If you have a specific target budget in mind, what amount are you aiming for?`
        };
      }

      case ObjectionType.DELIVERY_TIME: {
        const deliveryPolicy = policies.delivery || 'our standard delivery window is 24 to 48 hours within covered areas';
        return {
          handled: true,
          suggestedAlternative: null,
          response: `We take reliable delivery very seriously! According to our store policy, ${deliveryPolicy}. We cannot make unverified rush promises, but we dispatch orders promptly once payment is confirmed. Would that timeline work for you?`
        };
      }

      case ObjectionType.DELIVERY_COST: {
        const deliveryPolicy = policies.delivery || 'delivery rates are calculated based on location';
        return {
          handled: true,
          suggestedAlternative: null,
          response: `We keep our delivery rates transparent and strictly at standard dispatch cost (${deliveryPolicy}). We do not have authorization to waive delivery fees, but we ensure safe, direct dispatch to your doorstep. Would you like to proceed with your delivery details?`
        };
      }

      case ObjectionType.SIZING_OR_FIT: {
        const returnPolicy = policies.returns || 'items in original condition are eligible for exchange under our return policy';
        return {
          handled: true,
          suggestedAlternative: null,
          response: `We want to be certain you get the right fit! ${returnPolicy}. To help you get the exact size right away, could you tell me your usual size or measurements?`
        };
      }

      case ObjectionType.TRUST_OR_AUTHENTICITY: {
        return {
          handled: true,
          suggestedAlternative: null,
          response: `You can rest assured! At ${businessName}, we only sell 100% genuine, authentic items sourced directly and verified before dispatch. Every transaction is confirmed and recorded with a full receipt. What questions can I answer about the product for you?`
        };
      }

      default:
        return {
          handled: false,
          suggestedAlternative: null,
          response: "I hear you, and I want to make sure you get the best experience possible. What specific details would help you decide?"
        };
    }
  }
}

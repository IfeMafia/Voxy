/**
 * S5: Sales Employee Behavior Playbook (AI-105).
 *
 * Implements top-tier sales employee behavior per PRD §6.4:
 * 1. Consultative Need Discovery: Ask 1 targeted question at a time (budget, size, preferences).
 * 2. Value Articulation: Emphasize business-approved selling points and quality rather than just listing specs.
 * 3. Non-pushy Upselling & Cross-selling: Suggest 1 relevant complementary item after interest is established.
 * 4. Respect Business Boundaries: Never invent unauthorized discounts or make false promises.
 */

export const DiscoveryDimension = {
  CATEGORY: 'category',
  BUDGET: 'budget',
  SIZE_OR_VARIANT: 'size_or_variant',
  DELIVERY_LOCATION: 'delivery_location',
  PREFERENCE: 'preference'
};

export class SalesPlaybook {
  /**
   * Identifies the single most relevant missing dimension to discover from customer.
   * Enforces PRD §6.4: Ask ONE targeted question at a time.
   *
   * @param {import('../types.js').CustomerSessionContext} context
   * @param {Object} [options]
   * @param {string} [options.preferredCategory]
   * @returns {{ dimension: string, question: string } | null}
   */
  static determineDiscoveryQuestion(context = {}, options = {}) {
    // 1. If we don't know what they are looking for at all:
    if (!context.preferredCategory && !options.preferredCategory && (!context.interestedProducts || context.interestedProducts.length === 0)) {
      return {
        dimension: DiscoveryDimension.CATEGORY,
        question: "What type of product or item are you looking for today?"
      };
    }

    const category = context.preferredCategory || options.preferredCategory || 'item';

    // 2. If category is known, but budget is not known:
    if (!context.budget) {
      return {
        dimension: DiscoveryDimension.BUDGET,
        question: `What budget range are you working with for your ${category}?`
      };
    }

    // 3. If category is clothing/shoes/gadget and size or variant is not specified:
    const requiresVariant = ['phone', 'laptop', 'shoe', 'dress', 'cake', 'gadget'].some(c => 
      category.toLowerCase().includes(c)
    );
    if (requiresVariant && !context.variant && (!context.interestedProducts || context.interestedProducts.length <= 1)) {
      if (category.toLowerCase().includes('cake')) {
        return {
          dimension: DiscoveryDimension.SIZE_OR_VARIANT,
          question: "What size or flavor of cake would you prefer (e.g., 8-inch, 10-inch, Vanilla, or Red Velvet)?"
        };
      }
      if (category.toLowerCase().includes('shoe') || category.toLowerCase().includes('dress')) {
        return {
          dimension: DiscoveryDimension.SIZE_OR_VARIANT,
          question: "What size or color would suit you best?"
        };
      }
      if (category.toLowerCase().includes('phone') || category.toLowerCase().includes('gadget')) {
        return {
          dimension: DiscoveryDimension.SIZE_OR_VARIANT,
          question: "Do you have a preferred storage capacity or color in mind?"
        };
      }
    }

    // 4. Delivery location if not yet stated
    if (!context.deliveryLocation) {
      return {
        dimension: DiscoveryDimension.DELIVERY_LOCATION,
        question: "Where should we deliver this to once you're ready?"
      };
    }

    return null;
  }

  /**
   * Articulates product value based on business-approved highlights rather than dry specs.
   *
   * @param {Object} product
   * @param {string} product.name
   * @param {number} product.price
   * @param {string} [product.description]
   * @param {string[]} [product.features]
   * @param {string} [product.benefit]
   * @returns {string}
   */
  static articulateValue(product) {
    if (!product || !product.name) return '';

    const priceText = product.price ? ` priced at ₦${Number(product.price).toLocaleString()}` : '';
    const benefit = product.benefit || product.highlights || (product.features && product.features[0]);

    if (benefit) {
      return `Our ${product.name}${priceText} is highly recommended because ${benefit}. It gives you dependable quality that lasts.`;
    }

    if (product.description) {
      return `The ${product.name}${priceText} is designed for exceptional quality: ${product.description}.`;
    }

    return `The ${product.name}${priceText} is crafted to give you great durability and value.`;
  }

  /**
   * Suggests 1 complementary add-on item without being pushy.
   * Enforces PRD §6.4: Only suggest after primary interest is established.
   *
   * @param {Object} primaryProduct
   * @param {Array<Object>} availableCatalog
   * @returns {{ suggestedProduct: Object, pitch: string } | null}
   */
  static suggestAddOn(primaryProduct, availableCatalog = []) {
    if (!primaryProduct || !availableCatalog || availableCatalog.length === 0) {
      return null;
    }

    const primaryName = (primaryProduct.name || '').toLowerCase();
    const primaryCategory = (primaryProduct.category || '').toLowerCase();

    // Find complementary pairings
    const complementaryMap = {
      phone: ['case', 'screen protector', 'charger', 'airpods', 'earphones', 'pouch'],
      laptop: ['bag', 'mouse', 'sleeve', 'stand', 'keyboard'],
      cake: ['topper', 'candles', 'sparkler', 'card', 'cupcakes'],
      shoe: ['socks', 'polish', 'cleaner', 'insole'],
      dress: ['belt', 'scarf', 'bag', 'earrings']
    };

    let targetKeywords = [];
    for (const [cat, keywords] of Object.entries(complementaryMap)) {
      if (primaryName.includes(cat) || primaryCategory.includes(cat)) {
        targetKeywords = keywords;
        break;
      }
    }

    if (targetKeywords.length === 0) {
      // General accessory fallback
      targetKeywords = ['case', 'cable', 'topper', 'accessory'];
    }

    // Search catalog for a matching add-on that is cheaper than the main product
    const candidate = availableCatalog.find(item => {
      if (!item || item.id === primaryProduct.id) return false;
      const itemName = (item.name || '').toLowerCase();
      const matchesKeyword = targetKeywords.some(kw => itemName.includes(kw));
      const isCheaper = !primaryProduct.price || (item.price && item.price <= primaryProduct.price * 0.4);
      return matchesKeyword && isCheaper;
    });

    if (!candidate) return null;

    const priceText = candidate.price ? ` for ₦${Number(candidate.price).toLocaleString()}` : '';
    const pitch = `To go with your ${primaryProduct.name}, many customers also add our ${candidate.name}${priceText} to keep it protected and complete. Would you like to include that as well?`;

    return {
      suggestedProduct: candidate,
      pitch
    };
  }

  /**
   * Validates that an agent's response follows the 1-question rule.
   * Returns false if more than 1 question mark is present in a single turn.
   *
   * @param {string} text
   * @returns {boolean}
   */
  static adheresToSingleQuestionRule(text) {
    if (!text || typeof text !== 'string') return true;
    const questionMarks = (text.match(/\?/g) || []).length;
    return questionMarks <= 1;
  }
}

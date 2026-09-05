/**
 * S7: Order State Manager (AI-107).
 *
 * Tracks, extracts, and manages order draft lifecycles during customer conversations.
 * - Extracts requested items, variants (e.g. Size L, Space Black), and quantities.
 * - Manages active draft state across multi-turn conversation sessions.
 * - Prepares structured draft orders for frontend confirmation cards (A9).
 */

export class OrderStateManager {
  /**
   * @param {Object} options
   * @param {string} options.businessId
   * @param {import('../businessData.js').BusinessDataGateway} options.gateway
   */
  constructor({ businessId, gateway }) {
    this.businessId = businessId;
    this.gateway = gateway;
  }

  /**
   * Extract potential order line items from a customer message.
   * Recognizes:
   *  - "I want 2 iPhone 13 Pro" -> quantity: 2, name/text: "iPhone 13 Pro"
   *  - "Buy 1 MacBook Space Black" -> quantity: 1, name/text: "MacBook", variant: "Space Black"
   *  - "Order 3 red velvet cakes in size Large" -> quantity: 3, name/text: "red velvet cake", variant: "Large"
   *
   * @param {string} text
   * @param {Array<Object>} [availableProducts=[]]
   * @returns {Array<{ productId?: string, name: string, quantity: number, variant?: string }>}
   */
  extractOrderCandidates(text, availableProducts = []) {
    if (!text || typeof text !== 'string') return [];

    const candidates = [];
    const normalized = text.toLowerCase();

    // 1. Check against known products if provided
    for (const prod of availableProducts) {
      const prodNameLower = prod.name.toLowerCase();
      // Also match base name (e.g., "MacBook Pro 14\" M3" -> "MacBook Pro" or "MacBook")
      const baseName = prodNameLower.split(/[\d"']/)[0].trim();
      const matchesProduct = normalized.includes(prodNameLower) || (baseName.length > 3 && normalized.includes(baseName));

      if (matchesProduct) {
        // Extract quantity preceding or following product name
        const matchToken = normalized.includes(prodNameLower) ? prodNameLower : baseName;
        const qtyRegex = new RegExp(`(?:(\\d+)\\s*(?:pieces?|pcs?|units?|of)?\\s*)?${this._escapeRegExp(matchToken)}|${this._escapeRegExp(matchToken)}\\s*(?:x\\s*(\\d+)|(\\d+))?`, 'i');
        const match = text.match(qtyRegex);
        let quantity = 1;
        if (match) {
          const matchedQty = match[1] || match[2] || match[3];
          if (matchedQty) {
            quantity = parseInt(matchedQty, 10) || 1;
          }
        }

        // Check for variants in product
        let detectedVariant = null;
        if (Array.isArray(prod.variants)) {
          for (const v of prod.variants) {
            if (normalized.includes(v.name.toLowerCase())) {
              detectedVariant = v.name;
              break;
            }
          }
        }

        // Check common variant patterns like "size M", "color red"
        if (!detectedVariant) {
          const varMatch = text.match(/\b(?:size|color|colour|in)\s+([A-Za-z0-9\s]+?)(?=[,\.]|$|\band\b)/i);
          if (varMatch) {
            detectedVariant = varMatch[1].trim();
          }
        }

        candidates.push({
          productId: prod.id,
          name: prod.name,
          quantity,
          variant: detectedVariant || prod.variant || null
        });
      }
    }

    // 2. Generic fallback if no catalog product matched directly
    if (candidates.length === 0) {
      const genericMatch = text.match(/(?:order|buy|get|purchase|want|take)\s+(?:(\d+)\s+)?([a-zA-Z0-9\s"'-]+?)(?=[,\.]|$|\bwith\b|\bfor\b)/i);
      if (genericMatch) {
        const qty = genericMatch[1] ? parseInt(genericMatch[1], 10) : 1;
        const itemName = genericMatch[2].trim();
        if (itemName.length > 2 && !['it', 'this', 'that', 'them'].includes(itemName.toLowerCase())) {
          candidates.push({
            name: itemName,
            quantity: qty,
            variant: null
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Format a draft order for customer review and frontend confirmation card (A9).
   *
   * @param {import('../types.js').DraftOrder} draftOrder
   * @returns {Object} Structured draft card payload
   */
  formatConfirmationCard(draftOrder) {
    if (!draftOrder) return null;

    const formattedLines = (draftOrder.lines || []).map(line => ({
      productId: line.productId,
      name: line.name,
      variant: line.variant || null,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      formattedUnitPrice: `₦${Number(line.unitPrice).toLocaleString()}`,
      lineTotal: line.lineTotal,
      formattedLineTotal: `₦${Number(line.lineTotal).toLocaleString()}`
    }));

    const subtotal = draftOrder.subtotal ?? draftOrder.lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const deliveryFee = draftOrder.deliveryFee || 0;
    const total = draftOrder.total;

    return {
      type: 'draft_order_card',
      orderId: draftOrder.id,
      status: 'draft',
      requiresConfirmation: true,
      summary: {
        itemCount: draftOrder.lines.reduce((acc, l) => acc + l.quantity, 0),
        subtotal,
        formattedSubtotal: `₦${Number(subtotal).toLocaleString()}`,
        deliveryFee,
        formattedDeliveryFee: deliveryFee > 0 ? `₦${Number(deliveryFee).toLocaleString()}` : 'Free',
        total,
        formattedTotal: `₦${Number(total).toLocaleString()}`,
        currency: draftOrder.currency || 'NGN'
      },
      lines: formattedLines,
      actions: [
        { label: 'Confirm & Pay', action: 'confirm_order', orderId: draftOrder.id, primary: true },
        { label: 'Modify Order', action: 'modify_order', orderId: draftOrder.id, primary: false }
      ]
    };
  }

  /**
   * Generate conversational summary for Voxy to read out to customer.
   * Restates items, quantity, prices, and explicit confirmation request (PRD Rule #2).
   *
   * @param {import('../types.js').DraftOrder} draftOrder
   * @returns {string}
   */
  generateConfirmationPrompt(draftOrder) {
    if (!draftOrder || !draftOrder.lines?.length) return '';

    const linesText = draftOrder.lines.map(l => {
      const variantStr = l.variant ? ` (${l.variant})` : '';
      return `${l.quantity}x ${l.name}${variantStr} at ₦${Number(l.unitPrice).toLocaleString()}`;
    }).join(', ');

    const totalText = `₦${Number(draftOrder.total).toLocaleString()}`;
    return `I've prepared your order for ${linesText}. The total is ${totalText}. Would you like to confirm and proceed to payment?`;
  }

  _escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

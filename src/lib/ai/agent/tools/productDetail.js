/**
 * S6: product_detail tool (AI-106).
 *
 * Fetch specific product specifications, variants, and stock availability.
 * Strictly adheres to PRD §4.1:
 * - Authoritative record retrieval via BusinessDataGateway.getProductById.
 * - Explicitly surfaces availability and stock status.
 * - Handles out-of-stock items honestly, offering available variants or in-stock alternatives.
 */

import { ToolName, ToolPermission } from '../types.js';

/** @type {import('../types.js').ToolDefinition} */
export const productDetailTool = {
  name: ToolName.PRODUCT_DETAIL,
  description:
    'Retrieve full specifications, pricing, variants, and stock availability for a specific product by ID or exact name. ' +
    'Surfaces real stock levels. If an item is out of stock, honestly indicates it is unavailable.',
  permission: ToolPermission.READ_CATALOGUE,
  parameters: [
    { name: 'productId', type: 'string', required: false, description: 'Unique product catalogue ID.' },
    { name: 'name', type: 'string', required: false, description: 'Exact product name if ID is unknown.' }
  ],

  /**
   * @param {{ productId?: string, name?: string }} args
   * @param {import('../types.js').AgentContext} context
   * @returns {Promise<import('../types.js').ToolResult>}
   */
  async execute(args = {}, context) {
    const startTime = Date.now();
    if (!context?.data) {
      return {
        ok: false,
        toolName: ToolName.PRODUCT_DETAIL,
        error: 'Agent context missing BusinessDataGateway (context.data).',
        code: 'MISSING_GATEWAY'
      };
    }

    const { productId, name } = args;
    if (!productId && !name) {
      return {
        ok: false,
        toolName: ToolName.PRODUCT_DETAIL,
        error: 'Either productId or name must be provided to inspect product details.',
        code: 'INVALID_ARGS'
      };
    }

    try {
      let product = null;

      if (productId) {
        product = await context.data.getProductById(productId);
      }

      // Fallback search by name if not found by ID or ID not given
      if (!product && name) {
        const matches = await context.data.findProducts({ text: name });
        product = matches.find(p => p.name.toLowerCase() === name.toLowerCase()) || matches[0] || null;
      }

      if (!product) {
        return {
          ok: true,
          toolName: ToolName.PRODUCT_DETAIL,
          data: {
            found: false,
            product: null,
            message: `No product matching "${productId || name}" was found in our catalogue.`
          }
        };
      }

      // If out of stock, also look up in-stock alternatives in the same category
      let inStockAlternatives = [];
      if (!product.available || (product.stockQuantity !== null && product.stockQuantity <= 0)) {
        const categoryMatches = await context.data.findProducts({
          category: product.category,
          availableOnly: true
        });
        inStockAlternatives = categoryMatches
          .filter(p => p.id !== product.id)
          .slice(0, 2)
          .map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            formattedPrice: `₦${Number(p.price).toLocaleString()}`
          }));
      }

      return {
        ok: true,
        toolName: ToolName.PRODUCT_DETAIL,
        data: {
          found: true,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            formattedPrice: `₦${Number(product.price).toLocaleString()}`,
            category: product.category,
            available: product.available,
            stockQuantity: product.stockQuantity,
            isOutOfStock: !product.available || (product.stockQuantity !== null && product.stockQuantity <= 0),
            variant: product.variant,
            variants: product.variants || [],
            imageUrl: product.imageUrl,
            highlights: product.highlights
          },
          inStockAlternatives,
          latencyMs: Date.now() - startTime
        }
      };
    } catch (err) {
      return {
        ok: false,
        toolName: ToolName.PRODUCT_DETAIL,
        error: err.message || 'Failed to fetch product details',
        code: err.code || 'DETAIL_FAILED'
      };
    }
  }
};

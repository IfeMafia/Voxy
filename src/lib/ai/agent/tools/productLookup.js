/**
 * S6: product_lookup tool (AI-106).
 *
 * Search the business's real product catalogue by text, category, or price ceiling.
 * Strictly adheres to PRD §4.1:
 * - Queries through BusinessDataGateway (T2 §Product Catalogue Query).
 * - Only surfaces real, database-backed products.
 * - An empty list means no match — never invent products.
 * - Includes structured metadata for frontend card rendering (A8).
 */

import { ToolName, ToolPermission } from '../types.js';

/** @type {import('../types.js').ToolDefinition} */
export const productLookupTool = {
  name: ToolName.PRODUCT_LOOKUP,
  description:
    'Search the business\'s real product catalogue by text, price ceiling, or category. ' +
    'Use before quoting any product, price, or availability. Returns only approved products; ' +
    'an empty list means there is no match — say so honestly, never invent one.',
  permission: ToolPermission.READ_CATALOGUE,
  parameters: [
    { name: 'text', type: 'string', required: false, description: 'Free-text search (product name or keywords).' },
    { name: 'maxPrice', type: 'number', required: false, description: 'Price ceiling in Nigerian Naira (₦).' },
    { name: 'category', type: 'string', required: false, description: 'Product category or tag.' },
    { name: 'availableOnly', type: 'boolean', required: false, description: 'Filter only items currently in stock.' }
  ],

  /**
   * @param {{ text?: string, maxPrice?: number, category?: string, availableOnly?: boolean }} args
   * @param {import('../types.js').AgentContext} context
   * @returns {Promise<import('../types.js').ToolResult>}
   */
  async execute(args = {}, context) {
    const startTime = Date.now();
    if (!context?.data) {
      return {
        ok: false,
        toolName: ToolName.PRODUCT_LOOKUP,
        error: 'Agent context missing BusinessDataGateway (context.data).',
        code: 'MISSING_GATEWAY'
      };
    }

    try {
      const products = await context.data.findProducts({
        text: args.text,
        maxPrice: args.maxPrice,
        category: args.category,
        availableOnly: args.availableOnly
      });

      // Prepare UI-ready structured metadata for frontend cards (A8)
      const formattedItems = products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        formattedPrice: `₦${Number(p.price).toLocaleString()}`,
        available: p.available,
        stockQuantity: p.stockQuantity,
        variant: p.variant,
        imageUrl: p.imageUrl,
        highlights: p.highlights || p.description
      }));

      return {
        ok: true,
        toolName: ToolName.PRODUCT_LOOKUP,
        data: {
          items: formattedItems,
          count: formattedItems.length,
          query: args,
          hasMatches: formattedItems.length > 0,
          latencyMs: Date.now() - startTime
        }
      };
    } catch (err) {
      return {
        ok: false,
        toolName: ToolName.PRODUCT_LOOKUP,
        error: err.message || 'Failed to search product catalogue',
        code: err.code || 'LOOKUP_FAILED'
      };
    }
  }
};

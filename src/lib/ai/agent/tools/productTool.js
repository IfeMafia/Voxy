/**
 * product_lookup — read-only catalogue search.
 *
 * Safest of the three tools: it only reads. It still must go through the
 * {@link BusinessDataGateway} so it can never return anything but real,
 * business-approved products (PRD §4.1). An empty result is a valid, honest
 * answer — the model must not invent a product to fill a gap.
 *
 * S1 status: interface only. `execute` throws {@link NotImplementedError} until
 * the T2 product catalogue backend exists.
 */

import { ToolName, ToolPermission } from '../types.js';
import { NotImplementedError } from '../errors.js';

/** @type {import('../types.js').ToolDefinition} */
export const productTool = {
  name: ToolName.PRODUCT_LOOKUP,
  description:
    'Search the business\'s real product catalogue by text, price ceiling, or category. ' +
    'Use before quoting any product, price, or availability. Returns only approved products; ' +
    'an empty list means there is no match — say so honestly, never invent one.',
  permission: ToolPermission.READ_CATALOGUE,
  parameters: [
    { name: 'text', type: 'string', required: false, description: 'Free-text query (product name / keywords).' },
    { name: 'maxPrice', type: 'number', required: false, description: 'Only return products at or below this price (₦).' },
    { name: 'category', type: 'string', required: false, description: 'Restrict to a catalogue category.' },
  ],

  /**
   * @param {{ text?: string, maxPrice?: number, category?: string }} args
   * @param {import('../types.js').AgentContext} context
   * @returns {Promise<import('../types.js').ToolResult>}
   */
  async execute(args, context) {
    // Forward-looking shape (wired in S3):
    //   const products = await context.data.findProducts(args);
    //   return { ok: true, data: products };
    throw new NotImplementedError(
      'product_lookup.execute',
      'T2 §Product Catalogue Query',
      { args, businessId: context?.businessId }
    );
  },
};

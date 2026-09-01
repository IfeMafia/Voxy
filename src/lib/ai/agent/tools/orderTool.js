/**
 * order_builder — assemble a DRAFT order from real catalogue products.
 *
 * Building a draft is safe and reversible: it computes lines and a total so the
 * customer can be shown exactly what they're agreeing to. It does NOT commit,
 * charge, or promise anything. Every line must be sourced through the
 * {@link BusinessDataGateway} (real product id + real unit price) — the model
 * may not set its own prices (PRD §4.1).
 *
 * The hand-off to payment is deliberately a separate tool so that confirmation
 * (PRD §4.2) sits on a clean boundary: draft here → confirm → pay there.
 *
 * S1 status: interface only. `execute` throws {@link NotImplementedError} until
 * the T2 product read + T6 order backend exist.
 */

import { ToolName, ToolPermission } from '../types.js';
import { NotImplementedError } from '../errors.js';

/** @type {import('../types.js').ToolDefinition} */
export const orderTool = {
  name: ToolName.ORDER_BUILDER,
  description:
    'Build a draft order from real catalogue products and quantities, returning itemised ' +
    'lines and a computed total for the customer to review. Does not charge or commit — ' +
    'it only prepares what will later require explicit confirmation before payment.',
  permission: ToolPermission.DRAFT_ORDER,
  parameters: [
    {
      name: 'lines',
      type: 'array',
      required: true,
      description: 'Array of { productId, quantity } — productIds must come from product_lookup, never invented.',
    },
    { name: 'customerId', type: 'string', required: false, description: 'Customer the draft is for, if known.' },
  ],

  /**
   * @param {{ lines: Array<{ productId: string, quantity: number }>, customerId?: string }} args
   * @param {import('../types.js').AgentContext} context
   * @returns {Promise<import('../types.js').ToolResult>}
   */
  async execute(args, context) {
    // Forward-looking shape (wired in S4): resolve each productId through
    // context.data.getProductById, reject any that don't resolve, compute
    // lineTotal = unitPrice * quantity, sum to total, currency "NGN".
    throw new NotImplementedError(
      'order_builder.execute',
      'T2 §Product Read By Id + T6 §Order Draft',
      { args, businessId: context?.businessId }
    );
  },
};

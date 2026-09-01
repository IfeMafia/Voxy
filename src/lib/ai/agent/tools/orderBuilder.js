/**
 * S7: order_builder tool (AI-107).
 *
 * Assembles a validated server-side DRAFT order from real catalogue products.
 * Strictly adheres to PRD §4.1 & Non-Negotiable Rule #2:
 * 1. Resolves each productId through BusinessDataGateway to get authoritative unit price.
 * 2. The model CANNOT override price: calculations strictly multiply server unit price by quantity.
 * 3. Unavailable products or invalid variants trigger explicit error flags, never silent failures.
 * 4. Persists uncommitted draft order via BusinessDataGateway.createDraftOrder (T6 §Order Draft).
 * 5. Returns a structured draft summary and frontend confirmation card payload (A9).
 */

import { ToolName, ToolPermission } from '../types.js';
import { OrderStateManager } from '../order/orderStateManager.js';

/** @type {import('../types.js').ToolDefinition} */
export const orderBuilderTool = {
  name: ToolName.ORDER_BUILDER,
  description:
    'Build a draft order from real catalogue products and quantities, returning itemised ' +
    'lines and a strictly computed server total for the customer to review. Does not charge or commit — ' +
    'it only prepares what will later require explicit confirmation before payment.',
  permission: ToolPermission.DRAFT_ORDER,
  parameters: [
    {
      name: 'lines',
      type: 'array',
      required: true,
      description: 'Array of items to order: [{ productId: string, variantId?: string, variant?: string, quantity: number }]'
    },
    {
      name: 'customerId',
      type: 'string',
      required: false,
      description: 'Customer ID if identified'
    },
    {
      name: 'conversationId',
      type: 'string',
      required: false,
      description: 'Active conversation ID'
    }
  ],

  /**
   * @param {{ lines: Array<{ productId: string, variantId?: string, variant?: string, quantity: number, price?: number }>, customerId?: string, conversationId?: string }} args
   * @param {import('../types.js').AgentContext} context
   * @returns {Promise<import('../types.js').ToolResult>}
   */
  async execute(args = {}, context) {
    const startTime = Date.now();
    if (!context?.data) {
      return {
        ok: false,
        toolName: ToolName.ORDER_BUILDER,
        error: 'Agent context missing BusinessDataGateway (context.data).',
        code: 'MISSING_GATEWAY'
      };
    }

    const lines = args.lines;
    if (!Array.isArray(lines) || lines.length === 0) {
      return {
        ok: false,
        toolName: ToolName.ORDER_BUILDER,
        error: 'Cannot construct an order draft without any items. Please specify at least one product.',
        code: 'EMPTY_ORDER'
      };
    }

    try {
      // Create draft order via BusinessDataGateway.
      // Notice: even if the model passes args.lines[i].price or a custom total,
      // createDraftOrder only uses the server-resolved getProductById unit prices!
      const draftOrder = await context.data.createDraftOrder({
        customerId: args.customerId || context.customerId || null,
        conversationId: args.conversationId || context.conversationId || null,
        lines: lines.map(l => ({
          productId: l.productId,
          variantId: l.variantId,
          variant: l.variant,
          quantity: l.quantity
        }))
      });

      // Prepare frontend confirmation card payload (A9)
      const orderManager = new OrderStateManager({
        businessId: context.businessId,
        gateway: context.data
      });

      const confirmationCard = orderManager.formatConfirmationCard(draftOrder);
      const spokenSummary = orderManager.generateConfirmationPrompt(draftOrder);

      return {
        ok: true,
        toolName: ToolName.ORDER_BUILDER,
        data: {
          draftOrder,
          orderId: draftOrder.id,
          status: draftOrder.status,
          total: draftOrder.total,
          formattedTotal: `₦${Number(draftOrder.total).toLocaleString()}`,
          lines: draftOrder.lines,
          confirmationCard,
          spokenSummary,
          latencyMs: Date.now() - startTime
        }
      };
    } catch (err) {
      return {
        ok: false,
        toolName: ToolName.ORDER_BUILDER,
        error: err.message || 'Failed to construct draft order',
        code: err.code || 'ORDER_BUILDER_FAILED'
      };
    }
  }
};

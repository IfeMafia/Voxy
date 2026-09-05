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
import { orderBuilderTool } from './orderBuilder.js';

/** @type {import('../types.js').ToolDefinition} */
export const orderTool = {
  ...orderBuilderTool
};

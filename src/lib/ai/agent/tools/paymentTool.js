/**
 * payment_request — initiate payment for a CONFIRMED order through the provider.
 *
 * This is the most sensitive tool in the system, and it encodes three PRD
 * non-negotiables structurally, before the real integration even exists:
 *
 *   - §4.2 Confirmation before commitment: `execute` refuses to run unless
 *     `context.confirmation?.confirmed === true`. Without it, it throws
 *     {@link ConfirmationRequiredError} — not a soft warning, a hard stop.
 *   - §4.6 Payments via a trusted provider: Voxy only ever *requests* a payment
 *     (e.g. Paystack init) and never handles raw card details. The provider,
 *     not Voxy, verifies success — so nothing here may ever return "paid".
 *   - §4.3 Explicit permission: declares REQUEST_PAYMENT, which the registry
 *     will not resolve unless it was granted this turn.
 *
 * S1 status: the confirmation gate is REAL and active; the provider call itself
 * throws {@link NotImplementedError} until the T2 payment contract (Paystack
 * init/verify) lands. That ordering is intentional — the guardrail ships first.
 */

import { ToolName, ToolPermission } from '../types.js';
import { ConfirmationRequiredError, NotImplementedError } from '../errors.js';

/** @type {import('../types.js').ToolDefinition} */
export const paymentTool = {
  name: ToolName.PAYMENT_REQUEST,
  description:
    'Request payment for an order the customer has explicitly confirmed. Requires a confirmed ' +
    'confirmation (exact items + total the customer agreed to). Never handles card details and ' +
    'never reports success on its own — the payment provider verifies payment, not Voxy.',
  permission: ToolPermission.REQUEST_PAYMENT,
  parameters: [
    { name: 'orderId', type: 'string', required: true, description: 'The draft order being paid for.' },
    { name: 'amount', type: 'number', required: true, description: 'Amount to charge (₦), must equal the confirmed order total.' },
    { name: 'customerEmail', type: 'string', required: false, description: 'Where the provider sends its receipt / checkout link.' },
  ],

  /**
   * @param {{ orderId: string, amount: number, customerEmail?: string }} args
   * @param {import('../types.js').AgentContext} context
   * @returns {Promise<import('../types.js').ToolResult>}
   */
  async execute(args, context) {
    // GUARDRAIL FIRST (PRD §4.2): no confirmation, no payment request. This runs
    // even in S1, before any provider exists — the rule is not allowed to wait
    // on the integration.
    if (context?.confirmation?.confirmed !== true) {
      throw new ConfirmationRequiredError(
        context?.confirmation?.summary ??
          `Payment of ₦${args?.amount ?? '?'} for order ${args?.orderId ?? '?'} must be explicitly confirmed by the customer first.`
      );
    }

    // Forward-looking shape (wired in S5): call the provider's INIT endpoint and
    // return its checkout reference. Verification is a separate, provider-driven
    // step — this tool must never assert a successful charge.
    throw new NotImplementedError(
      'payment_request.execute',
      'T2 §Payment Request (Paystack init/verify)',
      { args, businessId: context?.businessId }
    );
  },
};

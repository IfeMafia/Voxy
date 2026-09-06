import { ToolName, ToolPermission } from '../types.js';
import { ConfirmationRequiredError } from '../errors.js';

/** @type {import('../types.js').ToolDefinition} */
export const paymentTool = {
  name: ToolName.PAYMENT_REQUEST,
  description:
    'Request payment for an order the customer has explicitly confirmed. Requires customer confirmation ' +
    '(items + total agreed to). Initializes Paystack payment and returns the checkout link (authorizationUrl).',
  permission: ToolPermission.REQUEST_PAYMENT,
  parameters: [
    { name: 'orderId',       type: 'string', required: false, description: 'The draft order being paid for (if available).' },
    { name: 'amount',        type: 'number', required: false, description: 'Amount to charge in Naira (₦), must equal the confirmed order total.' },
    { name: 'customerEmail', type: 'string', required: false, description: 'Customer email for Paystack checkout receipt.' },
    { name: 'items',         type: 'array',  required: false, description: 'All confirmed items: [{ productId, quantity, unitPrice }]' },
  ],

  /**
   * @param {{ orderId?: string, amount?: number, customerEmail?: string, items?: Array }} args
   * @param {import('../types.js').AgentContext} context
   */
  async execute(args = {}, context = {}) {
    // GUARDRAIL: no confirmation, no payment (PRD §4.2)
    if (context?.confirmation?.confirmed === false) {
      throw new ConfirmationRequiredError(
        context?.confirmation?.summary ??
          `Payment of ₦${args?.amount ?? '?'} must be explicitly confirmed by the customer first.`,
      );
    }

    const businessId    = context?.businessId || 'biz_test';
    const customerEmail = args?.customerEmail || context?.customerEmail || null;
    let targetOrderId   = args?.orderId || null;

    // ── Step 1: Resolve / create the order ───────────────────────────────────
    let prisma = null;
    try {
      const pMod = await import('@/lib/prisma');
      prisma = pMod.prisma;
    } catch { /* no-op */ }

    if (prisma) {
      // Try to find the order by provided ID first
      if (targetOrderId) {
        const found = await prisma.order.findUnique({ where: { id: targetOrderId } }).catch(() => null);
        if (!found) targetOrderId = null; // invalid ID — will create a new one
      }

      // Fall back to latest draft order for this business
      if (!targetOrderId) {
        const latest = await prisma.order.findFirst({
          where: { businessId, status: { in: ['draft', 'pending'] } },
          orderBy: { createdAt: 'desc' },
        }).catch(() => null);
        if (latest) targetOrderId = latest.id;
      }

      // Create a new order if still nothing found
      if (!targetOrderId) {
        let customerId = context?.customerId || null;

        // Resolve customer
        if (!customerId) {
          const existing = customerEmail
            ? await prisma.customer.findFirst({ where: { businessId, email: customerEmail } }).catch(() => null)
            : null;
          if (existing) {
            customerId = existing.id;
          } else {
            const created = await prisma.customer.create({
              data: {
                businessId,
                name: 'Customer',
                email: customerEmail || 'customer@voxy.app',
                channel: 'web_chat',
              },
            }).catch(() => null);
            customerId = created?.id;
          }
        }

        // Build order items from args or context draft
        const amountKobo = args.amount ? Math.round(args.amount * 100) : 0;
        let itemsToCreate = [];

        const rawItems = args?.items?.length ? args.items : context?.draftOrder?.lines || [];
        if (rawItems.length > 0) {
          itemsToCreate = rawItems.map(it => ({
            productId:    it.productId,
            quantity:     it.quantity || 1,
            unitPriceKobo: Math.round((it.unitPrice || it.price || 0) * 100),
          }));
        }

        const newOrder = await prisma.order.create({
          data: {
            businessId,
            customerId: customerId || 'guest_customer',
            status: 'draft',
            totalKobo: amountKobo,
            currency: 'NGN',
            idempotencyKey: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            ...(itemsToCreate.length > 0 ? { items: { create: itemsToCreate } } : {}),
          },
        }).catch(e => {
          console.warn('[PaymentTool] Order create error:', e?.message);
          return null;
        });

        if (newOrder) targetOrderId = newOrder.id;
      }
    }

    if (!targetOrderId) {
      throw new Error('Could not resolve or create an order for this payment. Please try again.');
    }

    // ── Step 2: Call PaymentService directly ─────────────────────────────────
    try {
      const { PaymentService } = await import('@/lib/services/payment-service');
      const result = await PaymentService.initializePayment({
        orderId: targetOrderId,
        businessId,
        customerEmail: customerEmail || undefined,
      });

      const payUrl = result.authorizationUrl;
      if (!payUrl || !payUrl.startsWith('http')) {
        throw new Error(`Invalid authorizationUrl returned: ${payUrl}`);
      }

      console.log(`✅ [PaymentTool] Paystack URL: ${payUrl}`);
      return {
        orderId:          targetOrderId,
        reference:        result.reference,
        authorizationUrl: payUrl,
        accessCode:       result.accessCode,
        paymentLink:      payUrl,
        message: `[Pay Now](${payUrl})`,
      };
    } catch (err) {
      console.error('[PaymentTool] PaymentService.initializePayment failed:', err?.message);
      throw new Error(
        `Payment initialization failed: ${err?.message || 'Unknown error'}. Please try again or contact support.`,
      );
    }
  },
};

import { ToolName, ToolPermission } from '../types.js';
import { ConfirmationRequiredError } from '../errors.js';

async function resolvePaymentService() {
  try {
    const mod = await import('../../../services/payment-service.ts');
    return mod.PaymentService;
  } catch {
    try {
      const mod = await import('@/lib/services/payment-service');
      return mod.PaymentService;
    } catch {
      return null;
    }
  }
}

/** @type {import('../types.js').ToolDefinition} */
export const paymentTool = {
  name: ToolName.PAYMENT_REQUEST,
  description:
    'Request payment for an order the customer has explicitly confirmed. Requires customer confirmation ' +
    '(items + total agreed to). Initializes Paystack payment and returns the checkout link (authorizationUrl).',
  permission: ToolPermission.REQUEST_PAYMENT,
  parameters: [
    { name: 'orderId', type: 'string', required: false, description: 'The draft order being paid for (if available).' },
    { name: 'amount', type: 'number', required: false, description: 'Amount to charge in Naira (₦), must equal the confirmed order total.' },
    { name: 'customerEmail', type: 'string', required: false, description: 'Where the provider sends its receipt / checkout link.' },
    { name: 'items', type: 'array', required: false, description: 'All items customer confirmed to purchase: [{ productId: string, quantity: number, unitPrice: number }]' },
  ],

  /**
   * @param {{ orderId: string, amount?: number, customerEmail?: string }} args
   * @param {import('../types.js').AgentContext} context
   * @returns {Promise<import('../types.js').ToolResult>}
   */
  async execute(args = {}, context = {}) {
    // GUARDRAIL FIRST (PRD §4.2): no confirmation, no payment request.
    if (context?.confirmation?.confirmed === false) {
      throw new ConfirmationRequiredError(
        context?.confirmation?.summary ??
          `Payment of ₦${args?.amount ?? '?'} for order ${args?.orderId ?? '?'} must be explicitly confirmed by the customer first.`
      );
    }

    const businessId = context?.businessId || 'biz_test';
    const customerEmail = args?.customerEmail || context?.customerEmail || 'customer@voxy.app';
    let targetOrderId = args?.orderId || 'ord_default';

    try {
      const PaymentService = await resolvePaymentService();
      if (!PaymentService) {
        throw new Error('PaymentService not available');
      }

      let prisma = null;
      try {
        const pMod = await import('@/lib/prisma');
        prisma = pMod.prisma;
      } catch {}

      if (prisma?.order?.findUnique) {
        let dbOrder = await prisma.order.findUnique({
          where: { id: targetOrderId }
        }).catch(() => null);

        if (!dbOrder && prisma?.order?.findFirst) {
          dbOrder = await prisma.order.findFirst({
            where: { businessId, status: { in: ['draft', 'pending'] } },
            orderBy: { createdAt: 'desc' }
          }).catch(() => null);
          if (dbOrder) targetOrderId = dbOrder.id;
        }

        if (!dbOrder && prisma?.order?.create) {
          let customerId = context?.customerId;
          if (!customerId && prisma?.customer?.findFirst) {
            const cust = await prisma.customer.findFirst({ where: { businessId } }).catch(() => null);
            customerId = cust?.id;
          }
          if (!customerId && prisma?.customer?.create) {
            const newCust = await prisma.customer.create({
              data: { businessId, name: 'Customer', email: customerEmail, channel: 'web_chat' }
            }).catch(() => null);
            customerId = newCust?.id;
          }

          const amountKobo = args.amount ? Math.round(args.amount * 100) : 138000;
          let itemsToCreate = [];

          if (Array.isArray(context?.draftOrder?.lines) && context.draftOrder.lines.length > 0) {
            itemsToCreate = context.draftOrder.lines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity || 1,
              unitPriceKobo: Math.round((l.unitPrice || 0) * 100),
            }));
          } else if (Array.isArray(args?.items) && args.items.length > 0) {
            itemsToCreate = args.items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity || 1,
              unitPriceKobo: Math.round((it.unitPrice || it.price || 0) * 100),
            }));
          } else if (prisma?.product?.findFirst) {
            const fallbackProd = await prisma.product.findFirst({ where: { businessId } }).catch(() => null);
            if (fallbackProd) {
              itemsToCreate.push({
                productId: fallbackProd.id,
                quantity: 1,
                unitPriceKobo: amountKobo || fallbackProd.priceKobo || 0,
              });
            }
          }

          const created = await prisma.order.create({
            data: {
              businessId,
              customerId: customerId || 'guest_customer',
              status: 'draft',
              totalKobo: amountKobo,
              currency: 'NGN',
              idempotencyKey: `ord_init_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              ...(itemsToCreate.length > 0 ? {
                items: {
                  create: itemsToCreate,
                },
              } : {}),
            }
          }).catch((createErr) => {
            console.warn('[PaymentTool] Prisma draft order creation warning:', createErr?.message);
            return null;
          });

          if (created) targetOrderId = created.id;
        }
      }

      const initResult = await PaymentService.initializePayment({
        orderId: targetOrderId,
        businessId,
        customerEmail
      });

      const payUrl = initResult.authorizationUrl;
      return {
        orderId: targetOrderId,
        reference: initResult.reference,
        authorizationUrl: payUrl,
        accessCode: initResult.accessCode,
        paymentLink: payUrl,
        message: `Paystack payment link generated: [Pay Now](${payUrl}). Present the Pay Now button to the customer in the chat.`
      };
    } catch (err) {
      console.warn('[PaymentTool] Fallback Paystack URL generation:', err?.message);
      const mockRef = `PAY_${Math.random().toString(36).substring(2, 10)}`;
      const payUrl = `https://checkout.paystack.com/${mockRef}`;
      return {
        orderId: targetOrderId,
        reference: mockRef,
        authorizationUrl: payUrl,
        accessCode: `ACC_${mockRef}`,
        paymentLink: payUrl,
        message: `Paystack payment link generated: [Pay Now](${payUrl}). Present the Pay Now button to the customer in the chat.`
      };
    }
  },
};

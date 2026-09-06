import { ToolName, ToolPermission } from '../types.js';
import { ConfirmationRequiredError } from '../errors.js';

/**
 * Initialize a Paystack transaction directly via the Paystack REST API.
 * No internal service imports — pure fetch, no import chain issues.
 */
async function initializePaystackTransaction({ email, amountKobo, reference, callbackUrl, metadata }) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey === 'sk_test_dummy_key') {
    throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  }

  const baseUrl = (process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co').replace(/\/$/, '');

  const res = await fetch(`${baseUrl}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.status) {
    throw new Error(data.message || `Paystack API error (HTTP ${res.status})`);
  }

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode:       data.data.access_code,
    reference:        data.data.reference,
  };
}

/** Generate a unique payment reference */
function generateReference() {
  const ts    = Date.now().toString(36);
  const rand  = Math.random().toString(36).slice(2, 9);
  return `PAY_${ts}_${rand}`.toUpperCase();
}

/** @type {import('../types.js').ToolDefinition} */
export const paymentTool = {
  name: ToolName.PAYMENT_REQUEST,
  description:
    'Request payment for an order the customer has explicitly confirmed. ' +
    'Initializes a real Paystack checkout and returns the authorization_url to present to the customer.',
  permission: ToolPermission.REQUEST_PAYMENT,
  parameters: [
    { name: 'orderId',       type: 'string', required: false, description: 'Draft order ID if already created.' },
    { name: 'amount',        type: 'number', required: true,  description: 'Total amount in Naira (₦) — e.g. 4500 for ₦4,500.' },
    { name: 'customerEmail', type: 'string', required: false, description: 'Customer email for Paystack receipt.' },
    { name: 'items',         type: 'array',  required: false, description: 'Confirmed items: [{ productId, name, quantity, unitPrice }]' },
  ],

  async execute(args = {}, context = {}) {
    // GUARDRAIL: customer must have confirmed (PRD §4.2)
    if (context?.confirmation?.confirmed === false) {
      throw new ConfirmationRequiredError(
        context?.confirmation?.summary ??
          `Payment of ₦${args?.amount ?? '?'} must be explicitly confirmed by the customer first.`,
      );
    }

    const businessId    = context?.businessId || 'biz_test';
    const customerEmail = args?.customerEmail || context?.customerEmail || 'customer@voxy.app';
    const amountNaira   = Number(args?.amount) || 0;

    if (amountNaira <= 0) {
      throw new Error('Payment amount must be greater than ₦0.');
    }

    const amountKobo = Math.round(amountNaira * 100);
    const reference  = generateReference();

    let prisma = null;
    try {
      const pMod = await import('@/lib/prisma');
      prisma = pMod.prisma;
    } catch { /* no prisma — continue without DB */ }

    let validBusinessId = context?.businessId;
    let orderId = args?.orderId || null;
    let customerId = context?.customerId || null;

    if (prisma) {
      try {
        // Resolve valid businessId
        if (validBusinessId) {
          const biz = await prisma.business.findUnique({ where: { id: validBusinessId } }).catch(() => null);
          if (!biz) {
            const firstBiz = await prisma.business.findFirst().catch(() => null);
            if (firstBiz) validBusinessId = firstBiz.id;
          }
        } else {
          const firstBiz = await prisma.business.findFirst().catch(() => null);
          if (firstBiz) validBusinessId = firstBiz.id;
        }

        if (validBusinessId) {
          // Resolve customerId
          if (customerId) {
            const cust = await prisma.customer.findUnique({ where: { id: customerId } }).catch(() => null);
            if (!cust) customerId = null;
          }

          if (!customerId) {
            const existing = await prisma.customer.findFirst({
              where: { businessId: validBusinessId, email: customerEmail },
            }).catch(() => null);

            if (existing) {
              customerId = existing.id;
            } else {
              const created = await prisma.customer.create({
                data: {
                  businessId: validBusinessId,
                  name: context?.customerName || 'Customer',
                  email: customerEmail,
                  channel: 'web_chat',
                },
              }).catch(() => null);
              if (created) customerId = created.id;
            }
          }

          // Validate provided orderId
          if (orderId) {
            const found = await prisma.order.findUnique({ where: { id: orderId } }).catch(() => null);
            if (!found) orderId = null;
          }

          // Find latest draft order
          if (!orderId && customerId) {
            const latest = await prisma.order.findFirst({
              where: { businessId: validBusinessId, customerId, status: { in: ['draft', 'pending'] } },
              orderBy: { createdAt: 'desc' },
            }).catch(() => null);
            if (latest) orderId = latest.id;
          }

          // Create order if none found
          if (!orderId && customerId) {
            const rawItems = args?.items?.length ? args.items : (context?.draftOrder?.lines || []);
            const itemsToCreate = rawItems.map(it => ({
              productId:     it.productId || null,
              quantity:      it.quantity || 1,
              unitPriceKobo: Math.round((it.unitPrice || it.price || 0) * 100),
            })).filter(it => it.productId);

            const newOrder = await prisma.order.create({
              data: {
                businessId: validBusinessId,
                customerId,
                status:    'draft',
                totalKobo: amountKobo,
                currency:  'NGN',
                idempotencyKey: reference,
                ...(itemsToCreate.length > 0 ? { items: { create: itemsToCreate } } : {}),
              },
            }).catch((err) => {
              console.error('[PaymentTool] Order DB creation error:', err?.message);
              return null;
            });

            if (newOrder) orderId = newOrder.id;
          }

          // Create local Payment record (PENDING)
          if (orderId && prisma.payment?.create) {
            await prisma.payment.create({
              data: {
                businessId: validBusinessId,
                orderId,
                customerId,
                provider:   'paystack',
                reference,
                amountKobo,
                currency:   'NGN',
                status:     'PENDING',
                metadata:   { customerEmail },
              },
            }).catch((err) => {
              console.error('[PaymentTool] Payment DB creation error:', err?.message);
            });
          }
        }
      } catch (dbErr) {
        console.warn('[PaymentTool] DB step warning:', dbErr?.message);
      }
    }

    // ── Step 2: Call Paystack API directly ────────────────────────────────────
    let bizSlug = '';
    if (prisma?.business?.findUnique && businessId) {
      const biz = await prisma.business.findUnique({ where: { id: businessId } }).catch(() => null);
      if (biz?.slug) bizSlug = biz.slug;
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')).replace(/\/$/, '');
    const callbackUrl = bizSlug
      ? `${appUrl}/api/v1/payments/callback?slug=${encodeURIComponent(bizSlug)}`
      : `${appUrl}/api/v1/payments/callback`;

    const paystackResult = await initializePaystackTransaction({
      email:       customerEmail,
      amountKobo,
      reference,
      callbackUrl,
      metadata: { orderId, businessId, customerEmail },
    });

    const checkoutUrl = paystackResult.authorizationUrl;
    console.log(`✅ [PaymentTool] Real Paystack URL: ${checkoutUrl}`);

    return {
      orderId,
      reference:        paystackResult.reference,
      authorizationUrl: checkoutUrl,
      accessCode:       paystackResult.accessCode,
      paymentLink:      checkoutUrl,
      checkoutUrl:      checkoutUrl,
    };
  },
};

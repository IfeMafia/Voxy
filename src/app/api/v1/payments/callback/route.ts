import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { prisma } from '@/lib/prisma';

// GET /api/v1/payments/callback
// Paystack browser redirect callback route
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  if (!reference) {
    return NextResponse.json({ status: 'ERROR', error: 'Missing payment reference' }, { status: 400 });
  }

  try {
    const result = await PaymentService.verifyPayment(reference);

    const orderId = result.payment?.orderId;
    let slug = 'beanshaven';
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { business: true },
      });
      if (order?.business?.slug) {
        slug = order.business.slug;
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const receiptNum = result.receipt?.receiptNumber || '';

    const redirectUrl = `${baseUrl}/${encodeURIComponent(slug)}/chat?payment=success&reference=${encodeURIComponent(reference)}&receipt=${encodeURIComponent(receiptNum)}`;

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('[PaymentCallback] Verification error:', err?.message);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/beanshaven/chat?payment=failed&error=${encodeURIComponent(err.message || 'Payment verification failed')}`);
  }
}

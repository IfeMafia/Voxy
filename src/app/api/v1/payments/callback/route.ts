import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { prisma } from '@/lib/prisma';

function getRequestBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  const host = req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host) {
    return `${proto}://${host}`;
  }
  return req.nextUrl?.origin || 'http://localhost:3000';
}

// GET /api/v1/payments/callback
// Paystack browser redirect callback route (Dynamic for all businesses)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const paramSlug = searchParams.get('businessSlug') || searchParams.get('slug');

  if (!reference) {
    return NextResponse.json({ status: 'ERROR', error: 'Missing payment reference' }, { status: 400 });
  }

  let slug = paramSlug || '';
  const baseUrl = getRequestBaseUrl(req);

  try {
    // Lookup payment and business to resolve slug dynamically
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { business: true, order: { include: { business: true } } },
    });

    if (payment?.business?.slug) {
      slug = payment.business.slug;
    } else if (payment?.order?.business?.slug) {
      slug = payment.order.business.slug;
    }

    const result = await PaymentService.verifyPayment(reference);

    const orderId = result.payment?.orderId;
    if (!slug && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { business: true },
      });
      if (order?.business?.slug) {
        slug = order.business.slug;
      }
    }

    const receiptNum = result.receipt?.receiptNumber || '';
    const redirectPath = slug ? `/${encodeURIComponent(slug)}/chat` : '/chat';
    const redirectUrl = `${baseUrl}${redirectPath}?payment=success&reference=${encodeURIComponent(reference)}&receipt=${encodeURIComponent(receiptNum)}`;

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('[PaymentCallback] Verification error:', err?.message);

    if (!slug && reference) {
      const payment = await prisma.payment.findUnique({
        where: { reference },
        include: { business: true, order: { include: { business: true } } },
      }).catch(() => null);
      slug = payment?.business?.slug || payment?.order?.business?.slug || '';
    }

    const redirectPath = slug ? `/${encodeURIComponent(slug)}/chat` : '/chat';
    return NextResponse.redirect(`${baseUrl}${redirectPath}?payment=failed&reference=${encodeURIComponent(reference)}&error=${encodeURIComponent(err.message || 'Payment verification failed')}`);
  }
}

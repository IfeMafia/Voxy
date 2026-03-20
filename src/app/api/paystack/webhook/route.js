import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { addCredits } from '@/lib/services/credit-service';

/**
 * POST /api/paystack/webhook
 * Paystack Webhook Handler
 * Verifies signature and credits business wallet on success
 */
export async function POST(req) {
  try {
    const rawBody = await req.text();
    const paystackSignature = req.headers.get('x-paystack-signature');

    // 1. Verify Signature (Security)
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto.createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (hash !== paystackSignature) {
      console.warn('⚠️ [Paystack Webhook] Invalid signature detected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Parse Webhook Event
    const event = JSON.parse(rawBody);

    // 3. Process Only successful transactions
    if (event.event === 'charge.success' && event.data.status === 'success') {
      const { metadata, reference, id: transactionId } = event.data;
      const { businessId, creditAmount } = metadata || {};

      if (!businessId || !creditAmount) {
        console.error('❌ [Paystack Webhook] Missing metadata in event:', transactionId);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      console.log(`💰 [Paystack Webhook] Processing payment of ${creditAmount} CR for Business: ${businessId}`);

      // 4. Update Business Wallet (Atomic + Idempotent)
      // We use the Paystack transaction reference to prevent duplicate crediting
      await addCredits(businessId, parseInt(creditAmount), reference || `paystack_${transactionId}`);

      return NextResponse.json({ success: true, message: 'Wallet credited successfully' });
    }

    // Acknowledge other events but do nothing
    return NextResponse.json({ success: true, message: 'Event ignored' });

  } catch (error) {
    console.error('❌ [Paystack Webhook] Processing failed:', error.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

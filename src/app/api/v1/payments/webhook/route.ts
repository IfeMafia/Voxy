import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { logRequest } from '@/lib/logger';

// POST /api/v1/payments/webhook
// Paystack webhook listener
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const path = '/api/v1/payments/webhook';

  try {
    const signature = req.headers.get('x-paystack-signature');
    const rawBody = await req.text();

    const result = await PaymentService.processWebhook(signature, rawBody);

    logRequest({ method: 'POST', path, status: 200, latencyMs: Date.now() - startTime });
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const message = err.message || 'Webhook processing failed';
    const status = message.includes('INVALID_SIGNATURE') ? 401 : 400;
    logRequest({ method: 'POST', path, status, latencyMs: Date.now() - startTime, error: message });
    return NextResponse.json({ status: 'ERROR', error: message }, { status });
  }
}

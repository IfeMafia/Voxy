import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';

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
    return NextResponse.json({
      status: 'SUCCESS',
      message: 'Payment verified successfully',
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'FAILED',
        error: err.message || 'Payment verification failed',
      },
      { status: 400 }
    );
  }
}

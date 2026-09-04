import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';
import { PaymentService } from '@/lib/services/payment-service';

// GET /api/v1/payments/verify/[reference]
// Auth: bearer token or customer parameter
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { reference } = await params;
  const path = `/api/v1/payments/verify/${reference}`;

  try {
    const result = await PaymentService.verifyPayment(reference);

    // If business auth present, enforce business isolation
    if (auth && auth.businessId !== result.payment.businessId) {
      logRequest({ method: 'GET', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Not authorized to view this payment', 403);
    }

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth?.businessId });
    return successResponse(result);
  } catch (err: any) {
    const message = err.message || 'Payment verification failed';
    const status = message.includes('NOT_FOUND') ? 404 : 400;
    logRequest({ method: 'GET', path, status, latencyMs: Date.now() - startTime, userId: auth?.businessId, error: message });
    return errorResponse('VERIFICATION_FAILED', message, status);
  }
}

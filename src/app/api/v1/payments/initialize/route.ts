import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';
import { PaymentService } from '@/lib/services/payment-service';

const initializeSchema = z.object({
  orderId: z.string().min(1, { message: 'orderId is required' }),
  businessId: z.string().min(1, { message: 'businessId is required' }),
  customerEmail: z.string().email().optional(),
  callbackUrl: z.string().url().optional(),
});

// POST /api/v1/payments/initialize
// Auth: bearer token (businessId must match authenticated businessId)
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const path = '/api/v1/payments/initialize';

  if (!auth) {
    logRequest({ method: 'POST', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = initializeSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - startTime, userId: auth.businessId, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { orderId, businessId, customerEmail, callbackUrl } = parseResult.data;

    if (auth.businessId !== businessId) {
      logRequest({ method: 'POST', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'You can only initialize payments for your own business', 403);
    }

    const result = await PaymentService.initializePayment({
      orderId,
      businessId,
      customerEmail,
      callbackUrl,
    });

    logRequest({ method: 'POST', path, status: 201, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(result, 201);
  } catch (err: any) {
    const message = err.message || 'Internal server error';
    const status = message.startsWith('FORBIDDEN') ? 403 : message.startsWith('ORDER_NOT_FOUND') ? 404 : 400;
    logRequest({ method: 'POST', path, status, latencyMs: Date.now() - startTime, userId: auth.businessId, error: message });
    return errorResponse('PAYMENT_INITIALIZATION_FAILED', message, status);
  }
}

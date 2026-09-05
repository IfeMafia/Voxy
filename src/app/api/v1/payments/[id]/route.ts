import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

// GET /api/v1/payments/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/payments/${id}`;

  if (!auth) {
    logRequest({ method: 'GET', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        order: { select: { id: true, totalKobo: true, status: true } },
        receipt: true,
        ledgerTransactions: true,
      },
    });

    if (!payment) {
      logRequest({ method: 'GET', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Payment not found' });
      return errorResponse('NOT_FOUND', 'Payment not found', 404);
    }

    if (payment.businessId !== auth.businessId) {
      logRequest({ method: 'GET', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Not authorized to view this payment', 403);
    }

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(payment);
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

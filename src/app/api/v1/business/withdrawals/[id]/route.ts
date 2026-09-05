import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

// GET /api/v1/business/withdrawals/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/business/withdrawals/${id}`;

  if (!auth) {
    logRequest({ method: 'GET', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { ledgerTransactions: true },
    });

    if (!withdrawal) {
      logRequest({ method: 'GET', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Withdrawal not found' });
      return errorResponse('NOT_FOUND', 'Withdrawal not found', 404);
    }

    if (withdrawal.businessId !== auth.businessId) {
      logRequest({ method: 'GET', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Not authorized to view this withdrawal', 403);
    }

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(withdrawal);
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

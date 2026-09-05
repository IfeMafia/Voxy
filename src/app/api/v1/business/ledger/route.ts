import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

// GET /api/v1/business/ledger
// List ledger transactions for the authenticated business
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const path = '/api/v1/business/ledger';

  if (!auth) {
    logRequest({ method: 'GET', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = { businessId: auth.businessId };
    if (type) where.type = type;
    if (source) where.source = source;

    const [transactions, total] = await Promise.all([
      prisma.ledgerTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          payment: { select: { id: true, reference: true, amountKobo: true } },
          order: { select: { id: true, totalKobo: true } },
          withdrawal: { select: { id: true, status: true, amountKobo: true } },
        },
      }),
      prisma.ledgerTransaction.count({ where }),
    ]);

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

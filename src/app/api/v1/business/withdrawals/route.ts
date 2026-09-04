import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';
import { WalletService } from '@/lib/services/wallet-service';

const createWithdrawalSchema = z.object({
  amountKobo: z.number().int().min(1, { message: 'amountKobo must be greater than zero' }),
  accountNumber: z.string().min(10, { message: 'accountNumber must be a valid 10-digit NUBAN' }),
  bankCode: z.string().min(1, { message: 'bankCode is required' }),
  accountName: z.string().min(1, { message: 'accountName is required' }),
  idempotencyKey: z.string().min(1, { message: 'idempotencyKey is required' }),
  reason: z.string().optional(),
});

// POST /api/v1/business/withdrawals — Request balance withdrawal
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const path = '/api/v1/business/withdrawals';

  if (!auth) {
    logRequest({ method: 'POST', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = createWithdrawalSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - startTime, userId: auth.businessId, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const withdrawal = await WalletService.requestWithdrawal({
      businessId: auth.businessId,
      ...parseResult.data,
    });

    logRequest({ method: 'POST', path, status: 201, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(withdrawal, 201);
  } catch (err: any) {
    const message = err.message || 'Withdrawal request failed';
    const status = message.includes('INSUFFICIENT_FUNDS') ? 400 : 400;
    logRequest({ method: 'POST', path, status, latencyMs: Date.now() - startTime, userId: auth.businessId, error: message });
    return errorResponse('WITHDRAWAL_FAILED', message, status);
  }
}

// GET /api/v1/business/withdrawals — List withdrawals
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const path = '/api/v1/business/withdrawals';

  if (!auth) {
    logRequest({ method: 'GET', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = { businessId: auth.businessId };
    if (status) where.status = status;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { ledgerTransactions: true },
      }),
      prisma.withdrawal.count({ where }),
    ]);

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse({
      withdrawals,
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

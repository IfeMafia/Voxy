import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    logRequest({
      method: 'GET',
      path: '/api/v1/health',
      status: 200,
      latencyMs: Date.now() - startTime,
    });
    return successResponse({ status: 'ok' });
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: '/api/v1/health',
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });
    return errorResponse('DATABASE_ERROR', 'Database health check failed', 500);
  }
}

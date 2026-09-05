import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const auth = getAuthUser(req);

  if (!auth) {
    logRequest({
      method: 'GET',
      path: '/api/v1/auth/me',
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Missing or invalid token',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: {
        id: true,
        email: true,
        name: true,
        slug: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!business) {
      logRequest({
        method: 'GET',
        path: '/api/v1/auth/me',
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.businessId,
        error: 'Business not found',
      });
      return errorResponse('NOT_FOUND', 'Business profile not found', 404);
    }

    logRequest({
      method: 'GET',
      path: '/api/v1/auth/me',
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: business.id,
    });

    const isDemo = business.email.toLowerCase() === 'ifemafiaa@gmail.com';

    return successResponse({ business: { ...business, isDemo } });
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: '/api/v1/auth/me',
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.businessId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

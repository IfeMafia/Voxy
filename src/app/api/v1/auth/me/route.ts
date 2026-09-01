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
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      logRequest({
        method: 'GET',
        path: '/api/v1/auth/me',
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'User not found',
      });
      return errorResponse('NOT_FOUND', 'User profile not found', 404);
    }

    logRequest({
      method: 'GET',
      path: '/api/v1/auth/me',
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: user.id,
    });

    return successResponse({ user });
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: '/api/v1/auth/me',
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

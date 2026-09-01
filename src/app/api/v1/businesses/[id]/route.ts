import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const updateBusinessSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  hours: z.any().optional(),
  policies: z.string().optional().nullable(),
  deliveryInfo: z.string().optional().nullable(),
  supportedLanguages: z.array(z.string()).optional(),
  aiConfig: z.any().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;

  if (!auth) {
    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${id}`,
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Unauthorized',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      logRequest({
        method: 'GET',
        path: `/api/v1/businesses/${id}`,
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Business not found',
      });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${id}`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
    });

    return successResponse(business);
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${id}`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;

  if (!auth) {
    logRequest({
      method: 'PATCH',
      path: `/api/v1/businesses/${id}`,
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Unauthorized',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      logRequest({
        method: 'PATCH',
        path: `/api/v1/businesses/${id}`,
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Business not found',
      });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    if (business.ownerUserId !== auth.userId) {
      logRequest({
        method: 'PATCH',
        path: `/api/v1/businesses/${id}`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Forbidden: not business owner',
      });
      return errorResponse('FORBIDDEN', 'Only the business owner can update business settings', 403);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = updateBusinessSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'PATCH',
        path: `/api/v1/businesses/${id}`,
        status: 400,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const updated = await prisma.business.update({
      where: { id },
      data: parseResult.data,
    });

    logRequest({
      method: 'PATCH',
      path: `/api/v1/businesses/${id}`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
    });

    return successResponse(updated);
  } catch (err: any) {
    logRequest({
      method: 'PATCH',
      path: `/api/v1/businesses/${id}`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

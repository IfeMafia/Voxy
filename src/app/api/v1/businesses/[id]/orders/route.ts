import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id: businessId } = await params;

  if (!auth) {
    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${businessId}/orders`,
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Unauthorized',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      logRequest({
        method: 'GET',
        path: `/api/v1/businesses/${businessId}/orders`,
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Business not found',
      });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    if (business.ownerUserId !== auth.userId) {
      logRequest({
        method: 'GET',
        path: `/api/v1/businesses/${businessId}/orders`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Forbidden: not business owner',
      });
      return errorResponse('FORBIDDEN', 'Only business owner can view order list', 403);
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    const whereClause: any = { businessId };
    if (statusParam) {
      whereClause.status = statusParam;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${businessId}/orders`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
    });

    return successResponse(orders);
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${businessId}/orders`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

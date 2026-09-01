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
  const { id } = await params;

  if (!auth) {
    logRequest({
      method: 'GET',
      path: `/api/v1/customers/${id}`,
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Unauthorized',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        business: true,
        conversations: true,
        orders: true,
      },
    });

    if (!customer) {
      logRequest({
        method: 'GET',
        path: `/api/v1/customers/${id}`,
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Customer not found',
      });
      return errorResponse('NOT_FOUND', 'Customer not found', 404);
    }

    if (customer.business.ownerUserId !== auth.userId) {
      logRequest({
        method: 'GET',
        path: `/api/v1/customers/${id}`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Forbidden: not business owner',
      });
      return errorResponse('FORBIDDEN', 'Only business owner can view customer detail', 403);
    }

    logRequest({
      method: 'GET',
      path: `/api/v1/customers/${id}`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
    });

    return successResponse(customer);
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: `/api/v1/customers/${id}`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

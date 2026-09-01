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
  const { searchParams } = new URL(req.url);
  const customerIdParam = searchParams.get('customerId');

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            ownerUserId: true,
          },
        },
        orders: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!conversation) {
      logRequest({
        method: 'GET',
        path: `/api/v1/conversations/${id}`,
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Conversation not found',
      });
      return errorResponse('NOT_FOUND', 'Conversation not found', 404);
    }

    const isOwner = Boolean(auth && auth.userId === conversation.business.ownerUserId);
    const isMatchingCustomer = Boolean(customerIdParam && customerIdParam === conversation.customerId);

    if (!isOwner && !isMatchingCustomer) {
      logRequest({
        method: 'GET',
        path: `/api/v1/conversations/${id}`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth?.userId,
        error: 'Forbidden: not authorized to view conversation',
      });
      return errorResponse('FORBIDDEN', 'not authorized to view this resource', 403);
    }

    logRequest({
      method: 'GET',
      path: `/api/v1/conversations/${id}`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth?.userId,
    });

    return successResponse(conversation);
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: `/api/v1/conversations/${id}`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth?.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

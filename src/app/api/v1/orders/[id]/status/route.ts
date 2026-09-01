import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const ALLOWED_STATUSES = ['draft', 'confirmed', 'paid', 'cancelled'] as const;

const updateStatusSchema = z.object({
  status: z.enum(ALLOWED_STATUSES, {
    message: 'Invalid status. Must be one of: draft, confirmed, paid, cancelled',
  }),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['confirmed', 'paid', 'cancelled'],
  confirmed: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!order) {
      logRequest({
        method: 'PATCH',
        path: `/api/v1/orders/${id}/status`,
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Order not found',
      });
      return errorResponse('NOT_FOUND', 'Order not found', 404);
    }

    // Auth is required — bearer token must be present
    if (!auth) {
      logRequest({
        method: 'PATCH',
        path: `/api/v1/orders/${id}/status`,
        status: 401,
        latencyMs: Date.now() - startTime,
        error: 'Unauthorized',
      });
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Only the business owner may update order status
    if (order.business.ownerUserId !== auth.userId) {
      logRequest({
        method: 'PATCH',
        path: `/api/v1/orders/${id}/status`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Forbidden: not business owner',
      });
      return errorResponse('FORBIDDEN', 'Only business owner or system can update order status', 403);
    }


    const body = await req.json().catch(() => ({}));
    const parseResult = updateStatusSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'PATCH',
        path: `/api/v1/orders/${id}/status`,
        status: 400,
        latencyMs: Date.now() - startTime,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const newStatus = parseResult.data.status;
    const currentStatus = order.status;

    if (currentStatus === newStatus) {
      return successResponse(order);
    }

    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(newStatus)) {
      logRequest({
        method: 'PATCH',
        path: `/api/v1/orders/${id}/status`,
        status: 400,
        latencyMs: Date.now() - startTime,
        error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
      });
      return errorResponse(
        'INVALID_TRANSITION',
        `Cannot transition order status from '${currentStatus}' to '${newStatus}'`,
        400
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    logRequest({
      method: 'PATCH',
      path: `/api/v1/orders/${id}/status`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth?.userId,
    });

    return successResponse(updatedOrder);
  } catch (err: any) {
    logRequest({
      method: 'PATCH',
      path: `/api/v1/orders/${id}/status`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth?.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

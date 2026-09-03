import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

// GET /api/v1/businesses/[id]/orders
// Lists orders for a business with filtering and pagination.
// Query params:
//   status    = draft | confirmed | paid | cancelled (optional, filter by status)
//   customerId = string (optional, filter by customer)
//   limit      = number (default 50, max 100)
//   offset     = number (default 0)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id: businessId } = await params;
  const path = `/api/v1/businesses/${businessId}/orders`;

  if (!auth) {
    logRequest({ method: 'GET', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  if (auth.businessId !== businessId) {
    logRequest({ method: 'GET', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
    return errorResponse('FORBIDDEN', 'You can only view orders for your own business', 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? undefined;
    const customerId = searchParams.get('customerId') ?? undefined;
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100);
    const offset = Number(searchParams.get('offset') ?? '0');

    const VALID_STATUSES = ['draft', 'confirmed', 'paid', 'cancelled'];
    if (status && !VALID_STATUSES.includes(status)) {
      return errorResponse('VALIDATION_ERROR', `status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    }

    const where: Record<string, any> = { businessId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, imageUrl: true } },
            },
          },
          customer: { select: { id: true, name: true, phone: true, email: true, channel: true } },
          conversation: { select: { id: true, status: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse({ orders, total, limit, offset });
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

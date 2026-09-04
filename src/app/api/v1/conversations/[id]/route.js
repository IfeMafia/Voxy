import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const updateConversationSchema = z.object({
  status: z.enum(['active', 'handed_off', 'closed']).optional(),
});

// GET /api/v1/conversations/[id]
// Auth: business owner OR customer (via ?customerId= query param)
export async function GET(req, context) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const params = await context.params;
  const id = params.id;
  const path = `/api/v1/conversations/${id}`;
  const { searchParams } = new URL(req.url);
  const customerIdParam = searchParams.get('customerId');

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true, channel: true },
        },
        business: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
        orders: {
          select: {
            id: true,
            status: true,
            totalKobo: true,
            currency: true,
            items: {
              select: { id: true, productId: true, quantity: true, unitPriceKobo: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      logRequest({ method: 'GET', path, status: 404, latencyMs: Date.now() - startTime, error: 'Conversation not found' });
      return errorResponse('NOT_FOUND', 'Conversation not found', 404);
    }

    const isOwner = Boolean(auth && auth.businessId === conversation.businessId);
    const isMatchingCustomer = Boolean(customerIdParam && customerIdParam === conversation.customerId);

    if (!isOwner && !isMatchingCustomer) {
      logRequest({ method: 'GET', path, status: 403, latencyMs: Date.now() - startTime, userId: auth?.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Not authorized to view this conversation', 403);
    }

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth?.businessId });
    return successResponse(conversation);
  } catch (err) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth?.businessId, error: err?.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

// PATCH /api/v1/conversations/[id] — update conversation status (business owner only)
export async function PATCH(req, context) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const params = await context.params;
  const id = params.id;
  const path = `/api/v1/conversations/${id}`;

  if (!auth) {
    logRequest({ method: 'PATCH', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const conversation = await prisma.conversation.findUnique({ where: { id } });

    if (!conversation) {
      logRequest({ method: 'PATCH', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Conversation not found' });
      return errorResponse('NOT_FOUND', 'Conversation not found', 404);
    }

    if (conversation.businessId !== auth.businessId) {
      logRequest({ method: 'PATCH', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Only business owner can update conversation status', 403);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = updateConversationSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'PATCH', path, status: 400, latencyMs: Date.now() - startTime, userId: auth.businessId, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: parseResult.data,
    });

    logRequest({ method: 'PATCH', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(updated);
  } catch (err) {
    logRequest({ method: 'PATCH', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err?.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

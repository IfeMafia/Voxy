import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const createConversationSchema = z.object({
  status: z.enum(['active', 'handed_off', 'closed']).optional().default('active'),
  initialMessages: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional().default([]),
});

// GET /api/v1/customers/[id]/conversations
// Returns all conversations for a customer (business owner only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id: customerId } = await params;
  const path = `/api/v1/customers/${customerId}/conversations`;

  if (!auth) {
    logRequest({ method: 'GET', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer) {
      logRequest({ method: 'GET', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Customer not found' });
      return errorResponse('NOT_FOUND', 'Customer not found', 404);
    }

    if (customer.businessId !== auth.businessId) {
      logRequest({ method: 'GET', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Only business owner can view customer conversations', 403);
    }

    const conversations = await prisma.conversation.findMany({
      where: { customerId, businessId: auth.businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          select: { id: true, status: true, totalKobo: true },
        },
      },
    });

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(conversations);
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

// POST /api/v1/customers/[id]/conversations — start a new conversation
// Called by the AI agent when a customer initiates a chat session
// No auth required — public (AI-facing)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: customerId } = await params;
  const path = `/api/v1/customers/${customerId}/conversations`;

  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer) {
      logRequest({ method: 'POST', path, status: 404, latencyMs: Date.now() - startTime, error: 'Customer not found' });
      return errorResponse('NOT_FOUND', 'Customer not found', 404);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = createConversationSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - startTime, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { status, initialMessages } = parseResult.data;

    const conversation = await prisma.conversation.create({
      data: {
        businessId: customer.businessId,
        customerId: customer.id,
        status,
        messages: initialMessages,
      },
    });

    logRequest({ method: 'POST', path, status: 201, latencyMs: Date.now() - startTime });
    return successResponse(conversation, 201);
  } catch (err: any) {
    logRequest({ method: 'POST', path, status: 500, latencyMs: Date.now() - startTime, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

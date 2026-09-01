import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const createConversationSchema = z.object({
  status: z.enum(['active', 'handed_off', 'closed']).optional().default('active'),
  initialMessages: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: customerId } = await params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      logRequest({
        method: 'POST',
        path: `/api/v1/customers/${customerId}/conversations`,
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Customer not found',
      });
      return errorResponse('NOT_FOUND', 'Customer not found', 404);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = createConversationSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'POST',
        path: `/api/v1/customers/${customerId}/conversations`,
        status: 400,
        latencyMs: Date.now() - startTime,
        error: issue.message,
      });
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

    logRequest({
      method: 'POST',
      path: `/api/v1/customers/${customerId}/conversations`,
      status: 201,
      latencyMs: Date.now() - startTime,
    });

    return successResponse(conversation, 201);
  } catch (err: any) {
    logRequest({
      method: 'POST',
      path: `/api/v1/customers/${customerId}/conversations`,
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

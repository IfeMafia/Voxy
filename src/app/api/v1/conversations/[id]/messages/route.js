import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const appendMessageSchema = z.object({
  role: z.string().min(1, { message: 'role is required' }),
  content: z.string().min(1, { message: 'content is required' }),
  sender: z.string().optional(),
});

export async function POST(req, context) {
  const startTime = Date.now();
  const params = await context.params;
  const conversationId = params.id;

  try {
    const [conversation, body] = await Promise.all([
      prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, messages: true },
      }),
      req.json().catch(() => ({})),
    ]);

    if (!conversation) {
      logRequest({
        method: 'POST',
        path: `/api/v1/conversations/${conversationId}/messages`,
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Conversation not found',
      });
      return errorResponse('NOT_FOUND', 'Conversation not found', 404);
    }

    const parseResult = appendMessageSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'POST',
        path: `/api/v1/conversations/${conversationId}/messages`,
        status: 400,
        latencyMs: Date.now() - startTime,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const isBusinessRole = parseResult.data.role === 'business';
    const isBusinessSender = body.sender === 'business' || isBusinessRole;

    const newMessage = {
      role: parseResult.data.role,
      content: parseResult.data.content,
      sender: isBusinessSender ? 'business' : (body.sender || (parseResult.data.role === 'user' ? 'customer' : 'assistant')),
      createdAt: new Date().toISOString(),
    };

    const currentMessages = Array.isArray(conversation.messages)
      ? conversation.messages
      : [];

    const updatedMessages = [...currentMessages, newMessage];

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messages: updatedMessages,
      },
    });

    if (!isBusinessSender && (parseResult.data.role === 'user' || body.sender === 'customer')) {
      try {
        const fullConv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { businessId: true, customerId: true, customer: { select: { name: true, phone: true } } }
        });
        if (fullConv?.businessId) {
          await prisma.alert.create({
            data: {
              businessId: fullConv.businessId,
              type: 'NEW_CUSTOMER_MESSAGE',
              title: `New message from ${fullConv.customer?.name || fullConv.customer?.phone || 'Customer'}`,
              message: parseResult.data.content.slice(0, 100),
              metadata: { conversationId, customerId: fullConv.customerId }
            }
          });
        }
      } catch {}
    }

    logRequest({
      method: 'POST',
      path: `/api/v1/conversations/${conversationId}/messages`,
      status: 200,
      latencyMs: Date.now() - startTime,
    });

    return successResponse(updatedConversation);
  } catch (err) {
    logRequest({
      method: 'POST',
      path: `/api/v1/conversations/${conversationId}/messages`,
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err?.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

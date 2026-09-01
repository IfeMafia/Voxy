import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const appendMessageSchema = z.object({
  role: z.string().min(1, { message: 'role is required' }),
  content: z.string().min(1, { message: 'content is required' }),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: conversationId } = await params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

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

    const body = await req.json().catch(() => ({}));
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

    const newMessage = {
      role: parseResult.data.role,
      content: parseResult.data.content,
      createdAt: new Date().toISOString(),
    };

    const currentMessages = Array.isArray(conversation.messages)
      ? (conversation.messages as Array<any>)
      : [];

    const updatedMessages = [...currentMessages, newMessage];

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messages: updatedMessages,
      },
    });

    logRequest({
      method: 'POST',
      path: `/api/v1/conversations/${conversationId}/messages`,
      status: 200,
      latencyMs: Date.now() - startTime,
    });

    return successResponse(updatedConversation);
  } catch (err: any) {
    logRequest({
      method: 'POST',
      path: `/api/v1/conversations/${conversationId}/messages`,
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

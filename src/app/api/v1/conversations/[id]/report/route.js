import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const reportSchema = z.object({
  messageContent: z.string().min(1, { message: 'messageContent is required' }),
  reason: z.string().optional(),
});

export async function POST(req, context) {
  const startTime = Date.now();
  const params = await context.params;
  const conversationId = params.id;

  try {
    const [conversation, body] = await Promise.all([
      prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, businessId: true, customerId: true },
      }),
      req.json().catch(() => ({})),
    ]);

    if (!conversation) {
      logRequest({
        method: 'POST',
        path: `/api/v1/conversations/${conversationId}/report`,
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Conversation not found',
      });
      return errorResponse('NOT_FOUND', 'Conversation not found', 404);
    }

    const parseResult = reportSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { messageContent, reason } = parseResult.data;

    let businessId = conversation.businessId;
    if (!businessId) {
      const firstBiz = await prisma.business.findFirst({ select: { id: true } });
      businessId = firstBiz?.id;
    }

    if (!businessId) {
      return errorResponse('NOT_FOUND', 'Business profile not found', 404);
    }

    // Create alert record for business
    const alert = await prisma.alert.create({
      data: {
        businessId,
        type: 'AI_RESPONSE_REPORT',
        title: `Reported AI Response in Conversation #${conversationId.slice(0, 8)}`,
        message: `Staff reported AI response: "${messageContent.slice(0, 100)}..." (Reason: ${reason || 'Inaccurate or unsatisfactory response'})`,
        metadata: {
          conversationId,
          customerId: conversation.customerId,
          messageContent,
          reason: reason || 'Reported by staff',
          reportedAt: new Date().toISOString(),
        },
      },
    });

    logRequest({
      method: 'POST',
      path: `/api/v1/conversations/${conversationId}/report`,
      status: 200,
      latencyMs: Date.now() - startTime,
    });

    return successResponse({ alertId: alert.id, message: 'Report submitted successfully' });
  } catch (err) {
    logRequest({
      method: 'POST',
      path: `/api/v1/conversations/${conversationId}/report`,
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err?.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

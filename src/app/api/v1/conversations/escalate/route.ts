import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';
import { OperationsService } from '@/lib/services/operations-service';
import { sendEscalationAlertEmail } from '@/lib/mailer';

const escalateSchema = z.object({
  conversationId: z.string().min(1, { message: 'conversationId is required' }),
  businessId: z.string().optional(),
  customerId: z.string().optional(),
  reason: z.string().optional().default('AI unable to fulfill request / Customer asked for human assistance'),
  lastMessage: z.string().optional(),
  urgency: z.enum(['normal', 'urgent']).optional().default('normal'),
});

// POST /api/v1/conversations/escalate
// Called by AI engine or frontend chat when human intervention is required
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const path = '/api/v1/conversations/escalate';

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = escalateSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - startTime, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { conversationId, reason, lastMessage, urgency } = parseResult.data;

    // Fetch conversation with business & customer
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        business: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    if (!conversation) {
      logRequest({ method: 'POST', path, status: 404, latencyMs: Date.now() - startTime, error: 'Conversation not found' });
      return errorResponse('NOT_FOUND', 'Conversation not found', 404);
    }

    const businessId = conversation.businessId;
    const customerId = conversation.customerId;

    // 1. Update conversation status to 'handed_off'
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'handed_off' },
    });

    // 2. Log Agent Activity
    await OperationsService.logAgentActivity({
      businessId,
      customerId,
      conversationId,
      action: 'CUSTOMER_ESCALATION',
      resourceType: 'conversation',
      resourceId: conversationId,
      initiator: 'AGENT',
      result: 'PENDING',
      details: { reason, lastMessage, urgency },
    });

    // 3. Create Alert for Dashboard & Notifications UI
    const alert = await OperationsService.createAlert({
      businessId,
      type: 'UNUSUAL_EVENT',
      title: urgency === 'urgent' ? '🚨 URGENT: Customer Escalation' : '🔔 Customer Assistance Requested',
      message: `Customer ${conversation.customer?.name || conversation.customer?.phone || 'Chat User'} requires assistance: "${reason}"`,
      metadata: {
        conversationId,
        customerId,
        reason,
        lastMessage,
        urgency,
      },
    });

    // 4. Create Audit Log
    await OperationsService.logAuditEvent({
      businessId,
      actorType: 'AGENT',
      action: 'CUSTOMER_ESCALATION',
      resourceType: 'conversation',
      resourceId: conversationId,
      metadata: { reason, urgency },
    });

    // 5. Send Email Alert to Business Owner
    let emailSent = false;
    if (conversation.business?.email) {
      try {
        await sendEscalationAlertEmail({
          to: conversation.business.email,
          businessName: conversation.business.name,
          customerName: conversation.customer?.name,
          customerPhone: conversation.customer?.phone,
          customerEmail: conversation.customer?.email,
          reason,
          conversationId,
          lastMessage,
          urgency,
        });
        emailSent = true;
      } catch (emailErr: any) {
        console.warn(`[Escalation] Could not send email notification to ${conversation.business.email}: ${emailErr.message}`);
      }
    }

    logRequest({ method: 'POST', path, status: 200, latencyMs: Date.now() - startTime });
    return successResponse({
      conversation: updatedConversation,
      escalatedAt: new Date().toISOString(),
      alertId: alert.id,
      emailSent,
      message: 'Escalation recorded successfully. Business owner notified via dashboard alerts and email.',
    });
  } catch (err: any) {
    logRequest({ method: 'POST', path, status: 500, latencyMs: Date.now() - startTime, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

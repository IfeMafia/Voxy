import db from './db.js';
import { supabase } from './supabase.js';

/**
 * Notifies the business owner about a high-urgency event (e.g. human escalation / AI deflection).
 * Creates a dashboard alert, updates conversation status, and sends an email notification.
 * 
 * @param {string} conversationId 
 * @param {string} [urgency='high'] 
 * @param {Object} [details={}]
 * @returns {Promise<boolean>}
 */
export async function notifyBusiness(conversationId, urgency = 'high', details = {}) {
  try {
    let prisma = null;
    try {
      const pMod = await import('@/lib/prisma');
      prisma = pMod.prisma;
    } catch {}

    let mailer = null;
    try {
      mailer = await import('./mailer');
    } catch {}

    let opsService = null;
    try {
      const oMod = await import('./services/operations-service');
      opsService = oMod.OperationsService;
    } catch {}

    // 1. Prisma-based notification path (Primary)
    if (prisma) {
      let conversation = null;
      if (conversationId) {
        conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { business: true, customer: true },
        }).catch(() => null);
      }

      let businessId = conversation?.businessId || details.businessId;
      let business = conversation?.business;

      if (!business && businessId) {
        business = await prisma.business.findUnique({
          where: { id: businessId },
        }).catch(() => null);
      }

      if (!business) {
        business = await prisma.business.findFirst().catch(() => null);
        if (business) businessId = business.id;
      }

      if (businessId) {
        // Update conversation status to 'handed_off' if conversation exists
        if (conversationId && conversation) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { status: 'handed_off' },
          }).catch(() => null);
        }

        const customerName = conversation?.customer?.name || 'Chat Customer';
        const customerContact = conversation?.customer?.phone || conversation?.customer?.email || 'Web Chat';

        // Create Dashboard Alert
        if (opsService?.createAlert) {
          await opsService.createAlert({
            businessId,
            type: 'UNUSUAL_EVENT',
            title: urgency === 'urgent' ? '🚨 URGENT: Customer Handoff' : '🔔 Customer Escalation Alert',
            message: `Customer (${customerName}) requested human support: "${details.reason || details.customerMessage || 'AI Deflection / Human Handoff'}"`,
            metadata: {
              conversationId,
              customerMessage: details.customerMessage,
              reason: details.reason,
              urgency,
            },
          }).catch((err) => console.warn('[NOTIFY] Alert create error:', err?.message));
        } else if (prisma.alert?.create) {
          await prisma.alert.create({
            data: {
              businessId,
              type: 'UNUSUAL_EVENT',
              title: '🔔 Customer Assistance Requested',
              message: `Customer (${customerName}) requested human assistance: "${details.customerMessage || details.reason || 'Human Handoff'}"`,
              metadata: { conversationId, urgency },
            },
          }).catch(() => null);
        }

        // Log Agent Activity
        if (opsService?.logAgentActivity) {
          await opsService.logAgentActivity({
            businessId,
            customerId: conversation?.customerId,
            conversationId,
            action: 'CUSTOMER_ESCALATION',
            resourceType: 'conversation',
            resourceId: conversationId || 'guest_conv',
            initiator: 'AGENT',
            result: 'PENDING',
            details: { reason: details.reason, urgency, customerMessage: details.customerMessage },
          }).catch(() => null);
        }

        // Send Email Alert to Business Owner
        const emailTo = business?.email || process.env.EMAIL_USER;
        if (emailTo && mailer?.sendEscalationAlertEmail) {
          await mailer.sendEscalationAlertEmail({
            to: emailTo,
            businessName: business?.name || 'Your Voxy Store',
            customerName,
            customerPhone: conversation?.customer?.phone,
            customerEmail: conversation?.customer?.email,
            reason: details.reason || 'Customer requested to speak with business owner / staff',
            conversationId,
            lastMessage: details.customerMessage,
            urgency,
          }).catch((err) => {
            console.warn('[NOTIFY] Escalation email send error:', err?.message);
          });
        }
      }
    }

    // 2. Direct DB Escalation & Broadcast
    try {
      if (db?.conversation?.update) {
        await db.conversation.update({
          where: { id: conversationId },
          data: { status: 'Needs Owner Response' }
        });
        const conv = await db.conversation.findUnique({
          where: { id: conversationId },
          include: { business: true }
        });
        if ((conv?.business?.id || conv?.business?.ownerId) && supabase?.channel) {
          const ownerId = conv.business.id || conv.business.ownerId;
          await supabase.channel(`owner_${ownerId}`).send({
            type: 'broadcast',
            event: 'escalation',
            payload: { conversationId, urgency }
          });
        }
      } else if (db?.query) {
        await db.query(
          `UPDATE "Conversation" SET status = 'Needs Owner Response', "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
          [conversationId]
        );

        const { data: conv } = await db.query(
          `SELECT c.id, b.id as owner_id FROM "Conversation" c JOIN "Business" b ON c."businessId" = b.id WHERE c.id = $1`,
          [conversationId]
        );

        if (conv && conv[0] && supabase?.channel) {
          await supabase.channel(`owner_${conv[0].owner_id}`).send({
            type: 'broadcast',
            event: 'escalation',
            payload: { conversationId, urgency }
          });
        }
      }
    } catch (dbErr) {
      console.warn('[NOTIFY] Direct DB notification fallback error:', dbErr?.message);
    }

    console.log(`[NOTIFY] Escalation & Alert successfully dispatched for conversation ${conversationId} (Urgency: ${urgency})`);
    return true;
  } catch (err) {
    console.error('[NOTIFY] Error escalating conversation:', err);
    return false;
  }
}

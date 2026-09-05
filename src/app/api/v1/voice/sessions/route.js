import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { randomUUID } from 'crypto';

// In-memory active voice session registry for fast runtime tracking
const activeVoiceSessions = new Map();

/**
 * POST /api/v1/voice/sessions
 * Create and start a new voice session
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { businessId, conversationId: providedConvId, customerId: providedCustId, customerName, voice } = body;

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'businessId is required and must be a string' },
        { status: 400 }
      );
    }

    // Verify business exists if Prisma is available
    let business = null;
    if (prisma?.business?.findUnique) {
      try {
        business = await prisma.business.findUnique({
          where: { id: businessId },
          select: { id: true, name: true, aiConfig: true }
        });
      } catch (err) {
        console.warn('[VoiceSessions] Business DB lookup warning:', err?.message);
      }
    }

    // Auth check: if request carries auth header, verify user owns or has access to businessId
    const authUser = getAuthUser(req);
    if (authUser && authUser.businessId && authUser.businessId !== businessId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Cross-business voice session access denied' },
        { status: 403 }
      );
    }

    // Resolve or create Conversation
    let conversationId = providedConvId;
    let customerId = providedCustId;

    if (!conversationId && prisma?.conversation?.create) {
      try {
        if (!customerId && prisma?.customer?.create) {
          const cust = await prisma.customer.create({
            data: {
              businessId,
              channel: 'voice',
              name: customerName || 'Voice Customer'
            }
          });
          customerId = cust.id;
        }

        if (customerId) {
          const conv = await prisma.conversation.create({
            data: {
              businessId,
              customerId,
              status: 'active',
              messages: []
            }
          });
          conversationId = conv.id;
        }
      } catch (dbErr) {
        console.warn('[VoiceSessions] DB fallback for session creation:', dbErr?.message);
      }
    }

    if (!conversationId) {
      conversationId = `conv_voice_${randomUUID()}`;
    }

    const sessionId = `vses_${randomUUID()}`;
    const sessionData = {
      id: sessionId,
      businessId,
      conversationId,
      customerId: customerId || null,
      status: 'ACTIVE',
      provider: process.env.YARNGPT_API_KEY ? 'yarngpt' : 'hybrid',
      voice: voice || business?.aiConfig?.voice || 'Chinenye',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    activeVoiceSessions.set(sessionId, sessionData);

    // Audit log if business & DB present
    if (prisma?.auditLog?.create) {
      prisma.auditLog.create({
        data: {
          businessId,
          actorType: authUser ? 'BUSINESS_USER' : 'CUSTOMER',
          actorId: authUser?.email || customerId || 'anonymous_voice_caller',
          action: 'voice_session_created',
          resourceType: 'voice_session',
          resourceId: sessionId,
          metadata: { provider: sessionData.provider, conversationId }
        }
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      session: sessionData
    });
  } catch (error) {
    console.error('[VoiceSessions Error]:', error?.message);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create voice session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/voice/sessions?sessionId=xxx
 * Get status of an active voice session
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: 'sessionId query parameter is required' },
      { status: 400 }
    );
  }

  const session = activeVoiceSessions.get(sessionId);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Voice session not found or expired' },
      { status: 404 }
    );
  }

  const authUser = getAuthUser(req);
  if (authUser && authUser.businessId && authUser.businessId !== session.businessId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized cross-business session query' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    session
  });
}

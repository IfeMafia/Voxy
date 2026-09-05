import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

// GET /api/v1/businesses/[id]/conversations
// Batch fetch conversations for a business with customer relation in 1 query
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id: businessId } = await params;
  const path = `/api/v1/businesses/${businessId}/conversations`;

  // Verify business ownership if auth token is present
  if (auth && auth.businessId && auth.businessId !== businessId) {
    logRequest({ method: 'GET', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
    return errorResponse('FORBIDDEN', 'Access denied', 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? undefined;
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100);

    const where: Record<string, any> = { businessId };
    if (status && status !== 'all') {
      where.status = status;
    }

    let conversations: any[] = [];
    try {
      conversations = await prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              channel: true,
            },
          },
        },
      });
    } catch (relationErr) {
      console.warn('[ConversationsRoute] Fallback query without customer include:', relationErr);
      const rawConvs = await prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      conversations = await Promise.all(
        rawConvs.map(async (conv) => {
          let cust = null;
          if (conv.customerId) {
            cust = await prisma.customer.findUnique({
              where: { id: conv.customerId },
              select: { id: true, name: true, phone: true, email: true, channel: true },
            }).catch(() => null);
          }
          return {
            ...conv,
            customer: cust || { id: conv.customerId || 'guest', name: 'Guest Customer', phone: null, email: null, channel: 'web_chat' },
          };
        })
      );
    }

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth?.businessId });
    return successResponse(conversations);
  } catch (err: any) {
    console.error('[ConversationsRoute] Error fetching conversations:', err);
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, error: err.message });
    return successResponse([]); // Return empty list instead of crashing UI with 500
  }
}

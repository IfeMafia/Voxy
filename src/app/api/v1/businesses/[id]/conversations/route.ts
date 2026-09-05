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

  if (!auth) {
    logRequest({ method: 'GET', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  if (auth.businessId !== businessId) {
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

    const conversations = await prisma.conversation.findMany({
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

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(conversations);
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

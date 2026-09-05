import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

// PATCH /api/v1/business/alerts/[id] — Mark alert as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/business/alerts/${id}`;

  if (!auth) {
    logRequest({ method: 'PATCH', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const alert = await prisma.alert.findUnique({ where: { id } });

    if (!alert) {
      logRequest({ method: 'PATCH', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Alert not found' });
      return errorResponse('NOT_FOUND', 'Alert not found', 404);
    }

    if (alert.businessId !== auth.businessId) {
      logRequest({ method: 'PATCH', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Not authorized to modify this alert', 403);
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });

    logRequest({ method: 'PATCH', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(updated);
  } catch (err: any) {
    logRequest({ method: 'PATCH', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, comparePassword, hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const schema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters' }),
});

export async function POST(req) {
  const startTime = Date.now();
  const auth = getAuthUser(req);

  if (!auth) {
    logRequest({
      method: 'POST',
      path: '/api/v1/auth/change-password',
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Missing or invalid token',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = schema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { currentPassword, newPassword } = parseResult.data;

    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
    });

    if (!business) {
      return errorResponse('NOT_FOUND', 'Business account not found', 404);
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, business.passwordHash);
    if (!isMatch) {
      logRequest({
        method: 'POST',
        path: '/api/v1/auth/change-password',
        status: 400,
        latencyMs: Date.now() - startTime,
        userId: auth.businessId,
        error: 'Current password incorrect',
      });
      return errorResponse('INVALID_PASSWORD', 'Current password is incorrect', 400);
    }

    // Update to new hashed password
    const passwordHash = await hashPassword(newPassword);
    await prisma.business.update({
      where: { id: business.id },
      data: { passwordHash },
    });

    logRequest({
      method: 'POST',
      path: '/api/v1/auth/change-password',
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: business.id,
    });

    return successResponse({
      message: 'Password updated successfully',
    });
  } catch (err) {
    logRequest({
      method: 'POST',
      path: '/api/v1/auth/change-password',
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.businessId,
      error: err?.message,
    });
    return errorResponse('SERVER_ERROR', 'Failed to update password', 500);
  }
}

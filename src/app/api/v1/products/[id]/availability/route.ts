import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean().optional(),
  stockQuantity: z.number().int().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id: productId } = await params;

  if (!auth) {
    logRequest({
      method: 'PATCH',
      path: `/api/v1/products/${productId}/availability`,
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Unauthorized',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      logRequest({
        method: 'PATCH',
        path: `/api/v1/products/${productId}/availability`,
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.businessId,
        error: 'Product not found',
      });
      return errorResponse('NOT_FOUND', 'Product not found', 404);
    }

    if (product.businessId !== auth.businessId) {
      logRequest({
        method: 'PATCH',
        path: `/api/v1/products/${productId}/availability`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth.businessId,
        error: 'Forbidden: not business owner',
      });
      return errorResponse('FORBIDDEN', 'Only business owner can toggle product availability', 403);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = toggleAvailabilitySchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'PATCH',
        path: `/api/v1/products/${productId}/availability`,
        status: 400,
        latencyMs: Date.now() - startTime,
        userId: auth.businessId,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: parseResult.data,
    });

    logRequest({
      method: 'PATCH',
      path: `/api/v1/products/${productId}/availability`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth.businessId,
    });

    return successResponse(updated);
  } catch (err: any) {
    logRequest({
      method: 'PATCH',
      path: `/api/v1/products/${productId}/availability`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.businessId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

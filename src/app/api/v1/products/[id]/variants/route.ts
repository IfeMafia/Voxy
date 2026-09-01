import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const createVariantSchema = z.object({
  name: z.string().min(1, { message: 'Variant name is required' }),
  priceCents: z.number().int().min(0).optional().nullable(),
  stockQuantity: z.number().int().optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id: productId } = await params;

  if (!auth) {
    logRequest({
      method: 'POST',
      path: `/api/v1/products/${productId}/variants`,
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Unauthorized',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { business: true },
    });

    if (!product) {
      logRequest({
        method: 'POST',
        path: `/api/v1/products/${productId}/variants`,
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Product not found',
      });
      return errorResponse('NOT_FOUND', 'Product not found', 404);
    }

    if (product.business.ownerUserId !== auth.userId) {
      logRequest({
        method: 'POST',
        path: `/api/v1/products/${productId}/variants`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Forbidden: not business owner',
      });
      return errorResponse('FORBIDDEN', 'Only business owner can create product variants', 403);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = createVariantSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'POST',
        path: `/api/v1/products/${productId}/variants`,
        status: 400,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const data = parseResult.data;

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name: data.name,
        priceCents: data.priceCents !== undefined ? data.priceCents : null,
        stockQuantity: data.stockQuantity !== undefined ? data.stockQuantity : null,
      },
    });

    logRequest({
      method: 'POST',
      path: `/api/v1/products/${productId}/variants`,
      status: 201,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
    });

    return successResponse(variant, 201);
  } catch (err: any) {
    logRequest({
      method: 'POST',
      path: `/api/v1/products/${productId}/variants`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

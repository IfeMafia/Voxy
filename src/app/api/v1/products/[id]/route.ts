import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().min(0).optional(),
  currency: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  isAvailable: z.boolean().optional(),
  stockQuantity: z.number().int().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    if (!product) {
      logRequest({
        method: 'GET',
        path: `/api/v1/products/${id}`,
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Product not found',
      });
      return errorResponse('NOT_FOUND', 'Product not found', 404);
    }

    logRequest({
      method: 'GET',
      path: `/api/v1/products/${id}`,
      status: 200,
      latencyMs: Date.now() - startTime,
    });

    return successResponse(product);
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: `/api/v1/products/${id}`,
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;

  if (!auth) {
    logRequest({
      method: 'PATCH',
      path: `/api/v1/products/${id}`,
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Unauthorized',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!product) {
      logRequest({
        method: 'PATCH',
        path: `/api/v1/products/${id}`,
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Product not found',
      });
      return errorResponse('NOT_FOUND', 'Product not found', 404);
    }

    if (product.business.ownerUserId !== auth.userId) {
      logRequest({
        method: 'PATCH',
        path: `/api/v1/products/${id}`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Forbidden: not business owner',
      });
      return errorResponse('FORBIDDEN', 'Only business owner can update products', 403);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = updateProductSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'PATCH',
        path: `/api/v1/products/${id}`,
        status: 400,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: parseResult.data,
      include: { variants: true },
    });

    logRequest({
      method: 'PATCH',
      path: `/api/v1/products/${id}`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
    });

    return successResponse(updated);
  } catch (err: any) {
    logRequest({
      method: 'PATCH',
      path: `/api/v1/products/${id}`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;

  if (!auth) {
    logRequest({
      method: 'DELETE',
      path: `/api/v1/products/${id}`,
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Unauthorized',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!product) {
      logRequest({
        method: 'DELETE',
        path: `/api/v1/products/${id}`,
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Product not found',
      });
      return errorResponse('NOT_FOUND', 'Product not found', 404);
    }

    if (product.business.ownerUserId !== auth.userId) {
      logRequest({
        method: 'DELETE',
        path: `/api/v1/products/${id}`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Forbidden: not business owner',
      });
      return errorResponse('FORBIDDEN', 'Only business owner can delete products', 403);
    }

    // Soft-delete: isAvailable = false (never hard-delete per T5 rule)
    const softDeleted = await prisma.product.update({
      where: { id },
      data: { isAvailable: false },
      include: { variants: true },
    });

    logRequest({
      method: 'DELETE',
      path: `/api/v1/products/${id}`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
    });

    return successResponse(softDeleted);
  } catch (err: any) {
    logRequest({
      method: 'DELETE',
      path: `/api/v1/products/${id}`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

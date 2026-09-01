import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const createProductSchema = z.object({
  name: z.string().min(1, { message: 'Product name is required' }),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().min(0, { message: 'priceCents must be a non-negative integer' }),
  currency: z.string().optional().default('NGN'),
  imageUrl: z.string().optional().nullable(),
  isAvailable: z.boolean().optional().default(true),
  stockQuantity: z.number().int().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id: businessId } = await params;

  if (!auth) {
    logRequest({
      method: 'POST',
      path: `/api/v1/businesses/${businessId}/products`,
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Unauthorized',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      logRequest({
        method: 'POST',
        path: `/api/v1/businesses/${businessId}/products`,
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Business not found',
      });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    if (business.ownerUserId !== auth.userId) {
      logRequest({
        method: 'POST',
        path: `/api/v1/businesses/${businessId}/products`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Forbidden: not business owner',
      });
      return errorResponse('FORBIDDEN', 'Only business owner can create products', 403);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = createProductSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'POST',
        path: `/api/v1/businesses/${businessId}/products`,
        status: 400,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const data = parseResult.data;

    const product = await prisma.product.create({
      data: {
        businessId,
        name: data.name,
        description: data.description || null,
        priceCents: data.priceCents,
        currency: data.currency,
        imageUrl: data.imageUrl || null,
        isAvailable: data.isAvailable,
        stockQuantity: data.stockQuantity !== undefined ? data.stockQuantity : null,
        tags: data.tags,
      },
      include: {
        variants: true,
      },
    });

    logRequest({
      method: 'POST',
      path: `/api/v1/businesses/${businessId}/products`,
      status: 201,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
    });

    return successResponse(product, 201);
  } catch (err: any) {
    logRequest({
      method: 'POST',
      path: `/api/v1/businesses/${businessId}/products`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id: businessId } = await params;

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      logRequest({
        method: 'GET',
        path: `/api/v1/businesses/${businessId}/products`,
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Business not found',
      });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    const isOwner = auth?.userId === business.ownerUserId;
    const whereClause = isOwner
      ? { businessId }
      : { businessId, isAvailable: true };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${businessId}/products`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth?.userId,
    });

    return successResponse(products);
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${businessId}/products`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth?.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

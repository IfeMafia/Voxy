import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const createProductSchema = z.object({
  name: z.string().min(1, { message: 'Product name is required' }),
  description: z.string().optional().nullable(),
  priceKobo: z.number().int().min(0, { message: 'Price must be 0 or more' }),
  discountKobo: z.number().int().min(0).optional().default(0),
  currency: z.string().optional().default('NGN'),
  imageUrl: z.string().url().optional().nullable(),
  isAvailable: z.boolean().optional().default(true),
  stockQuantity: z.number().int().min(0).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

// GET /api/v1/businesses/[id]/products
// Public endpoint — supports search, filter by tag, availability, pagination
// Used by AI agent and frontend catalog
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: businessId } = await params;
  const path = `/api/v1/businesses/${businessId}/products`;
  const { searchParams } = new URL(req.url);

  const search = searchParams.get('q') ?? undefined;
  const tag = searchParams.get('tag') ?? undefined;
  const availableOnly = searchParams.get('available') === 'true'; // default: false (return all products including out-of-stock)
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100);
  const offset = Number(searchParams.get('offset') ?? '0');

  try {
    const where: Record<string, any> = { businessId };

    if (availableOnly) {
      where.isAvailable = true;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ]);

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime });
    return successResponse({ products, total, limit, offset });
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

// POST /api/v1/businesses/[id]/products — create a new product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id: businessId } = await params;
  const path = `/api/v1/businesses/${businessId}/products`;

  if (!auth) {
    logRequest({ method: 'POST', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  if (auth.businessId !== businessId) {
    logRequest({ method: 'POST', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden: not business owner' });
    return errorResponse('FORBIDDEN', 'Only the business owner can add products', 403);
  }

  try {
    const business = await prisma.business.findUnique({ where: { id: businessId } });

    if (!business) {
      logRequest({ method: 'POST', path, status: 404, latencyMs: Date.now() - startTime, error: 'Business not found' });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = createProductSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - startTime, userId: auth.businessId, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const product = await prisma.product.create({
      data: {
        businessId,
        ...parseResult.data,
      },
    });

    logRequest({ method: 'POST', path, status: 201, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(product, 201);
  } catch (err: any) {
    logRequest({ method: 'POST', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

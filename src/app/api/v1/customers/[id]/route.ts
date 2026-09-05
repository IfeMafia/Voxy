import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const updateCustomerSchema = z.object({
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  channel: z.enum(['web_chat', 'voice']).optional(),
});

// GET /api/v1/customers/[id]
// Auth: business owner who owns this customer
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/customers/${id}`;

  if (!auth) {
    logRequest({ method: 'GET', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            totalKobo: true,
            currency: true,
            createdAt: true,
            items: {
              include: {
                product: { select: { id: true, name: true, priceKobo: true, imageUrl: true } },
              },
            },
            receipt: { select: { receiptNumber: true, receiptData: true } },
          },
        },
      },
    });

    if (!customer) {
      logRequest({ method: 'GET', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Customer not found' });
      return errorResponse('NOT_FOUND', 'Customer not found', 404);
    }

    if (customer.businessId !== auth.businessId) {
      logRequest({ method: 'GET', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Only business owner can view customer detail', 403);
    }

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(customer);
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

// PATCH /api/v1/customers/[id] — update customer profile
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/customers/${id}`;

  if (!auth) {
    logRequest({ method: 'PATCH', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      logRequest({ method: 'PATCH', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Customer not found' });
      return errorResponse('NOT_FOUND', 'Customer not found', 404);
    }

    if (customer.businessId !== auth.businessId) {
      logRequest({ method: 'PATCH', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
      return errorResponse('FORBIDDEN', 'Only business owner can update customer detail', 403);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = updateCustomerSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'PATCH', path, status: 400, latencyMs: Date.now() - startTime, userId: auth.businessId, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { email, ...rest } = parseResult.data;
    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...rest,
        ...(email !== undefined && { email: email ? email.toLowerCase() : null }),
      },
    });

    logRequest({ method: 'PATCH', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(updated);
  } catch (err: any) {
    logRequest({ method: 'PATCH', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

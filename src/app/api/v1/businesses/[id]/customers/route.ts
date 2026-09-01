import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const customerUpsertSchema = z.object({
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  channel: z.enum(['web_chat', 'voice']).optional().default('web_chat'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: businessId } = await params;

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      logRequest({
        method: 'POST',
        path: `/api/v1/businesses/${businessId}/customers`,
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Business not found',
      });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = customerUpsertSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'POST',
        path: `/api/v1/businesses/${businessId}/customers`,
        status: 400,
        latencyMs: Date.now() - startTime,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { name, phone, email, channel } = parseResult.data;

    let existingCustomer = null;

    if (email) {
      existingCustomer = await prisma.customer.findFirst({
        where: { businessId, email: email.toLowerCase() },
      });
    }

    if (!existingCustomer && phone) {
      existingCustomer = await prisma.customer.findFirst({
        where: { businessId, phone },
      });
    }

    let customer;
    if (existingCustomer) {
      customer = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: name || existingCustomer.name,
          phone: phone || existingCustomer.phone,
          email: email ? email.toLowerCase() : existingCustomer.email,
          channel: channel || existingCustomer.channel,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          businessId,
          name: name || null,
          phone: phone || null,
          email: email ? email.toLowerCase() : null,
          channel,
        },
      });
    }

    logRequest({
      method: 'POST',
      path: `/api/v1/businesses/${businessId}/customers`,
      status: existingCustomer ? 200 : 201,
      latencyMs: Date.now() - startTime,
    });

    return successResponse(customer, existingCustomer ? 200 : 201);
  } catch (err: any) {
    logRequest({
      method: 'POST',
      path: `/api/v1/businesses/${businessId}/customers`,
      status: 500,
      latencyMs: Date.now() - startTime,
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

  if (!auth) {
    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${businessId}/customers`,
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
        method: 'GET',
        path: `/api/v1/businesses/${businessId}/customers`,
        status: 404,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Business not found',
      });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    if (business.ownerUserId !== auth.userId) {
      logRequest({
        method: 'GET',
        path: `/api/v1/businesses/${businessId}/customers`,
        status: 403,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: 'Forbidden: not business owner',
      });
      return errorResponse('FORBIDDEN', 'Only business owner can view customer list', 403);
    }

    const customers = await prisma.customer.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${businessId}/customers`,
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
    });

    return successResponse(customers);
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/${businessId}/customers`,
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

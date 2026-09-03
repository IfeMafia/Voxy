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

// Helper for route protection to keep code DRY
async function validateAuth(req: NextRequest, businessId: string) {
  const auth = await getAuthUser(req); // Await if async in your lib
  if (!auth) return { error: errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401), status: 401 };
  if (auth.businessId !== businessId) return { error: errorResponse('FORBIDDEN', 'Access denied', 403), status: 403 };
  return { auth };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: businessId } = await params;
  const path = `/api/v1/businesses/${businessId}/customers`;

  // 1. Auth Guard (Fixed Security Vulnerability)
  const { error, status } = await validateAuth(req, businessId);
  if (error) {
    logRequest({ method: 'POST', path, status: status!, latencyMs: Date.now() - startTime, error: 'Unauthorized/Forbidden' });
    return error;
  }

  try {
    // 2. Validate Business Existence
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      logRequest({ method: 'POST', path, status: 404, latencyMs: Date.now() - startTime, error: 'Business not found' });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    // 3. Parse Body
    const body = await req.json().catch(() => ({}));
    const parseResult = customerUpsertSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - startTime, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { name, phone, email, channel } = parseResult.data;
    const normalizedEmail = email ? email.toLowerCase() : undefined;

    // 4. Atomic Search to find match safely
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        businessId,
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    // 5. Explicitly map data to preserve null vs undefined values
    const updateData = {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(normalizedEmail !== undefined && { email: normalizedEmail }),
      ...(channel !== undefined && { channel }),
    };

    const createData = {
      businessId,
      name: name ?? null,
      phone: phone ?? null,
      email: normalizedEmail ?? null,
      channel,
    };

    // 6. Safe database execution
    let customer;
    let isUpdate = false;

    if (existingCustomer) {
      isUpdate = true;
      customer = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: updateData,
      });
    } else {
      customer = await prisma.customer.create({
        data: createData,
      });
    }

    const resStatus = isUpdate ? 200 : 201;
    logRequest({ method: 'POST', path, status: resStatus, latencyMs: Date.now() - startTime });
    return successResponse(customer, resStatus);

  } catch (err: any) {
    logRequest({ method: 'POST', path, status: 500, latencyMs: Date.now() - startTime, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: businessId } = await params;
  const path = `/api/v1/businesses/${businessId}/customers`;

  const { error, status, auth } = await validateAuth(req, businessId);
  if (error) {
    logRequest({ method: 'GET', path, status: status!, latencyMs: Date.now() - startTime, error: 'Unauthorized/Forbidden' });
    return error;
  }

  try {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      logRequest({ method: 'GET', path, status: 404, latencyMs: Date.now() - startTime, userId: auth?.businessId, error: 'Business not found' });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    const customers = await prisma.customer.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth?.businessId });
    return successResponse(customers);
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth?.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

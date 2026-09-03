import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

// Full business profile update — covers T4 profile, hours, policies, delivery, languages, AI config
const updateBusinessSchema = z.object({
  // Identity
  name: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  // Address
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional().nullable(),
  // Social
  socialLinks: z.object({
    whatsapp: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    website: z.string().optional(),
  }).optional().nullable(),
  // Operations
  hours: z.record(z.string(), z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().optional(),
  })).optional().nullable(),
  policies: z.string().optional().nullable(),
  deliveryInfo: z.string().optional().nullable(),
  supportedLanguages: z.array(z.string().min(2)).optional(),
  // AI
  aiConfig: z.object({
    persona: z.string().optional(),
    tone: z.string().optional(),
    rules: z.array(z.string()).optional(),
    permittedActions: z.array(z.string()).optional(),
    escalationTriggers: z.array(z.string()).optional(),
    greeting: z.string().optional(),
    fallbackMessage: z.string().optional(),
  }).optional().nullable(),
});

const BUSINESS_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  description: true,
  category: true,
  contactPhone: true,
  address: true,
  socialLinks: true,
  hours: true,
  policies: true,
  deliveryInfo: true,
  supportedLanguages: true,
  createdAt: true,
  updatedAt: true,
} as const;

const BUSINESS_OWNER_SELECT = {
  ...BUSINESS_PUBLIC_SELECT,
  email: true,
  isVerified: true,
  aiConfig: true,
} as const;

// GET /api/v1/businesses/[id] — owner only, returns full profile including aiConfig
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/businesses/${id}`;

  if (!auth) {
    logRequest({ method: 'GET', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  if (auth.businessId !== id) {
    logRequest({ method: 'GET', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
    return errorResponse('FORBIDDEN', 'You do not have access to this business', 403);
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id },
      select: BUSINESS_OWNER_SELECT,
    });

    if (!business) {
      logRequest({ method: 'GET', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Business not found' });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    logRequest({ method: 'GET', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(business);
  } catch (err: any) {
    logRequest({ method: 'GET', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

// PATCH /api/v1/businesses/[id] — update any combination of profile fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/businesses/${id}`;

  if (!auth) {
    logRequest({ method: 'PATCH', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  if (auth.businessId !== id) {
    logRequest({ method: 'PATCH', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden: not business owner' });
    return errorResponse('FORBIDDEN', 'Only the business owner can update business settings', 403);
  }

  try {
    const business = await prisma.business.findUnique({ where: { id } });

    if (!business) {
      logRequest({ method: 'PATCH', path, status: 404, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Business not found' });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = updateBusinessSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({ method: 'PATCH', path, status: 400, latencyMs: Date.now() - startTime, userId: auth.businessId, error: issue.message });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const updated = await prisma.business.update({
      where: { id },
      data: parseResult.data,
      select: BUSINESS_OWNER_SELECT,
    });

    logRequest({ method: 'PATCH', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse(updated);
  } catch (err: any) {
    logRequest({ method: 'PATCH', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

// DELETE /api/v1/businesses/[id] — permanently delete business account
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const auth = getAuthUser(req);
  const { id } = await params;
  const path = `/api/v1/businesses/${id}`;

  if (!auth) {
    logRequest({ method: 'DELETE', path, status: 401, latencyMs: Date.now() - startTime, error: 'Unauthorized' });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  if (auth.businessId !== id) {
    logRequest({ method: 'DELETE', path, status: 403, latencyMs: Date.now() - startTime, userId: auth.businessId, error: 'Forbidden' });
    return errorResponse('FORBIDDEN', 'Only the business owner can delete this account', 403);
  }

  try {
    await prisma.business.delete({ where: { id } });

    logRequest({ method: 'DELETE', path, status: 200, latencyMs: Date.now() - startTime, userId: auth.businessId });
    return successResponse({ deleted: true, id });
  } catch (err: any) {
    logRequest({ method: 'DELETE', path, status: 500, latencyMs: Date.now() - startTime, userId: auth.businessId, error: err.message });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

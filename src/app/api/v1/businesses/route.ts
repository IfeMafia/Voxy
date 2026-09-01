import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateUniqueSlug } from '@/lib/slug';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const createBusinessSchema = z.object({
  name: z.string().min(1, { message: 'Business name is required' }),
  slug: z.string().optional(),
  description: z.string().optional(),
  hours: z.any().optional(),
  policies: z.string().optional(),
  deliveryInfo: z.string().optional(),
  supportedLanguages: z.array(z.string()).optional(),
  aiConfig: z.any().optional(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const auth = getAuthUser(req);

  if (!auth) {
    logRequest({
      method: 'POST',
      path: '/api/v1/businesses',
      status: 401,
      latencyMs: Date.now() - startTime,
      error: 'Unauthorized',
    });
    return errorResponse('UNAUTHORIZED', 'Invalid or missing access token', 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = createBusinessSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'POST',
        path: '/api/v1/businesses',
        status: 400,
        latencyMs: Date.now() - startTime,
        userId: auth.userId,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const data = parseResult.data;
    const finalSlug = await generateUniqueSlug(data.name, data.slug);

    const business = await prisma.business.create({
      data: {
        ownerUserId: auth.userId,
        name: data.name,
        slug: finalSlug,
        description: data.description || null,
        hours: data.hours !== undefined ? data.hours : null,
        policies: data.policies || null,
        deliveryInfo: data.deliveryInfo || null,
        supportedLanguages: data.supportedLanguages || ['en'],
        aiConfig: data.aiConfig !== undefined ? data.aiConfig : null,
      },
    });

    logRequest({
      method: 'POST',
      path: '/api/v1/businesses',
      status: 201,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
    });

    return successResponse(business, 201);
  } catch (err: any) {
    logRequest({
      method: 'POST',
      path: '/api/v1/businesses',
      status: 500,
      latencyMs: Date.now() - startTime,
      userId: auth.userId,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

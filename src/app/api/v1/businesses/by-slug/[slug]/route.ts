import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();
  const { slug } = await params;

  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        hours: true,
        policies: true,
        deliveryInfo: true,
        supportedLanguages: true,
        aiConfig: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!business) {
      logRequest({
        method: 'GET',
        path: `/api/v1/businesses/by-slug/${slug}`,
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Business not found by slug',
      });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/by-slug/${slug}`,
      status: 200,
      latencyMs: Date.now() - startTime,
    });

    return successResponse(business);
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path: `/api/v1/businesses/by-slug/${slug}`,
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

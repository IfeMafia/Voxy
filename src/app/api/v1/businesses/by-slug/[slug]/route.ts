import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';
import { slugify } from '@/lib/slug';

// GET /api/v1/businesses/by-slug/[slug]
// Public — used by frontend and AI to look up a business by its slug URL
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();
  const { slug: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug || '').trim();
  const path = `/api/v1/businesses/by-slug/${decoded}`;

  if (!decoded) {
    return errorResponse('BAD_REQUEST', 'Business slug is required', 400);
  }

  const selectFields = {
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
    aiConfig: true,
    products: {
      where: { isAvailable: true },
      select: {
        id: true,
        name: true,
        description: true,
        priceKobo: true,
        discountKobo: true,
        currency: true,
        imageUrl: true,
        isAvailable: true,
        tags: true,
      },
    },
    createdAt: true,
    updatedAt: true,
  };

  try {
    const slugified = slugify(decoded);
    const noHyphens = decoded.toLowerCase().replace(/[-_\s]+/g, '');
    const nameWithSpaces = decoded.replace(/[-_]+/g, ' ');

    // Match by exact slug, case-insensitive, hyphen-stripped, slugified, or business name
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { slug: { equals: decoded, mode: 'insensitive' } },
          { slug: { equals: slugified, mode: 'insensitive' } },
          { slug: { equals: noHyphens, mode: 'insensitive' } },
          { name: { equals: decoded, mode: 'insensitive' } },
          { name: { equals: nameWithSpaces, mode: 'insensitive' } },
          ...(decoded.length === 36 ? [{ id: decoded }] : []),
        ],
      },
      select: selectFields,
    });

    if (!business) {
      logRequest({
        method: 'GET',
        path,
        status: 404,
        latencyMs: Date.now() - startTime,
        error: 'Business not found by slug',
      });
      return errorResponse('NOT_FOUND', 'Business not found', 404);
    }

    logRequest({
      method: 'GET',
      path,
      status: 200,
      latencyMs: Date.now() - startTime,
    });
    return successResponse(business);
  } catch (err: any) {
    logRequest({
      method: 'GET',
      path,
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

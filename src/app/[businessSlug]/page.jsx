import React from 'react';
import { notFound } from 'next/navigation';
import PublicVoxyChat from '@/components/business/PublicVoxyChat';
import { constructMetadata } from '@/lib/seo';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';

async function getBusinessData(slug) {
  const decoded = decodeURIComponent(slug || '').trim();
  if (!decoded) return null;

  try {
    const slugified = slugify(decoded);
    const noHyphens = decoded.toLowerCase().replace(/[-_\s]+/g, '');
    const nameWithSpaces = decoded.replace(/[-_]+/g, ' ');

    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { slug: decoded },
          { slug: { equals: decoded, mode: 'insensitive' } },
          { slug: { equals: slugified, mode: 'insensitive' } },
          { slug: { equals: noHyphens, mode: 'insensitive' } },
          { name: { equals: nameWithSpaces, mode: 'insensitive' } },
          { name: { equals: decoded, mode: 'insensitive' } },
        ],
      },
      select: {
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
      },
    });

    return business;
  } catch (err) {
    console.error('Error fetching business by slug:', err);
    return null;
  }
}

/** Dynamic Metadata */
export async function generateMetadata({ params }) {
  const { businessSlug } = await params;
  const business = await getBusinessData(businessSlug);

  if (!business) {
    return constructMetadata({
      title: 'Business Not Found',
      description: 'This business profile might be private or has not been set up yet.',
    });
  }

  return constructMetadata({
    title: `${business.name}`,
    description:
      business.description ||
      `Welcome to ${business.name} — your AI-powered storefront${business.category ? ` for ${business.category}` : ''}.`,
    image: business.logoUrl,
  });
}

export default async function BusinessPublicStorefront({ params }) {
  const { businessSlug } = await params;
  const business = await getBusinessData(businessSlug);

  if (!business) {
    notFound();
  }

  return <PublicVoxyChat business={business} />;
}

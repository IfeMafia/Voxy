import React from 'react';
import { notFound } from 'next/navigation';
import PublicVoxyChat from '@/components/business/PublicVoxyChat';
import { constructMetadata } from '@/lib/seo';

/**
 * Fetch business data via the V2 REST API (no direct DB access).
 * Uses GET /api/v1/businesses/by-slug/:slug — returns public-safe fields only.
 */
async function getBusinessBySlug(slug) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v1/businesses/by-slug/${slug}`, {
      next: { revalidate: 60 }, // ISR — revalidate every 60s
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    console.error('Public storefront fetch error:', error);
    return null;
  }
}

/** Dynamic Metadata */
export async function generateMetadata({ params }) {
  const { businessSlug } = await params;
  const business = await getBusinessBySlug(businessSlug);

  if (!business) {
    return constructMetadata({
      title: 'Business Not Found',
      description: 'This business profile might be private or has not been set up yet.',
    });
  }

  return constructMetadata({
    title: `Chat with ${business.name}`,
    description:
      business.description ||
      `Chat with ${business.name} — your AI-powered business assistant${business.category ? ` for ${business.category}` : ''}.`,
    image: business.logoUrl,
  });
}

export default async function BusinessPublicPage({ params }) {
  const { businessSlug } = await params;
  const business = await getBusinessBySlug(businessSlug);

  if (!business) {
    notFound();
  }

  return <PublicVoxyChat business={business} />;
}

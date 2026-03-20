import React from 'react';
import db from '@/lib/db';
import { notFound } from 'next/navigation';
import BusinessStorefront from '@/components/business/BusinessStorefront';
import Navbar from '@/landing/sections/Navbar';
import { constructMetadata } from '@/lib/seo';

/**
 * Fetch business data from the database
 */
async function getBusiness(slug) {
  try {
    const result = await db.query(
      'SELECT id, name, slug, description, category, custom_category, profile_completion, is_live, logo_url, use_ai_reply, business_hours, assistant_tone, phone, address, state, lga, street_address FROM businesses WHERE slug = $1 AND is_live = true',
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database fetch error:', error);
    return null;
  }
}

/**
 * Dynamic Metadata Generation
 */
export async function generateMetadata({ params }) {
  const { businessSlug } = await params;
  const business = await getBusiness(businessSlug);

  if (!business) {
    return constructMetadata({
      title: "Business Profile Unavailable",
      description: "This business profile might be private or hasn't been set up yet.",
    });
  }

  return constructMetadata({
    title: business.name,
    description: business.description || `Chat with ${business.name} — AI-powered business assistant ${business.category ? `for ${business.category}` : ''}.`,
    image: business.logo_url,
  });
}

export default async function BusinessPublicProfilePage({ params }) {
  const { businessSlug } = await params;
  const business = await getBusiness(businessSlug);

  if (!business) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-500 selection:bg-[#00D18F]/30">
      <Navbar />
      <main className="pt-32 pb-32 px-6 max-w-7xl mx-auto animate-in fade-in duration-1000">
        <BusinessStorefront business={business} />
      </main>
      <footer className="py-12 border-t border-zinc-100 dark:border-white/5 px-6 text-center">
        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.4em]">
          Powered by VOXY AI &copy; 2026
        </p>
      </footer>
    </div>
  );
}

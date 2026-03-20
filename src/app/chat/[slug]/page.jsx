import React from 'react';
import db from '@/lib/db';
import { notFound } from 'next/navigation';
import ChatPageClient from './ChatPageClient';
import { constructMetadata } from '@/lib/seo';

/**
 * Fetch business data specifically for chat
 */
async function getBusinessForChat(slug) {
  try {
    const result = await db.query(
      'SELECT id, name, slug, description, category, logo_url FROM businesses WHERE slug = $1 AND is_live = true',
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database fetch error (chat):', error);
    return null;
  }
}

/**
 * Dynamic Metadata for Public Chat
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const business = await getBusinessForChat(slug);

  if (!business) {
    return constructMetadata({
      title: "Chat Unavailable",
      description: "This conversation is currently unavailable.",
    });
  }

  return constructMetadata({
    title: `Chat with ${business.name}`,
    description: `Start a conversation with ${business.name} powered by Voxy AI assistant.`,
    image: business.logo_url,
  });
}

export default async function PublicChatPage({ params }) {
  const { slug } = await params;
  const business = await getBusinessForChat(slug);

  if (!business) {
    notFound();
  }

  return <ChatPageClient business={business} />;
}

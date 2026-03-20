import db from '@/lib/db';
import { siteConfig } from '@/lib/seo';

/**
 * Dynamic Sitemap Generator
 */
export default async function sitemap() {
  const baseUrl = siteConfig.url;

  // Static routes
  const staticRoutes = [
    '',
    '/login',
    '/register',
    '/terms',
    '/privacy',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic business routes
  let businessRoutes = [];
  try {
    const result = await db.query(
      'SELECT slug, updated_at FROM businesses WHERE is_live = true'
    );
    
    businessRoutes = result.rows.map((business) => ({
      url: `${baseUrl}/business/${business.slug}`,
      lastModified: new Date(business.updated_at || Date.now()).toISOString(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Sitemap business fetch error:', error);
  }

  return [...staticRoutes, ...businessRoutes];
}

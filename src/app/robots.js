import { siteConfig } from '@/lib/seo';

/**
 * Robots.txt Generator
 */
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/lighthouse',
        '/api',
        '/business/dashboard',
        '/business/settings',
        '/business/profile',
        '/customer/dashboard',
        '/customer/settings',
        '/verify-account',
        '/reset-password',
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

import type { MetadataRoute } from 'next';
import { absoluteUrl, getSiteUrl } from '../lib/site';

/** Only the public pages are for search engines. The app, the API and the account screens are not. */
export default function robots(): MetadataRoute.Robots {
  const sitemap = absoluteUrl('/sitemap.xml');
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy', '/terms'],
        disallow: ['/api/', '/auth/', '/admin', '/chat', '/groups', '/people', '/settings', '/login', '/signup', '/register', '/forgot-password', '/reset-password', '/verify-email', '/invite', '/design-system'],
      },
    ],
    ...(sitemap ? { sitemap } : {}),
    ...(getSiteUrl() ? { host: getSiteUrl() as string } : {}),
  };
}

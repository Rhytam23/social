import type { MetadataRoute } from 'next';
import { getSiteUrl } from '../lib/site';

/** The public pages only. Empty when the site address is not configured (see lib/site.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  if (!origin) return [];
  const updated = new Date('2026-09-20');
  return [
    { url: `${origin}/`, lastModified: updated, changeFrequency: 'monthly', priority: 1 },
    { url: `${origin}/privacy`, lastModified: updated, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${origin}/terms`, lastModified: updated, changeFrequency: 'yearly', priority: 0.4 },
  ];
}

import type { MetadataRoute } from 'next';

const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.offerbuzz.co').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${ORIGIN}/sitemap.xml`,
  };
}

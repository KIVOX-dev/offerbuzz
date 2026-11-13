import type { MetadataRoute } from 'next';
import { CATEGORIES } from '@offerbuzz/shared';

const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.offerbuzz.co').replace(/\/$/, '');

/** Public pages plus the merchant and Refer & Earn pages. The admin area is never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly') => ({
    url: `${ORIGIN}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page('/', 1, 'daily'),
    page('/search', 0.9, 'daily'),
    ...CATEGORIES.map((c) => page(`/search?category=${encodeURIComponent(c)}`, 0.8, 'daily')),
    page('/plans', 0.7, 'monthly'),
    page('/about', 0.6, 'monthly'),
    page('/faq', 0.6, 'monthly'),
    page('/contact', 0.6, 'monthly'),
    page('/login', 0.5, 'monthly'),
    page('/login/vendor/sign-in', 0.5, 'monthly'),
    page('/login/vendor/sign-up', 0.5, 'monthly'),
    page('/login/intermediary/sign-in', 0.5, 'monthly'),
    page('/login/intermediary/sign-up', 0.5, 'monthly'),
    page('/merchant/dashboard', 0.4, 'monthly'),
    page('/merchant/offers/new', 0.4, 'monthly'),
    page('/merchant/subscription', 0.4, 'monthly'),
    page('/merchant/profile', 0.4, 'monthly'),
    page('/intermediary/dashboard', 0.4, 'monthly'),
    page('/intermediary/wallet', 0.4, 'monthly'),
    page('/intermediary/qr', 0.4, 'monthly'),
    page('/intermediary/shops', 0.4, 'monthly'),
    page('/intermediary/profile', 0.4, 'monthly'),
    page('/terms', 0.3, 'yearly'),
    page('/privacy', 0.3, 'yearly'),
    page('/cookies', 0.3, 'yearly'),
  ];
}

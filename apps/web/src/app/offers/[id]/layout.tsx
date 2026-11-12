import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { discountPhrase, type PublicOfferDTO } from '@offerbuzz/shared';

// Same target the browser rewrite in next.config.js uses.
const API = process.env.API_PROXY_TARGET ?? 'https://offerbuzz-api-50047221232.development.catalystappsail.in';

/** The public address of this site, so link previews get absolute image URLs. */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

const discount = (o: PublicOfferDTO) =>
  discountPhrase(o.discountType, o.discountValue);

/**
 * Link preview for WhatsApp, Facebook, Telegram and search results: the offer photo, title and shop. Link previews are
 * read from the HTML the server sends, so this runs on the server (the page itself is a client component).
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const origin = await siteOrigin();
  let offer: PublicOfferDTO | undefined;
  try {
    const res = await fetch(`${API}/api/v1/offers/${encodeURIComponent(id)}`, { next: { revalidate: 60 } });
    if (res.ok) offer = ((await res.json()) as { offer: PublicOfferDTO }).offer;
  } catch {
    /* API unreachable: fall back to the site-wide preview */
  }
  if (!offer) return {};

  const title = `${offer.title.toUpperCase()} - ${offer.shop.name}`;
  const description = `${discount(offer)} at ${offer.shop.name}, ${offer.area}. ${offer.description}`.slice(0, 200);
  // the offer photo when there is one, otherwise the OfferBuzz mark
  const image = offer.imageUrl ? `${origin}${offer.imageUrl}` : `${origin}/brand/icon-512.png`;
  const url = `${origin}/offers/${offer.id}`;
  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', siteName: 'OfferBuzz', url, title, description, images: [{ url: image, alt: offer.title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default function OfferLayout({ children }: { children: ReactNode }) {
  return children;
}

/* eslint-disable @next/next/no-img-element */
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { PublicOfferDTO } from '@offerbuzz/shared';
import { SiteHeader } from '@/components/SiteHeader';
import { GlobeIcon, HeartIcon, TagIcon } from '@/components/Icons';
import { SiteHits } from '@/components/SiteHits';
import { ShopMap } from '@/components/maps/ShopMap';
import { discountLabel } from '@/components/OfferPreview';
import { ApiRequestError, getPublicOffer } from '@/lib/api';
import { useSaved } from '@/lib/saved';
import { ModuleTerms } from '@/components/ModuleTerms';

const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function OfferPage() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<PublicOfferDTO>();
  const [error, setError] = useState('');
  const { has, toggle } = useSaved();

  useEffect(() => {
    getPublicOffer(id)
      .then((r) => setOffer(r.offer))
      .catch((e) => setError(e instanceof ApiRequestError && e.status === 404 ? 'This offer is no longer available.' : 'Could not load this offer. Please try again.'));
  }, [id]);

  return (
    <main className="min-h-screen">
      <SiteHeader activeCategory={offer?.category} />

      <div className="container-page py-6">
        {error && <p role="alert" className="surface p-6 text-center text-muted">{error}</p>}
        {!offer && !error && <p className="py-10 text-center text-muted">Loading...</p>}

        {offer && (
          <div className="grid gap-6 md:grid-cols-2">
            <article className="surface overflow-hidden">
              <div className="relative aspect-[4/3] bg-purple-50">
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-purple-300">
                    <TagIcon size={56} />
                  </div>
                )}
                <span className="badge-discount absolute left-3 top-3">
                  {discountLabel(offer.discountType, offer.discountValue === undefined ? '' : String(offer.discountValue))}
                </span>
              </div>
              <div className="space-y-2 p-5">
                <p className="text-small font-semibold text-purple-700">
                  {offer.shop.name}
                  {offer.shop.ownerName && offer.shop.ownerName !== offer.shop.name && <span className="font-normal text-muted"> · Owner: {offer.shop.ownerName}</span>}
                </p>
                <h1 className="text-title font-bold uppercase leading-snug">{offer.title}</h1>
                <p className="text-small text-muted">{offer.category} · {offer.area}</p>
                <p className="whitespace-pre-line text-body">{offer.description}</p>
                <p className="text-small font-semibold">Valid {fmt(offer.startsAt)} to {fmt(offer.endsAt)}</p>
                {offer.phone && (
                  <p className="text-small">
                    Call the shop: <a href={`tel:${offer.phone}`} className="font-semibold text-purple-700 underline">{offer.phone}</a>
                  </p>
                )}
                {offer.terms && <p className="text-small text-muted">Terms: {offer.terms}</p>}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${offer.title.toUpperCase()} at ${offer.shop.name}\n${typeof window === 'undefined' ? '' : window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline mt-2 w-full gap-2"
                >
                  Share on WhatsApp
                </a>
                <button type="button" onClick={() => toggle(offer.id)} aria-pressed={has(offer.id)} className="btn-outline mt-2 w-full gap-2">
                  <HeartIcon size={18} fill={has(offer.id) ? 'currentColor' : 'none'} className={has(offer.id) ? 'text-danger' : ''} />
                  {has(offer.id) ? 'Saved' : 'Save offer'}
                </button>
              </div>
            </article>

            <div className="space-y-3">
              <h2 className="text-section font-bold">Store location</h2>
              {offer.shop.website && (
                <a href={offer.shop.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-small font-bold text-purple-800 hover:bg-purple-100">
                  <GlobeIcon size={16} className="shrink-0" /> <span className="truncate">{offer.shop.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                </a>
              )}
              <ShopMap
                lat={offer.shop.location.lat}
                lng={offer.shop.location.lng}
                address={offer.shop.location.address}
                placeId={offer.shop.location.placeId}
                name={offer.shop.name}
              />
            </div>
          </div>
        )}
        <div className="mt-6">
          <ModuleTerms id="customer" />
        </div>
        <SiteHits className="mt-6 text-center text-muted" />
      </div>
    </main>
  );
}

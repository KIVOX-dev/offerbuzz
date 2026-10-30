/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { PublicOfferDTO } from '@offerbuzz/shared';
import { Logo } from '@/components/Logo';
import { HeartIcon, TagIcon } from '@/components/Icons';
import { ShopMap } from '@/components/maps/ShopMap';
import { discountLabel } from '@/components/OfferPreview';
import { ApiRequestError, getPublicOffer } from '@/lib/api';
import { useSaved } from '@/lib/saved';

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
      <header className="border-b border-purple-100 bg-card">
        <div className="container-page flex items-center justify-between py-3">
          <Logo height={42} />
          <Link href="/" className="btn-ghost btn-sm">All offers</Link>
        </div>
      </header>

      <div className="container-page max-w-4xl py-6">
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
                <p className="text-small font-semibold text-purple-700">{offer.shop.name}</p>
                <h1 className="text-title font-bold leading-snug">{offer.title}</h1>
                <p className="text-small text-muted">{offer.category} · {offer.area}</p>
                <p className="whitespace-pre-line text-body">{offer.description}</p>
                <p className="text-small font-semibold">Valid {fmt(offer.startsAt)} to {fmt(offer.endsAt)}</p>
                {offer.terms && <p className="text-small text-muted">Terms: {offer.terms}</p>}
                <button type="button" onClick={() => toggle(offer.id)} aria-pressed={has(offer.id)} className="btn-outline mt-2 w-full gap-2">
                  <HeartIcon size={18} fill={has(offer.id) ? 'currentColor' : 'none'} className={has(offer.id) ? 'text-danger' : ''} />
                  {has(offer.id) ? 'Saved' : 'Save offer'}
                </button>
              </div>
            </article>

            <div className="space-y-3">
              <h2 className="text-section font-bold">Find the shop</h2>
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
      </div>
    </main>
  );
}

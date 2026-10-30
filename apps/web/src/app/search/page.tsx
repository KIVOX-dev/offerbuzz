'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import type { PublicOfferDTO } from '@offerbuzz/shared';
import { SearchBox } from '@/components/home/SearchBox';
import { Logo } from '@/components/Logo';
import { OfferCard } from '@/components/OfferCard';
import { Reveal } from '@/components/Reveal';
import { DuoOffersIcon } from '@/components/Icons';
import { searchOffers } from '@/lib/api';
import { useVisitorLocation } from '@/lib/location';

function Results() {
  const router = useRouter();
  const params = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const category = params.get('category') ?? '';
  const [text, setText] = useState(q);
  const { coords } = useVisitorLocation();
  const [offers, setOffers] = useState<PublicOfferDTO[]>();
  const [error, setError] = useState('');

  useEffect(() => setText(q), [q]);

  useEffect(() => {
    let stale = false;
    setOffers(undefined);
    setError('');
    searchOffers({ q: q || undefined, category: category || undefined, lat: coords?.lat, lng: coords?.lng })
      .then((r) => !stale && setOffers(r.offers))
      .catch(() => !stale && setError('Could not search right now. Please try again.'));
    return () => {
      stale = true;
    };
  }, [q, category, coords?.lat, coords?.lng]);

  const title = category ? category : q ? `Results for "${q}"` : 'All offers';

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-purple-100 bg-card">
        <div className="container-page flex items-center gap-3 py-2">
          <Logo height={40} />
          <SearchBox value={text} onChange={setText} onScan={(t) => router.push(`/search?q=${encodeURIComponent(t)}`)} variant="desktop" />
        </div>
      </header>

      <div className="container-page space-y-4 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-title font-bold">{title}</h1>
          {offers && offers.length > 0 && (
            <p className="text-small text-muted">
              {offers.length} offer{offers.length > 1 ? 's' : ''}
              {coords ? ', nearest first' : ''}
            </p>
          )}
        </div>

        {error && <p role="alert" className="surface p-6 text-center text-muted">{error}</p>}
        {!error && offers === undefined && <p className="py-10 text-center text-muted">Searching...</p>}

        {offers && offers.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {offers.map((o, i) => (
              <Reveal key={o.id} delay={(i % 5) * 50}>
                <OfferCard o={o} />
              </Reveal>
            ))}
          </div>
        )}

        {offers && offers.length === 0 && !error && (
          <div className="surface flex flex-col items-center gap-3 p-10 text-center">
            <DuoOffersIcon size={56} />
            <p className="text-section font-bold">{q || category ? 'No offers found' : 'No live offers yet'}</p>
            <p className="text-muted">{q || category ? 'Try a different word, a shop name or a category such as Fashion or Grocery.' : 'New shops post offers every day. Please check back soon.'}</p>
            <Link href="/" className="btn-primary px-6">Back to home</Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <Results />
    </Suspense>
  );
}

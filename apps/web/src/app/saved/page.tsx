'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PublicOfferDTO } from '@offerbuzz/shared';
import { DuoHeartIcon } from '@/components/Icons';
import { Logo } from '@/components/Logo';
import { OfferCard } from '@/components/OfferCard';
import { Reveal } from '@/components/Reveal';
import { getOffersByIds } from '@/lib/api';
import { useSaved } from '@/lib/saved';

/** The offers a visitor has hearted. They are stored in this browser, so no login is needed. */
export default function SavedPage() {
  const { ids } = useSaved();
  const [ready, setReady] = useState(false);
  const [offers, setOffers] = useState<PublicOfferDTO[]>([]);
  const [error, setError] = useState('');
  const key = ids.join(',');

  useEffect(() => {
    // wait one tick for the saved ids to be read from this browser
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!key) {
      setOffers([]);
      return;
    }
    let stale = false;
    setError('');
    getOffersByIds(ids)
      .then((r) => !stale && setOffers(r.offers))
      .catch(() => !stale && setError('Could not load your saved offers. Please try again.'));
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for `ids`
  }, [key, ready]);

  // saved offers that ended or were removed simply drop out of the list
  const shown = offers.filter((o) => ids.includes(o.id));

  return (
    <main className="min-h-screen">
      <header className="border-b border-purple-100 bg-card">
        <div className="container-page flex items-center justify-between py-2">
          <Logo height={42} />
          <Link href="/" className="btn-ghost btn-sm">Back to home</Link>
        </div>
      </header>

      <div className="container-page space-y-4 py-5">
        <h1 className="text-title font-bold">Saved offers</h1>
        {error && <p role="alert" className="surface p-6 text-center text-muted">{error}</p>}

        {shown.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {shown.map((o, i) => (
              <Reveal key={o.id} delay={(i % 5) * 50}>
                <OfferCard o={o} />
              </Reveal>
            ))}
          </div>
        )}

        {ready && !error && shown.length === 0 && (
          <div className="surface flex flex-col items-center gap-3 p-10 text-center">
            <DuoHeartIcon size={56} />
            <p className="text-section font-bold">{ids.length > 0 ? 'Your saved offers are loading or have ended' : 'No saved offers yet'}</p>
            <p className="text-muted">Tap the heart on any offer to keep it here. No account needed.</p>
            <Link href="/search" className="btn-primary px-6">Browse offers</Link>
          </div>
        )}
      </div>
    </main>
  );
}

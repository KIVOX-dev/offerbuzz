'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { MyOffersResponse, OfferDTO } from '@offerbuzz/shared';
import { useAccount } from '@/components/account/AccountShell';
import { EyeStatIcon, PlusIcon, TagIcon, TrashIcon } from '@/components/Icons';
import { ApiRequestError, deleteOffer, getMyOffers } from '@/lib/api';

const STATUS_STYLE: Record<OfferDTO['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-700',
};
const STATUS_LABEL: Record<OfferDTO['status'], string> = {
  pending: 'Waiting for approval',
  active: 'Live',
  rejected: 'Rejected',
  expired: 'Expired',
};

export const discountText = (o: Pick<OfferDTO, 'discountType' | 'discountValue'>) =>
  o.discountType === 'percent' ? `${o.discountValue}% off` : o.discountType === 'amount' ? `Rs ${o.discountValue} off` : 'Special deal';

const fmt = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="surface p-4">
      <p className="text-small text-muted">{label}</p>
      <p className="mt-1 text-title font-bold">{value.toLocaleString('en-IN')}</p>
      {hint && <p className="mt-1 text-small text-muted">{hint}</p>}
    </div>
  );
}

export default function MerchantDashboard() {
  const router = useRouter();
  const { user } = useAccount();
  const [data, setData] = useState<MyOffersResponse>();
  const [error, setError] = useState<string>();
  const [removing, setRemoving] = useState<string>();

  const load = useCallback(async () => {
    try {
      setData(await getMyOffers());
    } catch (e) {
      if (e instanceof ApiRequestError && e.code === 'SESSION_EXPIRED') return router.replace('/login');
      setError(e instanceof ApiRequestError ? e.message : 'Could not load your offers');
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(o: OfferDTO) {
    if (!window.confirm(`Delete "${o.title}"? This cannot be undone.`)) return;
    setRemoving(o.id);
    try {
      await deleteOffer(o.id);
      await load();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Could not delete the offer');
    } finally {
      setRemoving(undefined);
    }
  }

  const totals = data?.totals;
  const ctr = totals && totals.views > 0 ? Math.round((totals.claims / totals.views) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-md bg-hero p-5 text-white shadow-glow md:p-6">
        <span className="badge-discount !bg-accent !text-ink">Vendor account</span>
        <h1 className="mt-3 text-title font-bold">Welcome, {user.name || 'vendor'}!</h1>
        <p className="mt-1 max-w-xl text-purple-100">
          {user.shopName ? `${user.shopName}: ` : ''}track how your offers perform and post new ones.
        </p>
        <Link href="/merchant/offers/new" className="btn-accent mt-4 gap-2">
          <PlusIcon size={18} /> Post an offer
        </Link>
      </section>

      {!user.shopName && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-small text-amber-900">
          Add your shop name so customers know who is behind your offers.{' '}
          <Link href="/merchant/profile" className="font-semibold underline">Open profile</Link>
        </p>
      )}

      <section aria-labelledby="insights">
        <h2 id="insights" className="mb-3 flex items-center gap-2 text-section font-bold">
          <EyeStatIcon size={22} className="text-purple-700" /> Offer insights
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Total offers" value={totals?.offers ?? 0} />
          <Stat label="Live now" value={totals?.active ?? 0} hint={totals?.pending ? `${totals.pending} waiting for approval` : undefined} />
          <Stat label="Views" value={totals?.views ?? 0} hint="People who opened your offers" />
          <Stat label="Claims" value={totals?.claims ?? 0} hint="People who claimed an offer" />
          <Stat label="Claim rate" value={ctr} hint="Claims per 100 views (%)" />
        </div>
      </section>

      <section aria-labelledby="my-offers">
        <h2 id="my-offers" className="mb-3 text-section font-bold">Your offers</h2>
        {error && <p role="alert" className="mb-3 text-small text-danger">{error}</p>}
        {!data ? (
          <p className="text-muted">Loading...</p>
        ) : data.offers.length === 0 ? (
          <div className="surface flex flex-col items-center p-8 text-center">
            <TagIcon size={40} className="text-purple-300" />
            <p className="mt-3 font-semibold">You have not posted an offer yet</p>
            <p className="mt-1 text-muted">Offers you post are reviewed first, then shown to customers nearby.</p>
            <Link href="/merchant/offers/new" className="btn-primary mt-4 gap-2">
              <PlusIcon size={18} /> Post your first offer
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.offers.map((o) => (
              <li key={o.id} className="surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-body font-bold">{o.title}</h3>
                      <span className={`rounded-sm px-2 py-0.5 text-small font-semibold ${STATUS_STYLE[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-small text-muted">
                      {o.category} · {o.area} · {discountText(o)}
                    </p>
                    <p className="text-small text-muted">
                      {fmt(o.startsAt)} to {fmt(o.endsAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-small">
                    <span><strong className="text-body">{o.views}</strong> views</span>
                    <span><strong className="text-body">{o.claims}</strong> claims</span>
                    <button
                      type="button"
                      onClick={() => remove(o)}
                      disabled={removing === o.id}
                      aria-label={`Delete ${o.title}`}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-danger hover:bg-red-50 disabled:opacity-50"
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

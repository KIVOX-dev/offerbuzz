'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import type { MyOffersResponse, OfferDTO } from '@offerbuzz/shared';
import { useAccount } from '@/components/account/AccountShell';
import { DuoClockIcon, DuoOffersIcon, DuoTagIcon, EyeIcon, PlusIcon, TagIcon, TrashIcon } from '@/components/Icons';
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
  expired: 'Ended',
};

export const discountText = (o: Pick<OfferDTO, 'discountType' | 'discountValue'>) =>
  o.discountType === 'percent' ? `${o.discountValue}% off` : o.discountType === 'amount' ? `Rs ${o.discountValue} off` : 'Special deal';

const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** "Ends today", "Ends in 5 days" or "Ended", from the end date. */
function endsIn(endsAt: string): string {
  const days = Math.round((new Date(`${endsAt}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86_400_000);
  if (days < 0) return 'Ended';
  if (days === 0) return 'Ends today';
  return days === 1 ? 'Ends tomorrow' : `Ends in ${days} days`;
}

type IconType = ComponentType<{ size?: number }>;

function Stat({ label, value, hint, icon: Icon, tone }: { label: string; value: number; hint: string; icon: IconType; tone: string }) {
  return (
    <div className="surface flex items-start gap-3 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${tone}`} aria-hidden>
        <Icon size={32} />
      </span>
      <div className="min-w-0">
        <p className="text-small text-muted">{label}</p>
        <p className="text-title font-bold leading-tight">{value.toLocaleString('en-IN')}</p>
        <p className="text-small text-muted">{hint}</p>
      </div>
    </div>
  );
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Live' },
  { key: 'pending', label: 'Waiting' },
  { key: 'ended', label: 'Ended' },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

const matches = (o: OfferDTO, f: FilterKey) =>
  f === 'all' || (f === 'ended' ? o.status === 'expired' || o.status === 'rejected' : o.status === f);

export default function MerchantDashboard() {
  const router = useRouter();
  const { user } = useAccount();
  const [data, setData] = useState<MyOffersResponse>();
  const [error, setError] = useState<string>();
  const [removing, setRemoving] = useState<string>();
  const [filter, setFilter] = useState<FilterKey>('all');

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

  const counts = useMemo(() => {
    const all = data?.offers ?? [];
    return Object.fromEntries(FILTERS.map((f) => [f.key, all.filter((o) => matches(o, f.key)).length])) as Record<FilterKey, number>;
  }, [data]);
  const shown = (data?.offers ?? []).filter((o) => matches(o, filter));
  const totals = data?.totals;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-hero p-5 text-white shadow-glow md:p-6">
        <div className="min-w-0">
          <h1 className="text-title font-bold">Welcome, {user.name || 'vendor'}!</h1>
          <p className="mt-1 text-purple-100">{user.shopName ? `${user.shopName} · ` : ''}Here is how your offers are doing.</p>
        </div>
        <Link href="/merchant/offers/new" className="btn-accent gap-2">
          <PlusIcon size={18} /> Post an offer
        </Link>
      </section>

      {!user.location && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-small text-amber-900">
          Share your shop location so customers can find you on the map. It is needed before you can post offers.{' '}
          <Link href="/merchant/profile" className="font-semibold underline">Set location</Link>
        </p>
      )}

      {!user.shopName && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-small text-amber-900">
          Add your shop name so customers know who is behind your offers.{' '}
          <Link href="/merchant/profile" className="font-semibold underline">Open profile</Link>
        </p>
      )}

      <section aria-label="Overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Live now" value={totals?.active ?? 0} hint="Customers can see these" icon={DuoTagIcon} tone="bg-green-100 text-green-700" />
        <Stat label="Waiting for approval" value={totals?.pending ?? 0} hint="Reviewed by our team" icon={DuoClockIcon} tone="bg-amber-100 text-amber-700" />
        <Stat label="Total offers" value={totals?.offers ?? 0} hint="Everything you posted" icon={DuoOffersIcon} tone="bg-purple-100 text-purple-700" />
        <Stat label="Views" value={totals?.views ?? 0} hint="Times your offers were opened" icon={EyeIcon} tone="bg-sky-100 text-sky-700" />
      </section>

      <section aria-labelledby="my-offers">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="my-offers" className="text-section font-bold">Your offers</h2>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter offers">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" role="tab" aria-selected={filter === f.key}
                className={`chip ${filter === f.key ? 'chip-active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label} <span className="ml-1 opacity-70">{counts[f.key]}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p role="alert" className="mb-3 text-small text-danger">{error}</p>}

        {!data ? (
          <p className="text-muted">Loading...</p>
        ) : data.offers.length === 0 ? (
          <div className="surface flex flex-col items-center p-8 text-center">
            <DuoTagIcon size={56} />
            <p className="mt-3 font-semibold">You have not posted an offer yet</p>
            <p className="mt-1 text-muted">Offers you post are reviewed first, then shown to customers nearby.</p>
            <Link href="/merchant/offers/new" className="btn-primary mt-4 gap-2">
              <PlusIcon size={18} /> Post your first offer
            </Link>
          </div>
        ) : shown.length === 0 ? (
          <p className="surface p-6 text-center text-muted">No offers in this list.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {shown.map((o) => (
              <li key={o.id} className="surface flex gap-3 p-3">
                {o.imageUrl ? (
                  <img src={o.imageUrl} alt="" className="h-24 w-24 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-purple-50 text-purple-300" aria-hidden>
                    <TagIcon size={32} />
                  </span>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-bold leading-snug">{o.title}</h3>
                    <button type="button" onClick={() => remove(o)} disabled={removing === o.id} aria-label={`Delete ${o.title}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-danger hover:bg-red-50 disabled:opacity-50">
                      <TrashIcon size={18} />
                    </button>
                  </div>
                  <p className="truncate text-small text-muted">{o.category} · {o.area}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`rounded-sm px-2 py-0.5 text-small font-semibold ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    <span className="rounded-sm bg-purple-100 px-2 py-0.5 text-small font-semibold text-purple-800">{discountText(o)}</span>
                  </div>
                  <p className="mt-auto pt-2 text-small text-muted">
                    {fmt(o.startsAt)} to {fmt(o.endsAt)}
                    {o.status === 'active' ? ` · ${endsIn(o.endsAt)}` : ''}
                    {` · ${o.views} view${o.views === 1 ? '' : 's'}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

'use client';

/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { AdminOffersResponse, OfferDTO } from '@offerbuzz/shared';
import { ApiRequestError, getAdminOffers, setOfferStatus } from '@/lib/api';

const VIEWS = [
  { value: 'running', label: 'Running now' },
  { value: 'pending', label: 'Waiting for approval' },
  { value: 'all', label: 'All offers' },
];
const STATUS_STYLE: Record<OfferDTO['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-700',
};
const STATUS_LABEL: Record<OfferDTO['status'], string> = { pending: 'Waiting for approval', active: 'Approved', rejected: 'Rejected', expired: 'Expired' };

const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const discount = (o: OfferDTO) =>
  o.discountType === 'percent' ? `${o.discountValue}% off` : o.discountType === 'amount' ? `Rs ${o.discountValue} off` : 'Special deal';

export default function AdminOffers() {
  const router = useRouter();
  const [view, setView] = useState('running');
  const [category, setCategory] = useState('');
  const [data, setData] = useState<AdminOffersResponse>();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof ApiRequestError && e.code === 'SESSION_EXPIRED') return router.replace('/admin/login');
      setError(e instanceof ApiRequestError ? e.message : 'Something went wrong');
    },
    [router],
  );

  const load = useCallback(() => {
    setError(undefined);
    getAdminOffers({ view, category }).then(setData).catch(fail);
  }, [view, category, fail]);

  useEffect(load, [load]);

  async function decide(id: string, status: 'active' | 'rejected') {
    setBusy(id);
    try {
      await setOfferStatus(id, status);
      load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(undefined);
    }
  }

  const totalRunning = data?.categories.reduce((n, c) => n + c.running, 0) ?? 0;
  const totalPending = data?.categories.reduce((n, c) => n + c.pending, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-title font-bold">Offers</h1>
        <p className="mt-1 text-muted">
          {totalRunning} running now · {totalPending} waiting for approval. Pick a category to see its offers.
        </p>
      </div>

      <section aria-label="Categories" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <button type="button" onClick={() => setCategory('')}
          className={`surface-hover p-3 text-left ${category === '' ? 'ring-2 ring-purple-500' : ''}`}>
          <p className="font-semibold">All categories</p>
          <p className="text-small text-muted">{totalRunning} running</p>
        </button>
        {data?.categories.map((c) => (
          <button key={c.category} type="button" onClick={() => setCategory(c.category)}
            className={`surface-hover p-3 text-left ${category === c.category ? 'ring-2 ring-purple-500' : ''}`}>
            <p className="font-semibold">{c.category}</p>
            <p className="text-small">
              <span className={c.running ? 'font-semibold text-green-700' : 'text-muted'}>{c.running} running</span>
              {c.pending > 0 && <span className="text-amber-700"> · {c.pending} to approve</span>}
            </p>
          </button>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button key={v.value} type="button" className={`chip ${view === v.value ? 'chip-active' : ''}`} onClick={() => setView(v.value)}>
            {v.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      {!data ? (
        <p className="text-muted">Loading...</p>
      ) : data.offers.length === 0 ? (
        <p className="surface p-6 text-center text-muted">
          {view === 'running' ? 'No offers are running' : view === 'pending' ? 'Nothing is waiting for approval' : 'No offers'}
          {category ? ` in ${category}` : ''}.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.offers.map((o) => (
            <li key={o.id} className="surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {o.imageUrl && <img src={o.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{o.title}</h3>
                    <span className={`rounded-sm px-2 py-0.5 text-small font-semibold ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </div>
                  <p className="text-small text-muted">{o.category} · {o.area} · {discount(o)}</p>
                  <p className="text-small text-muted">{fmt(o.startsAt)} to {fmt(o.endsAt)} · by {o.vendor}</p>
                  <p className="mt-1 text-small">{o.description}</p>
                  {o.terms && <p className="text-small text-muted">Terms: {o.terms}</p>}
                  <p className="mt-1 text-small text-muted">{o.views} views · {o.claims} claims</p>
                </div>
                <div className="flex gap-2">
                  {o.status !== 'active' && o.status !== 'expired' && (
                    <button type="button" className="btn-primary btn-sm" disabled={busy === o.id} onClick={() => decide(o.id, 'active')}>Approve</button>
                  )}
                  {o.status !== 'rejected' && (
                    <button type="button" className="btn-outline btn-sm !border-red-300 !text-danger" disabled={busy === o.id}
                      onClick={() => decide(o.id, 'rejected')}>
                      {o.status === 'active' ? 'Stop' : 'Reject'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

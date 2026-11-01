'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { AdminOfferDTO, AdminUserDTO } from '@offerbuzz/shared';
import { notifyApprovalsChanged, PendingOfferCard } from '@/components/admin/approvals';
import { ApiRequestError, getAdminOffers, getAdminUsers, setOfferStatus, setUserStatus } from '@/lib/api';

/** Everything waiting for the admin in one place: new offers and new intermediaries. */
export default function AdminApprovals() {
  const router = useRouter();
  const [offers, setOffers] = useState<AdminOfferDTO[]>();
  const [people, setPeople] = useState<AdminUserDTO[]>();
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
    getAdminOffers({ view: 'pending' }).then((r) => setOffers(r.offers)).catch(fail);
    getAdminUsers({ role: 'intermediary', status: 'pending' }).then((r) => setPeople(r.users)).catch(fail);
  }, [fail]);

  useEffect(load, [load]);

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError(undefined);
    try {
      await fn();
      load();
      notifyApprovalsChanged();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-title font-bold">Approvals</h1>
        <p className="mt-1 text-muted">New offers and intermediary accounts wait here until you approve them.</p>
      </div>

      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      <section aria-labelledby="ap-offers">
        <h2 id="ap-offers" className="mb-3 text-section font-bold">Offers ({offers?.length ?? 0})</h2>
        {!offers ? (
          <p className="text-muted">Loading...</p>
        ) : offers.length === 0 ? (
          <p className="surface p-4 text-muted">No offers are waiting for approval.</p>
        ) : (
          <ul className="space-y-3">
            {offers.map((o) => (
              <PendingOfferCard key={o.id} o={o} busy={busy === o.id} onDecide={(id, status) => run(id, () => setOfferStatus(id, status))} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="ap-people">
        <h2 id="ap-people" className="mb-3 text-section font-bold">Intermediaries ({people?.length ?? 0})</h2>
        {!people ? (
          <p className="text-muted">Loading...</p>
        ) : people.length === 0 ? (
          <p className="surface p-4 text-muted">No intermediaries are waiting for approval.</p>
        ) : (
          <ul className="space-y-3">
            {people.map((u) => (
              <li key={u.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold">{u.name || u.email}</p>
                  <p className="text-small text-muted">{[u.email, u.phone, u.city].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-primary btn-sm" disabled={busy === u.id} onClick={() => run(u.id, () => setUserStatus(u.id, 'active'))}>Approve</button>
                  <button type="button" className="btn-outline btn-sm !border-red-300 !text-danger" disabled={busy === u.id}
                    onClick={() => window.confirm(`Block ${u.name || u.email}?`) && run(u.id, () => setUserStatus(u.id, 'blocked'))}>
                    Block
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

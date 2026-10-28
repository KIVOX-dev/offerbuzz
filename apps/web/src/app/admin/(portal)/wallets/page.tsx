'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { AdminWalletsResponse } from '@offerbuzz/shared';
import { ApiRequestError, getAdminWallets, payPayout, rejectPayoutRequest } from '@/lib/api';

const rs = (n: number) => `Rs ${n.toLocaleString('en-IN')}`;
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const PAYOUT_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminWallets() {
  const router = useRouter();
  const [data, setData] = useState<AdminWalletsResponse>();
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
    getAdminWallets().then(setData).catch(fail);
  }, [fail]);

  useEffect(load, [load]);

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError(undefined);
    try {
      await fn();
      load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(undefined);
    }
  }

  const pending = data?.payouts.filter((p) => p.status === 'pending') ?? [];
  const history = data?.payouts.filter((p) => p.status !== 'pending') ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-title font-bold">Wallets & payouts</h1>
        <p className="mt-1 text-muted">
          Intermediaries can request a payout once {data ? rs(data.payoutThreshold) : 'the minimum'} is available. Pay them outside the
          app (bank or UPI), then click Mark as paid to record it. 1 credit = Rs 1.
        </p>
      </div>

      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      <section aria-labelledby="requests">
        <h2 id="requests" className="mb-3 text-section font-bold">Payout requests ({pending.length})</h2>
        {!data ? (
          <p className="text-muted">Loading...</p>
        ) : pending.length === 0 ? (
          <p className="surface p-4 text-muted">No payout requests are waiting.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4 ring-2 ring-amber-200">
                <div>
                  <p className="font-bold">{p.intermediary}</p>
                  <p className="text-small text-muted">Requested {fmt(p.requestedAt)}</p>
                </div>
                <p className="text-section font-bold">{rs(p.credits)}</p>
                <div className="flex gap-2">
                  <button type="button" className="btn-primary btn-sm" disabled={busy === p.id}
                    onClick={() => window.confirm(`Confirm you have paid ${rs(p.credits)} to ${p.intermediary}?`) && run(p.id, () => payPayout(p.id))}>
                    Mark as paid
                  </button>
                  <button type="button" className="btn-outline btn-sm !border-red-300 !text-danger" disabled={busy === p.id}
                    onClick={() => {
                      const note = window.prompt('Reason for rejecting (optional)') ;
                      if (note !== null) void run(p.id, () => rejectPayoutRequest(p.id, note || undefined));
                    }}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="wallets">
        <h2 id="wallets" className="mb-3 text-section font-bold">All intermediary wallets</h2>
        {!data ? null : data.wallets.length === 0 ? (
          <p className="surface p-4 text-muted">No intermediaries yet.</p>
        ) : (
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-small">
              <thead className="border-b border-purple-100 text-muted">
                <tr>
                  <th className="p-3 font-semibold">Intermediary</th>
                  <th className="p-3 text-right font-semibold">Shops</th>
                  <th className="p-3 text-right font-semibold">Earned</th>
                  <th className="p-3 text-right font-semibold">Balance</th>
                  <th className="p-3 text-right font-semibold">Available</th>
                  <th className="p-3 text-right font-semibold">On hold</th>
                  <th className="p-3 text-right font-semibold">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {data.wallets.map((w) => (
                  <tr key={w.id} className={w.available >= data.payoutThreshold ? 'bg-green-50' : ''}>
                    <td className="p-3">
                      <p className="font-semibold text-body">{w.name}</p>
                      <p className="text-muted">
                        {w.email}
                        {w.status !== 'active' ? ` · ${w.status === 'pending' ? 'needs approval' : w.status}` : ''}
                      </p>
                    </td>
                    <td className="p-3 text-right">{w.shops}</td>
                    <td className="p-3 text-right">{rs(w.totalEarned)}</td>
                    <td className="p-3 text-right font-semibold">{rs(w.balance)}</td>
                    <td className="p-3 text-right font-semibold text-green-700">{rs(w.available)}</td>
                    <td className="p-3 text-right">{rs(w.onHold)}</td>
                    <td className="p-3 text-right">{w.requested ? rs(w.requested) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section aria-labelledby="history">
          <h2 id="history" className="mb-3 text-section font-bold">Payout history</h2>
          <ul className="surface divide-y divide-purple-100">
            {history.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  <p className="font-semibold">{p.intermediary}</p>
                  <p className="text-small text-muted">
                    {p.processedAt ? fmt(p.processedAt) : fmt(p.requestedAt)}
                    {p.note ? ` · ${p.note}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{rs(p.credits)}</span>
                  <span className={`rounded-sm px-2 py-0.5 text-small font-semibold ${PAYOUT_STYLE[p.status]}`}>{p.status === 'paid' ? 'Paid' : 'Rejected'}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

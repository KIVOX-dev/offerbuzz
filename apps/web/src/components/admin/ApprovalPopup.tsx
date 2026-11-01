'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { AdminOfferDTO } from '@offerbuzz/shared';
import { ApiRequestError, getAdminOffers, setOfferStatus } from '@/lib/api';
import { notifyApprovalsChanged, PendingOfferCard } from './approvals';

const SEEN = 'offerbuzz.approvalPopupSeen';

/** Opens once per visit to the dashboard when offers are waiting, so the admin can approve them right there. */
export function ApprovalPopup() {
  const [offers, setOffers] = useState<AdminOfferDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    getAdminOffers({ view: 'pending' })
      .then((r) => {
        setOffers(r.offers);
        let seen = false;
        try {
          seen = sessionStorage.getItem(SEEN) === '1';
        } catch {
          /* storage blocked: just show it */
        }
        if (r.offers.length > 0 && !seen) setOpen(true);
      })
      .catch(() => undefined);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(SEEN, '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  async function decide(id: string, status: 'active' | 'rejected') {
    setBusy(id);
    setError(undefined);
    try {
      await setOfferStatus(id, status);
      const left = offers.filter((o) => o.id !== id);
      setOffers(left);
      notifyApprovalsChanged();
      if (left.length === 0) close();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Something went wrong');
    } finally {
      setBusy(undefined);
    }
  }

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="ap-pop-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-page shadow-card sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-purple-100 p-4">
          <div>
            <h2 id="ap-pop-title" className="text-section font-bold">{offers.length} offer{offers.length === 1 ? '' : 's'} waiting for approval</h2>
            <p className="text-small text-muted">Approve to show an offer to customers, or reject it.</p>
          </div>
          <button type="button" aria-label="Close" className="btn-ghost btn-sm" onClick={close}>✕</button>
        </div>
        <ul className="space-y-3 overflow-y-auto p-4">
          {offers.map((o) => (
            <PendingOfferCard key={o.id} o={o} busy={busy === o.id} onDecide={decide} />
          ))}
        </ul>
        {error && <p role="alert" className="px-4 text-small text-danger">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-purple-100 p-3">
          <button type="button" className="btn-outline btn-sm" onClick={close}>Later</button>
          <Link href="/admin/approvals" className="btn-primary btn-sm" onClick={close}>Open Approvals</Link>
        </div>
      </div>
    </div>
  );
}

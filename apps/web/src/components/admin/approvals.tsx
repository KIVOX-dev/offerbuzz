/* eslint-disable @next/next/no-img-element */
'use client';

import type { AdminOfferDTO } from '@offerbuzz/shared';

/** Fired after an approval decision so the sidebar badge refreshes straight away. */
export const APPROVALS_EVENT = 'offerbuzz:approvals-changed';
export const notifyApprovalsChanged = () => window.dispatchEvent(new Event(APPROVALS_EVENT));

const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const discount = (o: AdminOfferDTO) =>
  o.discountType === 'percent' ? `${o.discountValue}% off` : o.discountType === 'amount' ? `Rs ${o.discountValue} off` : 'Special deal';

/** One offer waiting for approval, with Approve / Reject. */
export function PendingOfferCard({
  o,
  busy,
  onDecide,
}: {
  o: AdminOfferDTO;
  busy: boolean;
  onDecide: (id: string, status: 'active' | 'rejected') => void;
}) {
  return (
    <li className="surface p-4">
      <div className="flex flex-wrap items-start gap-3">
        {o.imageUrl && <img src={o.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />}
        <div className="min-w-0 flex-1 basis-[calc(100%-6.5rem)] sm:basis-56">
          <h3 className="font-bold">{o.title}</h3>
          <p className="text-small text-muted">{o.category} · {o.area} · {discount(o)}</p>
          <p className="text-small text-muted">{fmt(o.startsAt)} to {fmt(o.endsAt)} · by {o.vendor}</p>
          {o.phone && <p className="text-small text-muted">Phone: {o.phone}</p>}
          <p className="mt-1 break-words text-small">{o.description}</p>
          {o.terms && <p className="text-small text-muted">Terms: {o.terms}</p>}
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => onDecide(o.id, 'active')}>Approve</button>
          <button type="button" className="btn-outline btn-sm !border-red-300 !text-danger" disabled={busy} onClick={() => onDecide(o.id, 'rejected')}>
            Reject
          </button>
        </div>
      </div>
    </li>
  );
}

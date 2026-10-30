'use client';

import type { ComponentType } from 'react';
import type { WalletEntryDTO } from '@offerbuzz/shared';
import { fmtDate } from './useWallet';

type IconType = ComponentType<{ size?: number }>;

export function Stat({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint?: string; icon: IconType; tone: string }) {
  return (
    <div className="surface flex items-start gap-3 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${tone}`} aria-hidden>
        <Icon size={32} />
      </span>
      <div className="min-w-0">
        <p className="text-small text-muted">{label}</p>
        <p className="text-title font-bold leading-tight">{value}</p>
        {hint && <p className="text-small text-muted">{hint}</p>}
      </div>
    </div>
  );
}

const REASON: Record<string, string> = { subscription: 'Shop subscription', payout: 'Payout', adjustment: 'Adjustment' };

/** Wallet ledger rows, newest first. */
export function HistoryList({ entries }: { entries: WalletEntryDTO[] }) {
  return (
    <ul className="surface divide-y divide-purple-100">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="font-semibold">
              {REASON[e.reason] ?? e.reason}
              {e.shop ? `: ${e.shop}` : ''}
            </p>
            <p className="text-small text-muted">
              {fmtDate(e.createdAt)}
              {e.kind === 'credit' && new Date(e.availableAt).getTime() > Date.now() ? ` · available from ${fmtDate(e.availableAt)}` : ''}
            </p>
          </div>
          <span className={`shrink-0 font-bold ${e.kind === 'credit' ? 'text-green-700' : 'text-danger'}`}>
            {e.kind === 'credit' ? '+' : '-'}
            {e.credits}
          </span>
        </li>
      ))}
    </ul>
  );
}

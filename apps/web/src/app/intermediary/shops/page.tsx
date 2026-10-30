'use client';

import { fmtDate, useWallet } from '@/components/account/useWallet';
import { DuoStoreIcon, StoreIcon } from '@/components/Icons';

export default function IntermediaryShops() {
  const { wallet, error } = useWallet();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-title font-bold">Shops referred</h1>
        <p className="mt-1 text-muted">Shops that signed up with your code. You earn credits each month they pay.</p>
      </div>

      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      {!wallet ? (
        <p className="text-muted">Loading...</p>
      ) : wallet.shops.length === 0 ? (
        <div className="surface flex flex-col items-center p-8 text-center">
          <DuoStoreIcon size={56} />
          <p className="mt-3 font-semibold">No shops yet</p>
          <p className="mt-1 text-muted">Share your QR code with shop owners to get started.</p>
        </div>
      ) : (
        <>
          <p className="text-small font-semibold text-muted">{wallet.shops.length} shop{wallet.shops.length === 1 ? '' : 's'}</p>
          <ul className="surface divide-y divide-purple-100">
            {wallet.shops.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 p-3">
                <span className="flex items-center gap-3 font-semibold">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-100 text-purple-700" aria-hidden>
                    <StoreIcon size={18} />
                  </span>
                  {s.name}
                </span>
                <span className="text-small text-muted">Joined {fmtDate(s.joinedAt)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

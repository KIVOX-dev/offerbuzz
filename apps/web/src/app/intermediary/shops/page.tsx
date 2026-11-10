'use client';

import { MERCHANT_PLANS } from '@offerbuzz/shared';
import { fmtDate, rs, useWallet } from '@/components/account/useWallet';
import { ModuleTerms } from '@/components/ModuleTerms';
import { DuoStoreIcon, GlobeIcon, PinIcon, StoreIcon } from '@/components/Icons';

export default function IntermediaryShops() {
  const { wallet, error } = useWallet();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
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
          <ul className="grid gap-3 md:grid-cols-2">
            {wallet.shops.map((s) => (
              <li key={s.id} className="surface space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-700" aria-hidden>
                      <StoreIcon size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{s.name}</p>
                      <p className="truncate text-small text-muted">{s.ownerName ? `Owner: ${s.ownerName}` : 'Owner not added yet'}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-sm px-2 py-0.5 text-small font-semibold ${s.subscribed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {s.subscribed ? 'Subscribed' : s.paidUntil ? 'Ended' : 'Not paid yet'}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-small">
                  <div>
                    <dt className="text-muted">Category</dt>
                    <dd className="font-semibold">{s.category ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">City</dt>
                    <dd className="font-semibold">{s.city ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Plan</dt>
                    <dd className="font-semibold">
                      {s.paidUntil ? `${s.plan ? MERCHANT_PLANS[s.plan].name : 'Basic'} until ${fmtDate(s.paidUntil)}` : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">You earned</dt>
                    <dd className="font-semibold text-green-700">{rs(s.earned)}</dd>
                  </div>
                </dl>

                {s.address && (
                  <p className="flex items-start gap-1.5 text-small text-ink/80">
                    <PinIcon size={14} className="mt-0.5 shrink-0 text-purple-700" />
                    <span>{s.address.replace(/,\s*India$/i, '')}</span>
                  </p>
                )}
                {s.website && (
                  <a href={s.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1.5 truncate text-small font-semibold text-purple-700 hover:underline">
                    <GlobeIcon size={14} className="shrink-0" />
                    <span className="truncate">{s.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                  </a>
                )}
                <p className="text-small text-muted">Joined {fmtDate(s.joinedAt)}</p>
              </li>
            ))}
          </ul>
        </>
      )}
      <ModuleTerms id="shops" />
    </div>
  );
}

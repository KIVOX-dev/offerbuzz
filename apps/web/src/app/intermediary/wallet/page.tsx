'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAccount } from '@/components/account/AccountShell';
import { rs, useWallet } from '@/components/account/useWallet';
import { HistoryList, Stat } from '@/components/account/WalletParts';
import { ClockIcon, WalletIcon } from '@/components/Icons';
import { ApiRequestError, requestPayout } from '@/lib/api';

export default function IntermediaryWallet() {
  const router = useRouter();
  const { user } = useAccount();
  const { wallet, error: loadError, reload } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const pending = user.status === 'pending';

  async function askForPayout() {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const r = await requestPayout();
      setNotice(`Payout request for ${rs(r.credits)} sent. We will pay you and mark it as paid here.`);
      reload();
    } catch (e) {
      if (e instanceof ApiRequestError && e.code === 'SESSION_EXPIRED') return router.replace('/login');
      setError(e instanceof ApiRequestError ? e.message : 'Could not send the request');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-title font-bold">Wallet</h1>
        <p className="mt-1 text-muted">Credits you earn when shops you referred pay their subscription. 1 credit = Rs 1.</p>
      </div>

      {(loadError || error) && <p role="alert" className="text-small text-danger">{error ?? loadError}</p>}

      <section aria-label="Balances" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Balance" value={rs(wallet?.balance ?? 0)} hint="All credits in your wallet" icon={WalletIcon} tone="bg-purple-100 text-purple-700" />
        <Stat label="Available" value={rs(wallet?.available ?? 0)} hint={wallet ? `Payout from ${rs(wallet.payoutThreshold)}` : undefined} icon={WalletIcon} tone="bg-green-100 text-green-700" />
        <Stat label="On hold" value={rs(wallet?.onHold ?? 0)} hint={wallet ? `Released ${wallet.holdDays} days after each credit` : undefined} icon={ClockIcon} tone="bg-amber-100 text-amber-700" />
      </section>

      {wallet && (
        <section className="surface flex flex-wrap items-center justify-between gap-3 p-4" aria-label="Payout">
          <p className="text-small">
            {wallet.requested > 0
              ? `A payout request for ${rs(wallet.requested)} is waiting to be paid.`
              : wallet.requestable >= wallet.payoutThreshold
                ? `You can request ${rs(wallet.requestable)} now.`
                : `You can request a payout once ${rs(wallet.payoutThreshold)} is available. You have ${rs(wallet.requestable)}.`}
          </p>
          <button type="button" className="btn-primary" onClick={askForPayout}
            disabled={busy || pending || wallet.requested > 0 || wallet.requestable < wallet.payoutThreshold}>
            {busy ? 'Sending...' : 'Request payout'}
          </button>
        </section>
      )}
      {notice && <p role="status" className="text-small font-semibold text-green-700">{notice}</p>}

      <section aria-labelledby="history">
        <h2 id="history" className="mb-3 text-section font-bold">Wallet history</h2>
        {!wallet ? (
          <p className="text-muted">Loading...</p>
        ) : wallet.entries.length === 0 ? (
          <p className="surface p-4 text-muted">Nothing here yet. Credits appear when a referred shop pays.</p>
        ) : (
          <HistoryList entries={wallet.entries} />
        )}
      </section>
    </div>
  );
}

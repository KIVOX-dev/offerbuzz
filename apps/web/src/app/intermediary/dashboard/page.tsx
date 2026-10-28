'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { WalletResponse } from '@offerbuzz/shared';
import { useAccount } from '@/components/account/AccountShell';
import { QrCard } from '@/components/account/QrCard';
import { ApiRequestError, getWallet, requestPayout } from '@/lib/api';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const rs = (n: number) => `Rs ${n.toLocaleString('en-IN')}`;

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface p-4">
      <p className="text-small text-muted">{label}</p>
      <p className="mt-1 text-title font-bold">{value}</p>
      {hint && <p className="mt-1 text-small text-muted">{hint}</p>}
    </div>
  );
}

const REASON: Record<string, string> = { subscription: 'Shop subscription', payout: 'Payout', adjustment: 'Adjustment' };

export default function IntermediaryDashboard() {
  const router = useRouter();
  const { user } = useAccount();
  const [wallet, setWallet] = useState<WalletResponse>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>();
  const pending = user.status === 'pending';

  const load = useCallback(() => {
    getWallet()
      .then(setWallet)
      .catch((e) => {
        if (e instanceof ApiRequestError && e.code === 'SESSION_EXPIRED') return router.replace('/login');
        setError(e instanceof ApiRequestError ? e.message : 'Could not load your wallet');
      });
  }, [router]);

  useEffect(load, [load]);

  async function askForPayout() {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const r = await requestPayout();
      setNotice(`Payout request for ${rs(r.credits)} sent. We will pay you and mark it as paid here.`);
      load();
    } catch (e) {
      if (e instanceof ApiRequestError && e.code === 'SESSION_EXPIRED') return router.replace('/login');
      setError(e instanceof ApiRequestError ? e.message : 'Could not send the request');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-md bg-hero p-5 text-white shadow-glow md:p-6">
        <span className="badge-discount !bg-accent !text-ink">Intermediary account</span>
        <h1 className="mt-3 text-title font-bold">Welcome, {user.name || 'partner'}!</h1>
        <p className="mt-1 max-w-xl text-purple-100">
          Share your QR code with shops. When a shop you referred pays its monthly subscription, credits are added to
          your wallet.
        </p>
      </section>

      {pending && (
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-small text-amber-900">
          Your account is waiting for approval by our team. You will get an email when it is approved.
        </p>
      )}

      <section aria-labelledby="wallet">
        <h2 id="wallet" className="mb-3 text-section font-bold">Your wallet</h2>
        {error && <p role="alert" className="mb-3 text-small text-danger">{error}</p>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Balance" value={rs(wallet?.balance ?? 0)} hint="1 credit = Rs 1" />
          <Stat label="Available" value={rs(wallet?.available ?? 0)}
            hint={wallet ? `Payout from ${rs(wallet.payoutThreshold)}` : undefined} />
          <Stat label="On hold" value={rs(wallet?.onHold ?? 0)}
            hint={wallet ? `Released ${wallet.holdDays} days after each credit` : undefined} />
          <Stat label="Shops referred" value={String(wallet?.shops.length ?? 0)}
            hint={wallet ? `${wallet.commissionCredits} credits per paid month` : undefined} />
        </div>

        {wallet && (
          <div className="surface mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
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
          </div>
        )}
        {notice && <p role="status" className="mt-2 text-small font-semibold text-green-700">{notice}</p>}
      </section>

      <QrCard
        title="Your referral QR code"
        blurb="A shop that scans this opens the vendor sign up with your code already filled in. It is unique to your account."
        target="vendor-signup"
      />

      <section aria-labelledby="shops">
        <h2 id="shops" className="mb-3 text-section font-bold">Shops you referred</h2>
        {!wallet ? (
          <p className="text-muted">Loading...</p>
        ) : wallet.shops.length === 0 ? (
          <p className="surface p-4 text-muted">No shops yet. Share your QR code to get started.</p>
        ) : (
          <ul className="surface divide-y divide-purple-100">
            {wallet.shops.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 p-3">
                <span className="font-semibold">{s.name}</span>
                <span className="text-small text-muted">Joined {fmtDate(s.joinedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="history">
        <h2 id="history" className="mb-3 text-section font-bold">Wallet history</h2>
        {!wallet ? null : wallet.entries.length === 0 ? (
          <p className="surface p-4 text-muted">Nothing here yet. Credits appear when a referred shop pays.</p>
        ) : (
          <ul className="surface divide-y divide-purple-100">
            {wallet.entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {REASON[e.reason] ?? e.reason}
                    {e.shop ? `: ${e.shop}` : ''}
                  </p>
                  <p className="text-small text-muted">
                    {fmtDate(e.createdAt)}
                    {e.kind === 'credit' && new Date(e.availableAt).getTime() > Date.now()
                      ? ` · available from ${fmtDate(e.availableAt)}`
                      : ''}
                  </p>
                </div>
                <span className={`shrink-0 font-bold ${e.kind === 'credit' ? 'text-green-700' : 'text-danger'}`}>
                  {e.kind === 'credit' ? '+' : '-'}
                  {e.credits}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

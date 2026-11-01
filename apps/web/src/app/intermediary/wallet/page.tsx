'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { payoutRequestSchema } from '@offerbuzz/shared';
import { useAccount } from '@/components/account/AccountShell';
import { rs, useWallet } from '@/components/account/useWallet';
import { HistoryList, Stat } from '@/components/account/WalletParts';
import { ModuleTerms } from '@/components/ModuleTerms';
import { DuoClockIcon, DuoWalletIcon } from '@/components/Icons';
import { ApiRequestError, requestPayout } from '@/lib/api';

export default function IntermediaryWallet() {
  const router = useRouter();
  const { user } = useAccount();
  const { wallet, error: loadError, reload } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const pending = user.status === 'pending';

  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [upiNumber, setUpiNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [formError, setFormError] = useState<string>();

  async function askForPayout(e: FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    const parsed = payoutRequestSchema.safeParse(
      method === 'upi' ? { method, upiNumber } : { method, accountName, accountNumber, ifsc },
    );
    if (!parsed.success) return setFormError(parsed.error.issues[0]?.message ?? 'Check the details');
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const r = await requestPayout(parsed.data);
      setNotice(`Payout request for ${rs(r.credits)} sent to the admin. We will pay you and mark it as paid here.`);
      setOpen(false);
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
        <Stat label="Balance" value={rs(wallet?.balance ?? 0)} hint="All credits in your wallet" icon={DuoWalletIcon} tone="bg-purple-100 text-purple-700" />
        <Stat label="Available" value={rs(wallet?.available ?? 0)} hint={wallet ? `Payout from ${rs(wallet.payoutThreshold)}` : undefined} icon={DuoWalletIcon} tone="bg-green-100 text-green-700" />
        <Stat label="On hold" value={rs(wallet?.onHold ?? 0)} hint={wallet ? `Released ${wallet.holdDays} days after each credit` : undefined} icon={DuoClockIcon} tone="bg-amber-100 text-amber-700" />
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
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}
            disabled={busy || pending || wallet.requested > 0 || wallet.requestable < wallet.payoutThreshold}>
            Request payout
          </button>
        </section>
      )}

      {open && wallet && (
        <div role="dialog" aria-modal="true" aria-labelledby="payout-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && !busy && setOpen(false)}>
          <form onSubmit={askForPayout} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 shadow-card sm:max-w-md sm:rounded-2xl">
            <h2 id="payout-title" className="text-section font-bold">Request payout</h2>
            <p className="mt-1 text-small text-muted">{rs(wallet.requestable)} will be sent to the admin for payment.</p>

            <div role="radiogroup" aria-label="Payment method" className="mt-4 grid grid-cols-2 gap-2">
              {(['upi', 'bank'] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
                  className={`chip justify-center ${method === m ? 'chip-active' : ''}`}>
                  {m === 'upi' ? 'UPI' : 'Bank transfer'}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {method === 'upi' ? (
                <label className="block text-small font-semibold">
                  UPI mobile number
                  <input className="input mt-1 w-full" inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder="10 digit number"
                    value={upiNumber} onChange={(e) => setUpiNumber(e.target.value.replace(/\D/g, ''))} />
                </label>
              ) : (
                <>
                  <label className="block text-small font-semibold">
                    Account holder name
                    <input className="input mt-1 w-full" autoComplete="name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                  </label>
                  <label className="block text-small font-semibold">
                    Account number
                    <input className="input mt-1 w-full" inputMode="numeric" maxLength={18} value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} />
                  </label>
                  <label className="block text-small font-semibold">
                    IFSC code
                    <input className="input mt-1 w-full uppercase" maxLength={11} placeholder="SBIN0001234" value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())} />
                  </label>
                </>
              )}
            </div>

            {formError && <p role="alert" className="mt-3 text-small text-danger">{formError}</p>}

            <div className="mt-5 flex gap-2">
              <button type="button" className="btn-outline flex-1" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>{busy ? 'Sending...' : 'Send to admin'}</button>
            </div>
          </form>
        </div>
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

      <ModuleTerms id="wallet" defaultOpen />
    </div>
  );
}

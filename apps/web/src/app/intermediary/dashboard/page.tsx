'use client';

import Link from 'next/link';
import { Spinner } from '@/components/PageLoader';
import { useAccount } from '@/components/account/AccountShell';
import { rs, useWallet } from '@/components/account/useWallet';
import { HistoryList, Stat } from '@/components/account/WalletParts';
import { DuoClockIcon, DuoStoreIcon, DuoWalletIcon, QrIcon } from '@/components/Icons';

export default function IntermediaryDashboard() {
  const { user } = useAccount();
  const { wallet, error } = useWallet();
  const pending = user.status === 'pending';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-hero p-5 text-white shadow-glow md:p-6">
        <div className="min-w-0">
          <h1 className="text-title font-bold">Welcome, {user.name || 'partner'}!</h1>
          <p className="mt-1 max-w-xl text-purple-100">
            Share your QR code with shops. When a shop you referred pays its monthly subscription, credits are added to your wallet.
          </p>
        </div>
        <Link href="/intermediary/qr" className="btn-accent gap-2">
          <QrIcon size={18} /> Show my QR code
        </Link>
      </section>

      {pending && (
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-small text-amber-900">
          Your account is waiting for approval by our team. You will get an email when it is approved.
        </p>
      )}
      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      <section aria-label="Overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Balance" value={rs(wallet?.balance ?? 0)} hint="1 credit = Rs 1" icon={DuoWalletIcon} tone="bg-purple-100 text-purple-700" />
        <Stat label="Available" value={rs(wallet?.available ?? 0)} hint="Ready to withdraw" icon={DuoWalletIcon} tone="bg-green-100 text-green-700" />
        <Stat label="On hold" value={rs(wallet?.onHold ?? 0)} hint={wallet ? `Released after ${wallet.holdDays} days` : undefined} icon={DuoClockIcon} tone="bg-amber-100 text-amber-700" />
        <Stat label="Shops referred" value={String(wallet?.shops.length ?? 0)} hint={wallet ? `${wallet.commissionCredits} credits per paid month` : undefined} icon={DuoStoreIcon} tone="bg-sky-100 text-sky-700" />
      </section>

      <section aria-labelledby="recent">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent" className="text-section font-bold">Recent wallet activity</h2>
          <Link href="/intermediary/wallet" className="text-small font-semibold text-purple-700 underline">View wallet</Link>
        </div>
        {!wallet ? (
          <Spinner label="Loading your wallet" />
        ) : wallet.entries.length === 0 ? (
          <p className="surface p-4 text-muted">Nothing yet. Credits appear when a referred shop pays.</p>
        ) : (
          <HistoryList entries={wallet.entries.slice(0, 5)} />
        )}
      </section>
    </div>
  );
}

'use client';

import { useAccount } from '@/components/account/AccountShell';
import { QrCard } from '@/components/account/QrCard';

// Placeholder until the Phase 5 referral wallet. Shows approval status and the personal referral QR.
export default function IntermediaryDashboard() {
  const { user } = useAccount();
  const pending = user.status === 'pending';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-md bg-hero p-5 text-white shadow-glow md:p-6">
        <span className="badge-discount !bg-accent !text-ink">Intermediary account</span>
        <h1 className="mt-3 text-title font-bold">Welcome, {user.name || 'partner'}!</h1>
        <p className="mt-1 max-w-xl text-purple-100">
          Refer shops to OfferBuzz and earn credits. The referral wallet and shop list are coming soon.
        </p>
      </section>

      {pending && (
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-small text-amber-900">
          Your account is waiting for approval by our team. You will get an email when it is approved.
        </p>
      )}

      <QrCard
        title="Your referral QR code"
        blurb="Shops that join through this code are linked to you. It is unique to your account."
      />
    </div>
  );
}

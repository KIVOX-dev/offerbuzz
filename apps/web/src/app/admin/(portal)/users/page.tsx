'use client';

import { useAccount } from '@/components/account/AccountShell';

// Placeholder until the admin tools (offer approval, intermediary approval, payouts).
export default function AdminHome() {
  const { user } = useAccount();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-md bg-hero p-5 text-white shadow-glow md:p-6">
        <span className="badge-discount !bg-accent !text-ink">Admin</span>
        <h1 className="mt-3 text-title font-bold">Welcome, {user.name || user.email}</h1>
        <p className="mt-1 max-w-xl text-purple-100">
          Offer approval, intermediary approval and payouts will appear here.
        </p>
      </section>
    </div>
  );
}

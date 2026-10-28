'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserDTO } from '@offerbuzz/shared';
import { Logo } from '@/components/Logo';
import { TagIcon, UserIcon } from '@/components/Icons';
import { api } from '@/lib/api';
import { clearSession, loadSession } from '@/lib/session';

// Placeholder until the Phase 2 vendor tools. Only the signed in vendor sees it.
export default function MerchantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserDTO>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (!s) return router.replace('/login');
    if (s.user.role !== 'merchant') return router.replace('/');
    setUser(s.user);
  }, [router]);

  const logout = async () => {
    setBusy(true);
    const s = loadSession();
    // best effort: the local session is cleared even if the server cannot be reached
    if (s) await api('/auth/logout', { method: 'POST', json: { refreshToken: s.refreshToken } }).catch(() => undefined);
    clearSession();
    router.replace('/login');
  };

  if (!user) return null;

  return (
    <main>
      <div className="h-1 bg-brand" aria-hidden />
      <header className="border-b border-purple-100 bg-card">
        <div className="container-page flex h-header-sm items-center justify-between md:h-header">
          <Link href="/" aria-label="OfferBuzz home">
            <Logo height={36} />
          </Link>
          <button type="button" className="btn-ghost gap-2" onClick={logout} disabled={busy}>
            <UserIcon /> {busy ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      <section className="container-page py-4 md:py-6">
        <div className="rounded-md bg-hero p-6 text-white shadow-glow md:p-8">
          <span className="badge-discount !bg-accent !text-ink">Vendor account</span>
          <h1 className="mt-3 text-title font-bold">Welcome, {user.name || 'vendor'}!</h1>
          <p className="mt-2 max-w-xl text-purple-100">
            Your account is ready. The vendor tools for posting and managing offers are coming soon.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn-accent gap-2" disabled title="Coming soon">
              <TagIcon /> Post your offer
            </button>
            <Link href="/" className="btn border border-white/40 text-white hover:bg-white/10">
              Browse offers
            </Link>
          </div>
        </div>
        <p className="mt-3 text-small text-muted">Signed in as {user.email}</p>
      </section>
    </main>
  );
}

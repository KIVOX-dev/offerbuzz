'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AccountShell, type NavItem } from '@/components/account/AccountShell';
import { APPROVALS_EVENT } from '@/components/admin/approvals';
import { CheckBadgeIcon, DashboardIcon, OffersIcon, TagIcon, UsersIcon, WalletIcon } from '@/components/Icons';
import { getAdminOverview } from '@/lib/api';

// Route group: keeps /admin/login outside this signed in shell while pages here still live at /admin/...
export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  // offers + intermediaries waiting: shown as a bubble on the Approvals item
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      getAdminOverview()
        .then((o) => alive && setWaiting(o.pendingOffers + o.intermediaries.pendingApproval))
        .catch(() => undefined);
    refresh();
    const timer = setInterval(refresh, 60_000);
    window.addEventListener(APPROVALS_EVENT, refresh);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener(APPROVALS_EVENT, refresh);
    };
  }, []);

  const nav: NavItem[] = [
    { href: '/admin/dashboard', label: 'Overview', icon: DashboardIcon },
    { href: '/admin/approvals', label: 'Approvals', icon: CheckBadgeIcon, badge: waiting },
    { href: '/admin/users', label: 'Users', icon: UsersIcon },
    { href: '/admin/offers', label: 'Offers', icon: OffersIcon },
    { href: '/admin/banners', label: 'Home cards', icon: TagIcon },
    { href: '/admin/categories', label: 'Categories', icon: TagIcon },
    { href: '/admin/wallets', label: 'Wallets & payouts', icon: WalletIcon },
  ];

  return (
    <AccountShell role="admin" title="Admin" nav={nav} loginPath="/admin/login">
      {children}
    </AccountShell>
  );
}

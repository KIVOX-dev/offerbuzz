'use client';

import type { ReactNode } from 'react';
import { AccountShell, type NavItem } from '@/components/account/AccountShell';
import { DashboardIcon, OffersIcon, UsersIcon, WalletIcon } from '@/components/Icons';

const NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Overview', icon: DashboardIcon },
  { href: '/admin/users', label: 'Users', icon: UsersIcon },
  { href: '/admin/offers', label: 'Offers', icon: OffersIcon },
  { href: '/admin/wallets', label: 'Wallets & payouts', icon: WalletIcon },
];

// Route group: keeps /admin/login outside this signed in shell while pages here still live at /admin/...
export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  return (
    <AccountShell role="admin" title="Admin" nav={NAV} loginPath="/admin/login">
      {children}
    </AccountShell>
  );
}

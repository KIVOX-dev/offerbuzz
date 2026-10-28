'use client';

import type { ReactNode } from 'react';
import { AccountShell, type NavItem } from '@/components/account/AccountShell';
import { DashboardIcon, QrIcon, StoreIcon, UserIcon, WalletIcon } from '@/components/Icons';

const NAV: NavItem[] = [
  { href: '/intermediary/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/intermediary/wallet', label: 'Wallet', icon: WalletIcon },
  { href: '/intermediary/qr', label: 'My QR code', icon: QrIcon },
  { href: '/intermediary/shops', label: 'Shops referred', icon: StoreIcon },
  { href: '/intermediary/profile', label: 'Profile', icon: UserIcon },
];

export default function IntermediaryLayout({ children }: { children: ReactNode }) {
  return (
    <AccountShell role="intermediary" title="Intermediary" nav={NAV}>
      {children}
    </AccountShell>
  );
}

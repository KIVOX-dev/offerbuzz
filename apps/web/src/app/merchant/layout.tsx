'use client';

import type { ReactNode } from 'react';
import { AccountShell, type NavItem } from '@/components/account/AccountShell';
import { DashboardIcon, PlusIcon, UserIcon } from '@/components/Icons';

const NAV: NavItem[] = [
  { href: '/merchant/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/merchant/offers/new', label: 'Post an offer', icon: PlusIcon },
  { href: '/merchant/profile', label: 'Profile', icon: UserIcon },
];

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <AccountShell role="merchant" title="Merchant" nav={NAV} profile={{ path: '/merchant/profile', complete: (u) => Boolean(u.shopName && u.location && u.category) }}>
      {children}
    </AccountShell>
  );
}

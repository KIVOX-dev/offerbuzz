'use client';

import type { ReactNode } from 'react';
import { AccountShell, type NavItem } from '@/components/account/AccountShell';
import { DashboardIcon } from '@/components/Icons';

const NAV: NavItem[] = [{ href: '/admin/users', label: 'Overview', icon: DashboardIcon }];

// Route group: keeps /admin/login outside this signed in shell while pages here still live at /admin/...
export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  return (
    <AccountShell role="admin" title="Admin" nav={NAV} loginPath="/admin/login">
      {children}
    </AccountShell>
  );
}

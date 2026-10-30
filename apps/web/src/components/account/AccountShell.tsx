'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import type { Role, UserDTO } from '@offerbuzz/shared';
import { api, authApi, ApiRequestError } from '@/lib/api';
import { clearSession, homeFor, loadSession, saveSession } from '@/lib/session';
import { Logo } from '../Logo';
import { LogoutIcon } from '../Icons';

export type NavItem = { href: string; label: string; icon: ComponentType<{ size?: number }> };

type AccountCtx = { user: UserDTO; setUser: (u: UserDTO) => void };
const Ctx = createContext<AccountCtx | undefined>(undefined);

export function useAccount(): AccountCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAccount must be used inside AccountShell');
  return v;
}

/**
 * Signed in area for one role: sidebar on desktop, a scrolling tab bar on phones.
 * Sends signed out people to /login and people with another role to their own home.
 */
export function AccountShell({
  role,
  title,
  nav,
  loginPath = '/login',
  children,
}: {
  role: Role;
  title: string;
  nav: NavItem[];
  /** where signed out people (and logout) go */
  loginPath?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState<UserDTO>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (!s) return router.replace(loginPath);
    if (s.user.role !== role) return router.replace(homeFor(s.user.role));
    setUserState(s.user);
    // the saved copy is from login time: re-read the account so approval, blocks and profile edits show up
    authApi<{ user: UserDTO }>('/me')
      .then(({ user: fresh }) => {
        const merged = { ...s.user, ...fresh };
        saveSession({ ...s, user: merged });
        setUserState(merged);
      })
      .catch((e) => {
        if (e instanceof ApiRequestError && e.code === 'SESSION_EXPIRED') router.replace(loginPath);
      });
  }, [role, router, loginPath]);

  const setUser = (u: UserDTO) => {
    const s = loadSession();
    if (s) saveSession({ ...s, user: u });
    setUserState(u);
  };

  const logout = async () => {
    setBusy(true);
    const s = loadSession();
    // best effort: the local session is cleared even if the server cannot be reached
    if (s) await api('/auth/logout', { method: 'POST', json: { refreshToken: s.refreshToken } }).catch(() => undefined);
    clearSession();
    router.replace(loginPath);
  };

  if (!user) return null;

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Ctx.Provider value={{ user, setUser }}>
      <div className="min-h-screen bg-page">
        <div className="h-1 bg-brand" aria-hidden />
        <header className="sticky top-0 z-20 border-b border-purple-100 bg-card">
          <div className="flex h-header-sm items-center justify-between px-3 md:h-header md:px-6">
            <Link href="/" aria-label="OfferBuzz home">
              <Logo height={44} />
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden text-small text-muted sm:inline">{user.name || user.email}</span>
              <button type="button" className="btn-ghost btn-sm gap-2" onClick={logout} disabled={busy}>
                <LogoutIcon size={18} /> {busy ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
          <nav aria-label={title} className="flex gap-1 overflow-x-auto border-t border-purple-100 px-3 py-1 [scrollbar-width:none] md:hidden">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`chip shrink-0 gap-2 ${active(href) ? 'chip-active' : ''}`}>
                <Icon size={16} /> {label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="md:flex">
          <aside className="sticky top-[calc(theme(height.header)+4px)] hidden h-[calc(100vh-theme(height.header)-4px)] w-60 shrink-0 border-r border-purple-100 bg-card p-3 md:block">
            <p className="px-3 pb-2 text-small font-semibold uppercase tracking-wide text-muted">{title}</p>
            <nav aria-label={title} className="space-y-1">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={active(href) ? 'page' : undefined}
                  className={`flex min-h-touch items-center gap-3 rounded-md px-3 text-body font-semibold transition ${
                    active(href) ? 'bg-purple-100 text-purple-800' : 'text-ink hover:bg-purple-50'
                  }`}
                >
                  <Icon size={20} /> {label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 flex-1 px-3 py-4 md:px-6 md:py-6">{children}</main>
        </div>
      </div>
    </Ctx.Provider>
  );
}

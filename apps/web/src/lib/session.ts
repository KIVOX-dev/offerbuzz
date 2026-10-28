import type { AuthResponse } from '@offerbuzz/shared';

const KEY = 'offerbuzz.session';

/**
 * Phase 1 keeps tokens in localStorage. Consider moving the refresh token to an httpOnly cookie
 * (set by a Next route handler) before launch; noted in the README hardening list.
 */
export function saveSession(s: AuthResponse): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage blocked: user simply stays logged out on reload */
  }
}

export function loadSession(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const homeFor = (role: AuthResponse['user']['role']): string =>
  ({ merchant: '/merchant/dashboard', intermediary: '/intermediary/dashboard', admin: '/admin/dashboard', customer: '/' })[role];

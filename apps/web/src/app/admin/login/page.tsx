'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { PasswordInput } from '@/components/PasswordInput';
import { ApiRequestError, adminLogin } from '@/lib/api';
import { clearSession, loadSession, saveSession } from '@/lib/session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // already signed in as admin: skip the form
  useEffect(() => {
    if (loadSession()?.user.role === 'admin') router.replace('/admin/dashboard');
  }, [router]);

  const valid = EMAIL_RE.test(email.trim()) && password.length >= 8;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError('');
    try {
      const session = await adminLogin(email.trim().toLowerCase(), password);
      saveSession(session);
      router.push('/admin/dashboard');
    } catch (err) {
      clearSession();
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong, please try again');
      setBusy(false);
    }
  }

  return (
    <main className="container-page flex min-h-screen flex-col items-center justify-center py-8">
      <Logo height={48} />
      <h1 className="mt-4 text-title font-bold">Admin sign in</h1>
      <p className="mt-1 text-muted">Authorised team members only</p>

      <form onSubmit={submit} className="surface mt-6 w-full max-w-sm space-y-4 p-6" noValidate>
        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="admin-email">
            Email
          </label>
          <input id="admin-email" className="input" type="email" inputMode="email" autoComplete="username"
            placeholder="admin@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="admin-password">
            Password
          </label>
          <PasswordInput id="admin-password" autoComplete="current-password" placeholder="Your password" value={password}
            onChange={(e) => setPassword(e.target.value)} maxLength={128} />
        </div>

        <button className="btn-primary w-full" disabled={busy || !valid}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}
      </form>

      <a href="/" className="mt-6 text-small text-muted underline">
        Back to OfferBuzz
      </a>
    </main>
  );
}

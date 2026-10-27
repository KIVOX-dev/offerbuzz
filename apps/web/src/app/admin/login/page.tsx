'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiRequestError, adminLogin } from '@/lib/api';
import { saveSession } from '@/lib/session';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      saveSession(await adminLogin(email, password));
      router.push('/admin/users');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-page py-8">
      <form onSubmit={submit} className="mx-auto w-full max-w-sm space-y-3 rounded-md bg-card p-4 shadow-card">
        <h1 className="text-section font-bold">Admin sign in</h1>
        <input className="input" type="email" autoComplete="username" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" autoComplete="current-password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        {error && <p role="alert" className="text-small text-danger">{error}</p>}
      </form>
    </main>
  );
}

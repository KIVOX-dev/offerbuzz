'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiRequestError, sendOtp, verifyOtp, type AuthMode } from '@/lib/api';
import { homeFor, saveSession } from '@/lib/session';
import { BackButton } from './BackButton';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OtpLogin({ role, onBack }: { role: 'merchant' | 'intermediary'; onBack: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ code: string; message: string }>();
  const [devOtp, setDevOtp] = useState<string>();

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const roleLabel = role === 'merchant' ? 'Vendor' : 'Intermediary';
  const detailsValid = EMAIL_RE.test(cleanEmail) && (mode === 'signin' || cleanName.length >= 2);

  function switchMode(next: AuthMode) {
    setMode(next);
    setStep('details');
    setCode('');
    setError(undefined);
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? { code: e.code, message: e.message }
          : { code: 'UNKNOWN', message: 'Something went wrong, please try again' },
      );
    } finally {
      setBusy(false);
    }
  }

  const requestCode = () =>
    run(async () => {
      const res = await sendOtp(cleanEmail, mode, role);
      setDevOtp(res.devOtp);
      setStep('code');
    });

  const confirm = () =>
    run(async () => {
      const session = await verifyOtp({
        email: cleanEmail,
        code,
        mode,
        role,
        name: mode === 'signup' ? cleanName : undefined,
      });
      saveSession(session);
      router.push(homeFor(session.user.role));
    });

  return (
    <div className="surface mx-auto w-full max-w-sm p-4">
      {step === 'code' ? (
        <BackButton onClick={() => { setStep('details'); setCode(''); setError(undefined); }}>Edit email</BackButton>
      ) : (
        <BackButton onClick={onBack}>Change role</BackButton>
      )}
      <h2 className="mt-1 text-section font-bold">{roleLabel} account</h2>

      <div role="tablist" className="mt-3 grid grid-cols-2 rounded-md bg-purple-100 p-1">
        {(['signup', 'signin'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`min-h-touch rounded-sm text-body font-semibold transition ${
              mode === m ? 'bg-card text-purple-800 shadow-card' : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            {m === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
        ))}
      </div>

      {step === 'details' ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void requestCode();
          }}
        >
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-small font-semibold" htmlFor="name">
                Your name
              </label>
              <input id="name" className="input" autoComplete="name" value={name}
                onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={80} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="email">
              Email (Gmail or any email)
            </label>
            <input id="email" className="input" type="email" inputMode="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="yourname@gmail.com" />
          </div>
          <button className="btn-primary w-full" disabled={busy || !detailsValid}>
            {busy ? 'Sending...' : mode === 'signup' ? 'Create account' : 'Email me a code'}
          </button>
        </form>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
        >
          <label className="block text-small font-semibold" htmlFor="code">
            Enter the 6 digit code sent to {cleanEmail}
          </label>
          <input id="code" className="input tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code"
            maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          {devOtp && <p className="text-small text-muted">Dev mode code: {devOtp}</p>}
          <button className="btn-primary w-full" disabled={busy || code.length !== 6}>
            {busy ? 'Verifying...' : 'Verify and continue'}
          </button>
        </form>
      )}

      {error && (
        <div role="alert" className="mt-3 text-small text-danger">
          {error.message}{' '}
          {error.code === 'ACCOUNT_NOT_FOUND' && (
            <button className="font-semibold underline" onClick={() => switchMode('signup')}>
              Sign up
            </button>
          )}
          {error.code === 'ACCOUNT_EXISTS' && (
            <button className="font-semibold underline" onClick={() => switchMode('signin')}>
              Sign in
            </button>
          )}
        </div>
      )}
    </div>
  );
}

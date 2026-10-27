'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizePhone } from '@offerbuzz/shared';
import { ApiRequestError, sendOtp, verifyOtp } from '@/lib/api';
import { homeFor, saveSession } from '@/lib/session';

export function OtpLogin({ role, onBack }: { role: 'merchant' | 'intermediary'; onBack: () => void }) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState<string>();

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Something went wrong, please try again');
    } finally {
      setBusy(false);
    }
  }

  const requestCode = () =>
    run(async () => {
      const normalized = normalizePhone(phone);
      if (!normalized) throw new ApiRequestError(400, 'VALIDATION_ERROR', 'Enter a valid 10 digit mobile number');
      const res = await sendOtp(normalized);
      setDevOtp(res.devOtp);
      setStep('code');
    });

  const confirm = () =>
    run(async () => {
      const normalized = normalizePhone(phone) as string;
      const session = await verifyOtp({ phone: normalized, code, role });
      saveSession(session);
      router.push(homeFor(session.user.role));
    });

  return (
    <div className="mx-auto w-full max-w-sm rounded-md bg-card p-4 shadow-card">
      <button onClick={onBack} className="min-h-touch text-small font-semibold text-muted">
        &larr; Change role
      </button>
      <h2 className="mt-1 text-section font-bold">
        {role === 'merchant' ? 'Vendor' : 'Intermediary'} login
      </h2>

      {step === 'phone' ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void requestCode();
          }}
        >
          <label className="block text-small font-semibold" htmlFor="phone">
            Mobile number
          </label>
          <div className="flex gap-2">
            <span className="flex h-btn items-center rounded-md border border-border bg-page px-3">+91</span>
            <input id="phone" className="input" inputMode="numeric" autoComplete="tel-national" maxLength={10}
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="9876543210" />
          </div>
          <button className="btn-primary w-full" disabled={busy || phone.length !== 10}>
            {busy ? 'Sending...' : 'Send code'}
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
            Enter the 6 digit code sent to +91 {phone}
          </label>
          <input id="code" className="input tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code"
            maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          {devOtp && <p className="text-small text-muted">Dev mode code: {devOtp}</p>}
          <button className="btn-primary w-full" disabled={busy || code.length !== 6}>
            {busy ? 'Verifying...' : 'Verify and continue'}
          </button>
          <button type="button" className="btn-outline w-full" onClick={() => { setStep('phone'); setCode(''); }}>
            Use a different number
          </button>
        </form>
      )}

      {error && <p role="alert" className="mt-3 text-small text-danger">{error}</p>}
    </div>
  );
}

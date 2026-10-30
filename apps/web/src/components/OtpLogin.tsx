'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, type AuthResponse } from '@offerbuzz/shared';
import { ApiRequestError, googleLogin, lookupReferral, passwordLogin, sendOtp, setPassword, verifyOtp, type AuthMode } from '@/lib/api';
import { homeFor, saveSession } from '@/lib/session';
import { BackButton } from './BackButton';
import { GoogleButton } from './GoogleButton';
import { Select } from './Select';
import { PasswordInput } from './PasswordInput';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Same rule as the API: 8+ characters with a letter and a number. Returns the problem, or undefined. */
function passwordProblem(pw: string): string | undefined {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(pw)) return 'Password needs at least one letter';
  if (!/\d/.test(pw)) return 'Password needs at least one number';
  return undefined;
}

export function OtpLogin({
  role,
  onBack,
  initialReferral = '',
  initialMode = 'signup',
  bare = false,
}: {
  role: 'merchant' | 'intermediary';
  onBack: () => void;
  initialReferral?: string;
  initialMode?: AuthMode;
  /** no card around the form, for the split layout login page */
  bare?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [referral, setReferral] = useState(initialReferral);
  // undefined = not checked yet (or the box is not a full code)
  const [referrer, setReferrer] = useState<{ valid: boolean; name?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  // signin normally uses a password; "forgot password" switches it to an emailed code
  const [useCode, setUseCode] = useState(false);
  const [step, setStep] = useState<'details' | 'code' | 'password'>('details');
  // verified by the code, but only saved as the login once the password is set
  const [pending, setPending] = useState<AuthResponse>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ code: string; message: string }>();
  const [devOtp, setDevOtp] = useState<string>();

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const roleLabel = role === 'merchant' ? 'Vendor' : 'Intermediary';
  const passwordSignin = mode === 'signin' && !useCode;
  const showReferral = mode === 'signup' && role === 'merchant';
  const needsCategory = showReferral; // vendors pick their shop category when they sign up
  const cleanReferral = referral.trim().toUpperCase();
  const referralOk = !showReferral || cleanReferral === '' || referrer?.valid === true;
  const detailsValid =
    EMAIL_RE.test(cleanEmail) &&
    referralOk &&
    (!needsCategory || category !== '') &&
    (mode === 'signup' ? cleanName.length >= 2 : !passwordSignin || password.length > 0);
  const newPasswordError = password ? passwordProblem(password) : undefined;
  const mismatch = confirm.length > 0 && confirm !== password;
  const passwordValid = !passwordProblem(password) && password === confirm;

  // confirm the referral code as soon as a full 8 character code is in the box
  useEffect(() => {
    setReferrer(undefined);
    if (cleanReferral.length !== 8) return;
    let stale = false;
    lookupReferral(cleanReferral).then((r) => !stale && setReferrer(r)).catch(() => !stale && setReferrer(undefined));
    return () => {
      stale = true;
    };
  }, [cleanReferral]);

  function reset(next: { mode?: AuthMode; useCode?: boolean } = {}) {
    if (next.mode) setMode(next.mode);
    setUseCode(next.useCode ?? false);
    setStep('details');
    setCode('');
    setPasswordValue('');
    setConfirm('');
    setPending(undefined);
    setError(undefined);
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      if (e instanceof ApiRequestError && (e.code === 'ACCOUNT_NOT_FOUND' || e.code === 'ACCOUNT_EXISTS')) {
        // no account: move to Sign up. Already registered: move to Sign in. The typed email stays.
        reset({ mode: e.code === 'ACCOUNT_NOT_FOUND' ? 'signup' : 'signin' });
        setError({
          code: e.code,
          message:
            e.code === 'ACCOUNT_NOT_FOUND'
              ? 'No account found with this email, so we moved you to Sign up. Add your name to create one.'
              : 'This email is already registered, so we moved you to Sign in.',
        });
      } else {
        setError(
          e instanceof ApiRequestError
            ? { code: e.code, message: e.message }
            : { code: 'UNKNOWN', message: 'Something went wrong, please try again' },
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const finish = (session: AuthResponse) => {
    saveSession(session);
    router.push(homeFor(session.user.role));
  };

  const requestCode = () =>
    run(async () => {
      const res = await sendOtp(cleanEmail, mode, role);
      setDevOtp(res.devOtp);
      setStep('code');
    });

  const confirmCode = () =>
    run(async () => {
      const session = await verifyOtp({
        email: cleanEmail,
        code,
        mode,
        role,
        name: mode === 'signup' ? cleanName : undefined,
        referralCode: showReferral && cleanReferral ? cleanReferral : undefined,
        category: needsCategory ? category : undefined,
      });
      // new accounts, and anyone resetting a forgotten password, must choose a password next
      setPending(session);
      setPasswordValue('');
      setConfirm('');
      setStep('password');
    });

  const savePassword = () =>
    run(async () => {
      if (!pending) return;
      await setPassword(pending.accessToken, password);
      finish({ ...pending, user: { ...pending.user, hasPassword: true } });
    });

  const signInWithPassword = () =>
    run(async () => {
      finish(await passwordLogin(cleanEmail, password));
    });

  const signInWithGoogle = (idToken: string) =>
    run(async () => {
      finish(await googleLogin(idToken, role));
    });
  const googleError = (message: string) => setError({ code: 'GOOGLE', message });

  const submitDetails = () => (passwordSignin ? signInWithPassword() : requestCode());

  return (
    <div className={bare ? 'w-full' : 'surface mx-auto w-full max-w-sm p-4'}>
      {step === 'password' ? null : step === 'code' ? (
        <BackButton onClick={() => { setStep('details'); setCode(''); setError(undefined); }}>Edit email</BackButton>
      ) : (
        <BackButton onClick={onBack}>Change role</BackButton>
      )}
      {!bare && <h2 className="mt-1 text-section font-bold">{roleLabel} account</h2>}

      {step !== 'password' && (
        <div role="tablist" className={`grid grid-cols-2 rounded-md bg-purple-100 p-1 ${bare ? 'mt-2' : 'mt-3'}`}>
          {(['signup', 'signin'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => reset({ mode: m })}
              className={`min-h-touch rounded-sm text-body font-semibold transition ${
                mode === m ? 'bg-card text-purple-800 shadow-card' : 'text-purple-700 hover:text-purple-900'
              }`}
            >
              {m === 'signup' ? 'Sign up' : 'Sign in'}
            </button>
          ))}
        </div>
      )}

      {step === 'details' && (
        <form
          className={bare ? 'mt-3 space-y-2.5' : 'mt-4 space-y-3'}
          onSubmit={(e) => {
            e.preventDefault();
            void submitDetails();
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
          {needsCategory && (
            <div>
              <label className="mb-1 block text-small font-semibold" htmlFor="shop-category">Shop category</label>
              <Select id="shop-category" value={category} onChange={setCategory} placeholder="Choose your category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
              <p className="mt-1 text-small text-muted">All your offers will be listed in this category.</p>
            </div>
          )}
          {showReferral && (
            <div>
              <label className="mb-1 block text-small font-semibold" htmlFor="referral">
                Referral code <span className="font-normal text-muted">(optional)</span>
              </label>
              <input id="referral" className="input uppercase tracking-widest" value={referral} maxLength={8}
                onChange={(e) => setReferral(e.target.value.replace(/[^A-Za-z0-9]/g, ''))} placeholder="From your intermediary" />
              {referrer?.valid && (
                <p className="mt-1 text-small text-green-700">
                  Code accepted{referrer.name ? `: you were referred by ${referrer.name}` : ''}.
                </p>
              )}
              {referrer && !referrer.valid && (
                <p className="mt-1 text-small text-danger">This code was not found. Check it or clear the box.</p>
              )}
            </div>
          )}
          {passwordSignin && (
            <div>
              <label className="mb-1 block text-small font-semibold" htmlFor="password">
                Password
              </label>
              <PasswordInput id="password" autoComplete="current-password" value={password}
                onChange={(e) => setPasswordValue(e.target.value)} placeholder="Your password" maxLength={128} />
            </div>
          )}
          <button className="btn-primary w-full" disabled={busy || !detailsValid}>
            {busy
              ? passwordSignin ? 'Signing in...' : 'Sending...'
              : mode === 'signup' ? 'Create account' : passwordSignin ? 'Sign in' : 'Email me a code'}
          </button>
          {mode === 'signin' && (
            <button
              type="button"
              className="w-full text-center text-small font-semibold text-purple-700 underline"
              onClick={() => reset({ mode: 'signin', useCode: !useCode })}
            >
              {useCode ? 'Back to password sign in' : 'Forgot password? Email me a code'}
            </button>
          )}
        </form>
      )}

      {step === 'details' && mode === 'signin' && (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-3 text-small text-muted">
            <span className="h-px flex-1 bg-purple-100" /> or log in with <span className="h-px flex-1 bg-purple-100" />
          </div>
          <GoogleButton onCredential={signInWithGoogle} onError={googleError} />
        </div>
      )}

      {step === 'code' && (
        <form
          className={bare ? 'mt-3 space-y-2.5' : 'mt-4 space-y-3'}
          onSubmit={(e) => {
            e.preventDefault();
            void confirmCode();
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

      {step === 'password' && (
        <form
          className={bare ? 'mt-3 space-y-2.5' : 'mt-4 space-y-3'}
          onSubmit={(e) => {
            e.preventDefault();
            void savePassword();
          }}
        >
          <p className="text-small text-muted">
            Email verified. {mode === 'signup' ? 'Create a password' : 'Choose a new password'} so you can sign in
            with your email and password next time.
          </p>
          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="new-password">
              Password
            </label>
            <PasswordInput id="new-password" autoComplete="new-password" value={password}
              onChange={(e) => setPasswordValue(e.target.value)} placeholder="At least 8 characters" maxLength={128} />
            {newPasswordError ? (
              <p className="mt-1 text-small text-danger">{newPasswordError}</p>
            ) : (
              <p className="mt-1 text-small text-muted">Use 8 or more characters with a letter and a number.</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="confirm-password">
              Re-enter password
            </label>
            <PasswordInput id="confirm-password" autoComplete="new-password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" maxLength={128} />
            {mismatch && <p className="mt-1 text-small text-danger">Passwords do not match</p>}
          </div>
          <button className="btn-primary w-full" disabled={busy || !passwordValid}>
            {busy ? 'Saving...' : 'Save password and continue'}
          </button>
        </form>
      )}

      {error && (
        <div role="alert" className="mt-3 text-small text-danger">
          {error.message}
        </div>
      )}
    </div>
  );
}

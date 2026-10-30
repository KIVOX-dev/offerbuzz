'use client';

import { useEffect, useRef, useState } from 'react';

type GoogleId = {
  initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const SCRIPT = 'https://accounts.google.com/gsi/client';

/** Loads Google's sign in script once and resolves when `window.google` is ready. */
function loadGoogle(): Promise<void> {
  if (window.google) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    const el = existing ?? Object.assign(document.createElement('script'), { src: SCRIPT, async: true });
    el.addEventListener('load', () => resolve());
    el.addEventListener('error', () => reject(new Error('Could not load Google sign in')));
    if (!existing) document.head.appendChild(el);
  });
}

/**
 * "Continue with Google". Uses Google's own button when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set; otherwise shows the same
 * looking button that explains Google sign in is not set up yet. `onCredential` receives the ID token for the API.
 */
export function GoogleButton({ onCredential, onError }: { onCredential: (idToken: string) => void; onError: (message: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const handler = useRef(onCredential);
  handler.current = onCredential;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !box.current) return;
    let cancelled = false;
    loadGoogle()
      .then(() => {
        if (cancelled || !box.current || !window.google) return;
        window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: (r) => handler.current(r.credential) });
        window.google.accounts.id.renderButton(box.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: Math.min(400, Math.max(200, box.current.clientWidth)),
        });
        setReady(true);
      })
      .catch((e: Error) => onError(e.message));
    return () => {
      cancelled = true;
    };
  }, [onError]);

  if (CLIENT_ID) {
    return <div ref={box} className={`flex min-h-[44px] w-full justify-center ${ready ? '' : 'opacity-0'}`} />;
  }
  return (
    <button
      type="button"
      onClick={() => onError('Google sign in is not set up yet. Please use your email for now.')}
      className="btn-outline flex w-full items-center justify-center gap-3"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
        <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
      </svg>
      Continue with Google
    </button>
  );
}

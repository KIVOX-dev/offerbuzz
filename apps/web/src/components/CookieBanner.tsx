'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export const CONSENT_KEY = 'offerbuzz.cookies';
const REOPEN_EVENT = 'offerbuzz:cookie-settings';

/** A footer link that reopens the cookie notice so the visitor can change their choice. */
export function CookieSettingsButton({ className = '' }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(REOPEN_EVENT))}>
      Cookie settings
    </button>
  );
}

/** Floating cookie card. Essential cookies are always on; anonymous analytics only after "Accept Cookies". */
export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      setAnalytics(saved !== 'essential');
      setShow(!saved);
    } catch {
      setShow(false);
    }
    const reopen = () => {
      setManaging(true);
      setShow(true);
    };
    window.addEventListener(REOPEN_EVENT, reopen);
    return () => window.removeEventListener(REOPEN_EVENT, reopen);
  }, []);

  function choose(value: 'all' | 'essential') {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* storage blocked: the notice just reappears next visit */
    }
    setShow(false);
    setManaging(false);
  }

  if (!show) return null;
  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-20 left-4 right-4 z-40 md:bottom-4 rounded-lg border border-purple-100 bg-card p-5 shadow-card-hover sm:left-auto sm:max-w-[500px]"
    >
      {managing ? (
        <div className="space-y-3 text-body">
          <label className="flex items-start gap-3 opacity-70">
            <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-purple-700" />
            <span><b>Essential</b> – keeps you signed in and the site secure. Always on.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1 h-4 w-4 accent-purple-700" />
            <span><b>Analytics</b> – anonymous visit counts that help us improve OfferBuzz.</span>
          </label>
        </div>
      ) : (
        <p className="text-body text-muted">
          By clicking &quot;Accept Cookies&quot;, you agree to storing cookies on your device to enhance your experience and analyze site
          traffic. Learn more about our{' '}
          <Link href="/privacy" className="font-semibold text-ink underline">privacy policy</Link> and{' '}
          <Link href="/cookies" className="font-semibold text-ink underline">cookie policy</Link>.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {managing ? (
          <button type="button" className="btn bg-purple-700 px-4 text-white hover:bg-purple-800" onClick={() => choose(analytics ? 'all' : 'essential')}>
            Save preferences
          </button>
        ) : (
          <button type="button" className="mr-auto font-semibold text-ink hover:text-purple-700" onClick={() => setManaging(true)}>
            Manage Preference
          </button>
        )}
        <button type="button" className="btn border border-purple-200 bg-card px-4 text-ink hover:bg-purple-50" onClick={() => choose('essential')}>
          Reject
        </button>
        <button type="button" className="btn bg-[#c6f432] px-4 font-semibold text-ink hover:brightness-95" onClick={() => choose('all')}>
          Accept Cookies
        </button>
      </div>
    </div>
  );
}

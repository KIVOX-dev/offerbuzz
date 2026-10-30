'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export const CONSENT_KEY = 'offerbuzz.cookies';

/** Asks once whether anonymous visit counting is allowed. The choice is kept in this browser only. */
export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(!localStorage.getItem(CONSENT_KEY));
    } catch {
      setShow(false);
    }
  }, []);

  function choose(value: 'all' | 'essential') {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* storage blocked: the banner just reappears next visit */
    }
    setShow(false);
  }

  if (!show) return null;
  return (
    <div role="region" aria-label="Cookie notice" className="fixed inset-x-0 bottom-0 z-40 border-t border-purple-200 bg-card p-4 shadow-card-hover">
      <div className="container-page flex flex-col gap-3 md:flex-row md:items-center">
        <p className="flex-1 text-small">
          We use essential cookies to keep you signed in, and optional anonymous analytics to see which pages are used. See our{' '}
          <Link href="/cookies" className="font-semibold text-purple-700 underline">Cookie Policy</Link> and{' '}
          <Link href="/privacy" className="font-semibold text-purple-700 underline">Privacy Policy</Link>.
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-outline btn-sm" onClick={() => choose('essential')}>Essential only</button>
          <button type="button" className="btn-primary btn-sm" onClick={() => choose('all')}>Accept all</button>
        </div>
      </div>
    </div>
  );
}

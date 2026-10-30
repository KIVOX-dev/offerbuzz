'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const KEY = 'offerbuzz.vid';
const CONSENT_KEY = 'offerbuzz.cookies';

/** Counting starts only once the visitor has accepted analytics. */
function consented(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'all';
  } catch {
    return false;
  }
}

/** A random id kept in this browser so unique visitors can be counted. It holds no personal data. */
function visitorId(): string | undefined {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return undefined; // storage blocked: this visit is simply not counted
  }
}

/**
 * Sends one anonymous page view to the API per page change. Best effort: never throws, never blocks the page, and
 * skips the admin area and visitors who set Do Not Track.
 */
export function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin') || navigator.doNotTrack === '1' || !consented()) return;
    const id = visitorId();
    if (!id) return;
    fetch('/api/v1/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitorId: id, path: pathname }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}

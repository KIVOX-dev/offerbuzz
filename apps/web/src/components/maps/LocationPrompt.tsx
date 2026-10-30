'use client';

import { useEffect, useState } from 'react';
import { useVisitorLocation } from '@/lib/location';
import { PinIcon } from '../Icons';

/**
 * Asks visitors for their location when they open the site, so offers near them can be shown. Our own card comes
 * first with the reason; "Allow" then triggers the browser prompt. Asked again at most once a week after "Not now".
 */
export function LocationPrompt() {
  const { coords, status, skipped, request, skip } = useVisitorLocation();
  const [granted, setGranted] = useState<boolean>();

  // if the browser already remembers "allow", fetch quietly instead of showing the card
  useEffect(() => {
    if (!navigator.permissions) return setGranted(false);
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((p) => {
        setGranted(p.state === 'granted');
        if (p.state === 'granted') request();
      })
      .catch(() => setGranted(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on first visit to the page
  }, []);

  if (granted !== false || coords || skipped || status === 'unsupported' || status === 'denied') return null;
  return (
    <div role="dialog" aria-label="Location" className="fixed left-1/2 top-20 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-purple-100 bg-card p-5 shadow-card-hover">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
          <PinIcon size={20} />
        </span>
        <div>
          <h2 className="text-section font-bold">Find offers near you</h2>
          <p className="mt-1 text-small text-muted">
            Allow location access and we will show deals from shops close to you. Your location stays in this browser and is never saved on our servers.
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn-outline btn-sm" onClick={skip}>Not now</button>
        <button type="button" className="btn-primary btn-sm" onClick={request} disabled={status === 'asking'}>
          {status === 'asking' ? 'Waiting...' : 'Allow location'}
        </button>
      </div>
    </div>
  );
}

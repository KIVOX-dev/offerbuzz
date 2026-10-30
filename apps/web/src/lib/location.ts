'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'offerbuzz.loc';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const EVENT = 'offerbuzz:location';

export type Coords = { lat: number; lng: number };
export type LocationStatus = 'unknown' | 'asking' | 'granted' | 'denied' | 'unsupported';

type Stored = { lat?: number; lng?: number; skippedAt?: number };

function read(): Stored {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Stored;
  } catch {
    return {};
  }
}
function write(v: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage blocked: the choice just is not remembered */
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * The visitor's location. It stays in this browser only, rounded to about 100 m, and is used to ask the API for
 * offers nearby. `request()` triggers the browser's own permission prompt.
 */
export function useVisitorLocation() {
  const [coords, setCoords] = useState<Coords>();
  const [status, setStatus] = useState<LocationStatus>('unknown');
  const [skipped, setSkipped] = useState(true);

  const sync = useCallback(() => {
    const s = read();
    if (s.lat !== undefined && s.lng !== undefined) {
      setCoords({ lat: s.lat, lng: s.lng });
      setStatus('granted');
    }
    setSkipped(Boolean(s.skippedAt && Date.now() - s.skippedAt < SNOOZE_MS));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return setStatus('unsupported');
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [sync]);

  const request = useCallback(() => {
    if (!navigator.geolocation) return setStatus('unsupported');
    setStatus('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const round = (n: number) => Math.round(n * 1000) / 1000;
        write({ lat: round(pos.coords.latitude), lng: round(pos.coords.longitude) });
      },
      () => {
        setStatus('denied');
        write({ skippedAt: Date.now() });
      },
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const skip = useCallback(() => write({ skippedAt: Date.now() }), []);

  return { coords, status, skipped, request, skip };
}

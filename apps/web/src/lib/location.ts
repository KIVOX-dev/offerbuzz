'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadMaps, mapsConfigured } from './maps';

const KEY = 'offerbuzz.loc';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const EVENT = 'offerbuzz:location';

export type Coords = { lat: number; lng: number };
export type LocationStatus = 'unknown' | 'asking' | 'granted' | 'denied' | 'unsupported';

type Stored = { lat?: number; lng?: number; name?: string; skippedAt?: number };

// used when the browser blocks storage, so the choice still holds for the current visit
let memory: Stored = {};

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : memory;
  } catch {
    return memory;
  }
}
function write(v: Stored) {
  memory = v;
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage blocked: the choice just is not remembered */
  }
  window.dispatchEvent(new Event(EVENT));
}

const join = (...parts: (string | undefined)[]) => [...new Set(parts.filter(Boolean))].join(', ') || undefined;

/** Free reverse lookup that needs no key, built for browsers. Gives e.g. "R.S. Puram, Coimbatore". */
export async function nameFromBigDataCloud(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return undefined;
    const d = (await res.json()) as { locality?: string; city?: string; principalSubdivision?: string };
    return join(d.locality, d.city || d.principalSubdivision);
  } catch {
    return undefined;
  }
}

async function nameFromGoogle(lat: number, lng: number): Promise<string | undefined> {
  if (!mapsConfigured) return undefined;
  try {
    await loadMaps();
    const { Geocoder } = (await google.maps.importLibrary('geocoding')) as google.maps.GeocodingLibrary;
    const { results } = await new Geocoder().geocode({ location: { lat, lng } });
    const parts = results[0]?.address_components ?? [];
    const pick = (...types: string[]) => parts.find((c) => types.some((t) => c.types.includes(t)))?.long_name;
    return join(pick('sublocality_level_1', 'sublocality', 'neighborhood'), pick('locality', 'administrative_area_level_2'));
  } catch {
    return undefined;
  }
}

/** Short place name for a point. Looked up once per new location and then cached in the browser by the caller. */
async function placeName(lat: number, lng: number): Promise<string | undefined> {
  return (await nameFromBigDataCloud(lat, lng)) ?? (await nameFromGoogle(lat, lng));
}

/**
 * The visitor's location. It stays in this browser only, rounded to about 100 m, and is used to ask the API for
 * offers nearby. `request()` triggers the browser's own permission prompt.
 */
export function useVisitorLocation() {
  const [coords, setCoords] = useState<Coords>();
  const [name, setName] = useState<string>();
  const [status, setStatus] = useState<LocationStatus>('unknown');
  const [skipped, setSkipped] = useState(true);

  const sync = useCallback(() => {
    const s = read();
    if (s.lat !== undefined && s.lng !== undefined) {
      setCoords({ lat: s.lat, lng: s.lng });
      setName(s.name);
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
        const lat = round(pos.coords.latitude);
        const lng = round(pos.coords.longitude);
        const prev = read();
        const samePlace = prev.lat === lat && prev.lng === lng && prev.name;
        write({ lat, lng, name: samePlace ? prev.name : undefined });
        // one lookup per new location; the name is then cached in this browser and Google is not asked again
        if (!samePlace) void placeName(lat, lng).then((n) => n && write({ lat, lng, name: n }));
      },
      () => {
        setStatus('denied');
        write({ skippedAt: Date.now() });
      },
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const skip = useCallback(() => write({ skippedAt: Date.now() }), []);

  return { coords, name, status, skipped, request, skip };
}

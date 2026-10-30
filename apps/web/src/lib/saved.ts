'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'offerbuzz.saved';
const EVENT = 'offerbuzz:saved';
const MAX = 50;

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
  } catch {
    /* storage blocked: saving just does not stick */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Saved offers, kept in this browser (no account needed) and shared between every component on the page. */
export function useSaved() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setIds(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const now = read();
    write(now.includes(id) ? now.filter((x) => x !== id) : [id, ...now]);
  }, []);

  return { ids, count: ids.length, has: (id: string) => ids.includes(id), toggle };
}

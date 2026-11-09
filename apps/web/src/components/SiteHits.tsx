'use client';

import { useEffect, useState } from 'react';
import { getSiteHits } from '@/lib/api';

/** "Total website hits: 12,345", shown at the bottom of the site. Renders nothing until the count arrives. */
export function SiteHits({ className = '' }: { className?: string }) {
  const [hits, setHits] = useState<number>();
  useEffect(() => {
    getSiteHits()
      .then((r) => setHits(r.hits))
      .catch(() => undefined); // best effort: no counter is better than an error
  }, []);
  if (hits === undefined) return null;
  return (
    <p className={`text-small font-semibold ${className}`}>
      Total website hits: <span className="tabular-nums">{hits.toLocaleString('en-IN')}</span>
    </p>
  );
}

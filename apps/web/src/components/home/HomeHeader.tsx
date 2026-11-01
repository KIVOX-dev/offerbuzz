/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSaved } from '@/lib/saved';
import { homeFor, loadSession } from '@/lib/session';
import { ChevronDownIcon, DuoCategoryIcon, HeartIcon, PinIcon, UserIcon } from '../Icons';
import { Logo } from '../Logo';
import { SearchBox } from './SearchBox';

export type HomeCategory = { name: string; slug: string; from: string; to: string };

/** Phone header colours, one per category (the header fades between them, like a shopping app). */
const THEMES: { match: RegExp; bg: string }[] = [
  { match: /grocer|organic|medic|health|pharm/, bg: 'linear-gradient(160deg,#14532d 0%,#15803d 55%,#22c55e 130%)' },
  { match: /fashion|cloth|jewel|beauty|salon|spa/, bg: 'linear-gradient(160deg,#831843 0%,#be185d 55%,#f472b6 130%)' },
  { match: /mobile|electron|gadget/, bg: 'linear-gradient(160deg,#172554 0%,#1d4ed8 55%,#60a5fa 130%)' },
  { match: /appliance|home|living/, bg: 'linear-gradient(160deg,#0c4a6e 0%,#0369a1 55%,#38bdf8 130%)' },
  { match: /food|restaurant|cafe|bakery|bakeries|beverage/, bg: 'linear-gradient(160deg,#9a3412 0%,#ea580c 55%,#fb923c 130%)' },
  { match: /travel|tour/, bg: 'linear-gradient(160deg,#134e4a 0%,#0f766e 55%,#2dd4bf 130%)' },
  { match: /fitness|sport|auto|vehicle|car/, bg: 'linear-gradient(160deg,#312e81 0%,#4338ca 55%,#818cf8 130%)' },
  { match: /gift|toy|baby|kid/, bg: 'linear-gradient(160deg,#701a75 0%,#a21caf 55%,#e879f9 130%)' },
  { match: /educat|school|book/, bg: 'linear-gradient(160deg,#78350f 0%,#b45309 55%,#fbbf24 130%)' },
  { match: /real|estate|property/, bg: 'linear-gradient(160deg,#334155 0%,#475569 55%,#94a3b8 130%)' },
];
const FALLBACKS = THEMES.map((t) => t.bg);
const themeFor = (c: { name: string; slug: string }, i: number) =>
  THEMES.find((t) => t.match.test(`${c.name} ${c.slug}`.toLowerCase()))?.bg ?? FALLBACKS[i % FALLBACKS.length];

export type Promo = { cat: number; title: string; off: string };

/**
 * Purple header, like a delivery app: the location sits top-left, then search, category tabs and (on phones) a
 * strip of offer cards that keeps scrolling on its own.
 */
export function HomeHeader({
  categories,
  active,
  onPick,
  query,
  onQuery,
  onScan,
  locationLabel,
  locationHint,
  onLocation,
}: {
  categories: HomeCategory[];
  promos: Promo[];
  active: number;
  onPick: (i: number) => void;
  query: string;
  onQuery: (v: string) => void;
  onScan: (text: string) => void;
  locationLabel: string;
  locationHint: string;
  onLocation: () => void;
}) {
  const { count: savedCount } = useSaved();
  const savedBadge = savedCount > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-ink">{savedCount}</span>
  );

  // signed in people go to their own area, everyone else to the sign in page (read after mount: no SSR mismatch)
  const [accountHref, setAccountHref] = useState('/login');
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const s = loadSession();
    setSignedIn(!!s);
    if (s && s.user.role !== 'customer') setAccountHref(homeFor(s.user.role));
  }, []);

  const location = (
    <button type="button" onClick={onLocation} aria-label="Change location" className="flex min-w-0 items-center gap-2.5 text-left">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 md:h-auto md:w-auto md:bg-transparent">
        <PinIcon size={22} className="text-accent md:text-purple-700" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-[17px] font-extrabold leading-tight">
          <span key={locationLabel} className="ob-fade-up truncate">{locationLabel}</span>
          <ChevronDownIcon size={16} className="shrink-0" />
        </span>
        <span className="block truncate text-small text-purple-200 md:text-muted">{locationHint}</span>
      </span>
    </button>
  );

  const search = <SearchBox value={query} onChange={onQuery} onScan={onScan} variant="mobile" />;

  const desktopSearch = <SearchBox value={query} onChange={onQuery} onScan={onScan} variant="desktop" />;

  return (
    <header className="relative z-30 rounded-b-[28px] bg-hero text-white shadow-glow md:sticky md:top-0 md:overflow-visible md:rounded-none md:border-b md:border-purple-100 md:bg-card md:bg-none md:text-ink md:shadow-none">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[28px] md:hidden">
        {/* one colour layer per category: the active one fades in over the purple, so the header changes colour smoothly */}
        {categories.map((c, i) => (
          <span
            key={c.slug}
            className="absolute inset-0 transition-opacity duration-500 ease-out"
            style={{ background: themeFor(c, i), opacity: active === i ? 1 : 0 }}
          />
        ))}
        <span className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-purple-400/25 blur-3xl" />
        <span
          className="absolute inset-0 opacity-[0.10]"
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
      </div>

      <div className="container-page relative pt-3">
        {/* phones: location + logo, then search (saved and account are in the bottom bar) */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          {location}
          <Logo height={34} variant="light" />
        </div>
        <div className="mt-3 flex items-center gap-2 md:hidden">
          {search}
        </div>

        {/* desktop: logo | location | search | saved */}
        <div className="hidden h-header items-center gap-3 md:flex">
          <Logo height={48} />
          {location}
          {desktopSearch}
          <Link href="/saved" aria-label="Saved offers" className="btn-ghost relative !px-2">
            <HeartIcon />
            {savedBadge}
          </Link>
          <Link href={accountHref} className="btn-ghost gap-2">
            <UserIcon /> {signedIn ? 'Account' : 'Sign in'}
          </Link>
        </div>
      </div>

      {/* category tabs */}
      <nav aria-label="Categories" className="relative mt-2 pb-4 md:mt-0 md:border-t md:border-purple-100 md:pb-0 md:pt-2">
        <ul className="container-page flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {[{ name: 'All', slug: 'all', from: '#e9e4fb', to: '#ffffff' }, ...categories].map((c, i) => {
            const on = active === i - 1;
            return (
              <li key={c.name} className="w-[84px] shrink-0">
                <button type="button" aria-pressed={on} onClick={() => onPick(i - 1)} className="flex w-full flex-col items-center gap-1 text-small">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl transition duration-300 ${on ? 'scale-110 bg-white/20 md:scale-100 md:bg-purple-100' : ''}`}>
                    <DuoCategoryIcon slug={c.slug} plain size={32} style={{ color: '#ffd60a' }} />
                  </span>
                  <span className={`w-full truncate px-1 text-center ${on ? 'font-bold text-white md:text-ink' : 'font-medium text-purple-100 md:text-ink'}`}>{c.name}</span>
                  <span className={`h-[3px] rounded-full bg-accent transition-all duration-300 md:bg-purple-600 ${on ? 'w-full' : 'w-0'}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

    </header>
  );
}

/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { ChevronDownIcon, DuoCategoryIcon, HeartIcon, PinIcon, SearchIcon } from '../Icons';
import { Logo } from '../Logo';
import { ScanButton } from '../Scanner';

export type HomeCategory = { name: string; slug: string; from: string; to: string };

export type Promo = { cat: number; title: string; off: string };

/**
 * Purple header, like a delivery app: the location sits top-left, then search, category tabs and (on phones) a
 * strip of offer cards that keeps scrolling on its own.
 */
export function HomeHeader({
  categories,
  promos,
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
  const location = (
    <button type="button" onClick={onLocation} aria-label="Change location" className="flex min-w-0 items-center gap-2.5 text-left">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
        <PinIcon size={22} className="text-accent" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-[17px] font-extrabold leading-tight">
          <span key={locationLabel} className="ob-fade-up truncate">{locationLabel}</span>
          <ChevronDownIcon size={16} className="shrink-0" />
        </span>
        <span className="block truncate text-small text-purple-200">{locationHint}</span>
      </span>
    </button>
  );

  const search = (
    <form action="/login" className="relative flex h-12 min-w-0 flex-1 items-center rounded-2xl bg-white shadow-card">
      <SearchIcon size={20} className="pointer-events-none absolute left-4 text-purple-700" />
      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        className="h-full min-w-0 flex-1 rounded-2xl bg-transparent pl-12 pr-2 text-body text-ink outline-none placeholder:text-muted"
        placeholder="Search offers, shops and categories"
        aria-label="Search"
      />
      <span aria-hidden className="h-6 w-px bg-purple-100" />
      <ScanButton onResult={onScan} className="flex h-full w-12 items-center justify-center rounded-r-2xl text-purple-700 hover:bg-purple-50" />
    </form>
  );

  return (
    <header className="relative z-30 overflow-hidden rounded-b-[28px] bg-hero text-white shadow-glow md:sticky md:top-0 md:overflow-visible md:rounded-none">
      <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-purple-400/25 blur-3xl" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />

      <div className="container-page relative pt-3">
        {/* phones: location + logo, then search + saved */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          {location}
          <Logo height={34} variant="light" />
        </div>
        <div className="mt-3 flex items-center gap-2 md:hidden">
          {search}
          <Link href="/login" aria-label="Saved offers" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white transition active:scale-95">
            <HeartIcon />
          </Link>
        </div>

        {/* desktop: logo | location | search | saved */}
        <div className="hidden h-header items-center gap-6 md:flex">
          <Logo height={46} variant="light" />
          {location}
          {search}
          <Link href="/login" aria-label="Saved offers" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 transition hover:bg-white/25">
            <HeartIcon />
          </Link>
        </div>
      </div>

      {/* category tabs */}
      <nav aria-label="Categories" className="relative mt-2">
        <ul className="container-page flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {[{ name: 'All', slug: 'all', from: '#e9e4fb', to: '#ffffff' }, ...categories].map((c, i) => {
            const on = active === i - 1;
            return (
              <li key={c.name} className="w-[84px] shrink-0">
                <button type="button" aria-pressed={on} onClick={() => onPick(i - 1)} className="flex w-full flex-col items-center gap-1 text-small">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl transition duration-300 ${on ? 'scale-110 bg-white/20' : ''}`}>
                    <DuoCategoryIcon slug={c.slug} plain size={32} style={{ color: '#ffd60a' }} />
                  </span>
                  <span className={`w-full truncate px-1 text-center ${on ? 'font-bold text-white' : 'font-medium text-purple-100'}`}>{c.name}</span>
                  <span className={`h-[3px] rounded-full bg-accent transition-all duration-300 ${on ? 'w-full' : 'w-0'}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* phones: offer cards that keep scrolling (pauses while touched) */}
      <div aria-label="Featured deals" className="relative mt-3 overflow-hidden pb-5 pl-4 md:hidden">
        <div className="ob-marquee flex w-max">
          {[...promos, ...promos].map((p, i) => (
            <button
              key={`${p.title}-${i}`}
              type="button"
              aria-hidden={i >= promos.length}
              tabIndex={i >= promos.length ? -1 : 0}
              onClick={() => onPick(p.cat)}
              className="mr-3 w-[132px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-b from-amber-300 to-accent p-2.5 text-left text-ink shadow-card"
            >
              <span className="block text-[11px] font-extrabold uppercase text-purple-900">{p.off}</span>
              <span className="mt-0.5 block h-9 text-[14px] font-extrabold leading-tight">{p.title}</span>
              <span
                style={{ backgroundImage: `linear-gradient(120deg, ${categories[p.cat].from}, ${categories[p.cat].to})` }}
                className="mt-2 block aspect-[4/3] overflow-hidden rounded-xl"
              >
                <img src={`/categories/${categories[p.cat].slug}.webp`} alt="" className="h-full w-full object-cover" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

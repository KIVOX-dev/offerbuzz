'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MENU_CATEGORIES, SEARCH_BY_SLUG } from '@/lib/categories';
import { homeFor, loadSession } from '@/lib/session';
import { DuoCategoryIcon, UserIcon } from './Icons';
import { Logo } from './Logo';
import { SearchBox } from './home/SearchBox';

/**
 * The header for inner pages (search results, an offer): the same brand header as the home page, with search, the
 * account button and the glass category menu. `activeCategory` highlights the shop category being viewed.
 */
export function SiteHeader({ query = '', activeCategory }: { query?: string; activeCategory?: string }) {
  const router = useRouter();
  const [text, setText] = useState(query);
  useEffect(() => setText(query), [query]);

  // signed in people go to their own area, everyone else to the sign in page (read after mount: no SSR mismatch)
  const [accountHref, setAccountHref] = useState('/login');
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const s = loadSession();
    setSignedIn(!!s);
    if (s && s.user.role !== 'customer') setAccountHref(homeFor(s.user.role));
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b-4 border-accent bg-hero text-white shadow-glow">
      <div className="container-page flex items-center gap-3 py-2.5">
        <Logo height={40} variant="light" />
        <SearchBox value={text} onChange={setText} onScan={(t) => router.push(`/search?q=${encodeURIComponent(t)}`)} variant="desktop" />
        <Link href={accountHref} className="btn gap-2 bg-accent px-3 text-ink shadow-card hover:brightness-105 md:px-4">
          <UserIcon /> <span className="hidden sm:inline">{signedIn ? 'Account' : 'Sign in'}</span>
        </Link>
      </div>

      <nav aria-label="Categories" className="relative pb-2.5">
        <div className="container-page">
          <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
            <li className="w-[84px] shrink-0">
              <Link href="/" className="flex w-full flex-col items-center gap-0.5 py-1 text-small font-medium text-purple-100">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md"><DuoCategoryIcon slug="all" plain size={24} style={{ color: 'rgba(255,255,255,0.38)' }} /></span>
                <span className="w-full truncate px-1 text-center">Home</span>
              </Link>
            </li>
            {MENU_CATEGORIES.map((c) => {
              const href = `/search?${SEARCH_BY_SLUG[c.slug] ?? `q=${encodeURIComponent(c.name)}`}`;
              const on = !!activeCategory && decodeURIComponent(SEARCH_BY_SLUG[c.slug] ?? '') === `category=${activeCategory}`;
              return (
                <li key={c.slug} className="w-[84px] shrink-0">
                  <Link href={href} aria-current={on ? 'page' : undefined}
                    className={`flex w-full flex-col items-center gap-0.5 rounded-xl py-1 text-small ${on ? 'bg-white/25 font-bold text-white ring-1 ring-white/40' : 'font-medium text-purple-100 hover:bg-white/10'}`}>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md ${on ? 'border-white/50 bg-white/30' : 'border-white/20 bg-white/10'} shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]`}><DuoCategoryIcon slug={c.slug} plain size={24} style={{ color: 'rgba(255,255,255,0.38)' }} /></span>
                    <span className="w-full truncate px-1 text-center">{c.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
}

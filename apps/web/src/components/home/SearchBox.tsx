'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { CATEGORIES, type SuggestResponse } from '@offerbuzz/shared';
import { suggestSearch } from '@/lib/api';
import { ClockIcon, SearchIcon, StoreIcon, TagIcon } from '../Icons';
import { ScanButton } from '../Scanner';

type Row = { key: string; label: string; hint?: string; href: string; icon: 'category' | 'shop' | 'offer' | 'recent' };

const RECENT_KEY = 'offerbuzz.recent';
const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

const loadRecent = (): string[] => {
  try {
    return (JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]).slice(0, 5);
  } catch {
    return [];
  }
};
const saveRecent = (q: string) => {
  try {
    const next = [q, ...loadRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: recent searches are just not remembered */
  }
};

const searchHref = (p: { q?: string; category?: string }) => `/search?${new URLSearchParams(p as Record<string, string>)}`;

const ICONS = { category: TagIcon, shop: StoreIcon, offer: SearchIcon, recent: ClockIcon };

/**
 * The search bar. While typing it suggests categories, shops and live offers (after a short pause, from 2 characters);
 * Enter or the search button opens the full results. With nothing typed it offers recent searches and popular categories.
 */
export function SearchBox({
  value,
  onChange,
  onScan,
  variant,
}: {
  value: string;
  onChange: (v: string) => void;
  onScan: (text: string) => void;
  variant: 'mobile' | 'desktop';
}) {
  const router = useRouter();
  const root = useRef<HTMLFormElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SuggestResponse>();
  const [recent, setRecent] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);

  const q = value.trim();

  // suggestions: wait for a pause in typing; ignore answers that arrive for an older query
  useEffect(() => {
    if (q.length < MIN_CHARS) {
      setData(undefined);
      return;
    }
    let stale = false;
    const id = setTimeout(() => {
      suggestSearch(q)
        .then((r) => !stale && setData(r))
        .catch(() => !stale && setData(undefined));
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(id);
    };
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const rows: Row[] =
    q.length >= MIN_CHARS
      ? [
          ...(data?.categories ?? []).map((c): Row => ({ key: `c-${c}`, label: c, hint: 'Category', href: searchHref({ category: c }), icon: 'category' })),
          ...(data?.shops ?? []).map((s): Row => ({ key: `s-${s.id}`, label: s.name, hint: 'Shop', href: searchHref({ q: s.name }), icon: 'shop' })),
          ...(data?.offers ?? []).map((o): Row => ({ key: `o-${o.id}`, label: o.title, hint: o.shop, href: `/offers/${o.id}`, icon: 'offer' })),
        ]
      : [
          ...recent.map((r): Row => ({ key: `r-${r}`, label: r, hint: 'Recent', href: searchHref({ q: r }), icon: 'recent' })),
          ...CATEGORIES.slice(0, 6).map((c): Row => ({ key: `p-${c}`, label: c, hint: 'Popular', href: searchHref({ category: c }), icon: 'category' })),
        ];

  useEffect(() => setCursor(-1), [q, open]);

  function go(href: string, remember?: string) {
    if (remember) saveRecent(remember);
    setOpen(false);
    router.push(href);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cursor >= 0 && rows[cursor]) return go(rows[cursor].href, rows[cursor].icon === 'offer' ? undefined : rows[cursor].label);
    if (q.length >= 1) go(searchHref({ q }), q);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') return setOpen(false);
    if (!open || rows.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % rows.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c <= 0 ? rows.length - 1 : c - 1));
    }
  }

  const mobile = variant === 'mobile';
  return (
    <form
      ref={root}
      role="search"
      onSubmit={submit}
      className={mobile ? 'relative flex h-12 min-w-0 flex-1 items-center rounded-2xl bg-white shadow-card' : 'relative flex h-search min-w-0 flex-1'}
    >
      {mobile && <SearchIcon size={20} className="pointer-events-none absolute left-4 text-purple-700" />}
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setRecent(loadRecent());
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        aria-label="Search"
        placeholder="Search offers, shops and categories"
        className={
          mobile
            ? 'h-full min-w-0 flex-1 rounded-2xl bg-transparent pl-12 pr-2 text-body text-ink outline-none placeholder:text-muted'
            : 'input h-full rounded-none border-r-0'
        }
      />
      {mobile ? (
        <>
          <span aria-hidden className="h-6 w-px bg-purple-100" />
          <ScanButton onResult={onScan} className="flex h-full w-12 items-center justify-center rounded-r-2xl text-purple-700 hover:bg-purple-50" />
        </>
      ) : (
        <>
          <ScanButton onResult={onScan} className="flex w-12 items-center justify-center border-y border-purple-200 bg-card text-purple-700 hover:bg-purple-50" />
          <button type="submit" aria-label="Search" className="flex w-12 items-center justify-center rounded-r-md bg-accent text-ink hover:brightness-105">
            <SearchIcon />
          </button>
        </>
      )}

      <ul
        id={listId}
        role="listbox"
        className={`absolute left-0 right-0 top-full z-40 mt-2 max-h-[min(70vh,420px)] origin-top overflow-auto rounded-xl border border-purple-100 bg-card p-1.5 text-ink shadow-card-hover transition duration-200 ease-out ${
          open && (rows.length > 0 || (q.length >= MIN_CHARS && data)) ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-2 scale-95 opacity-0'
        }`}
      >
        {rows.map((r, i) => {
          const Icon = ICONS[r.icon];
          return (
            <li key={r.key} role="option" aria-selected={i === cursor}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r.href, r.icon === 'offer' ? undefined : r.label)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${i === cursor ? 'bg-purple-50' : ''}`}
              >
                <Icon size={18} className="shrink-0 text-purple-700" />
                <span className="min-w-0 flex-1 truncate text-body">{r.label}</span>
                {r.hint && <span className="shrink-0 text-small text-muted">{r.hint}</span>}
              </button>
            </li>
          );
        })}
        {q.length >= MIN_CHARS && data && rows.length === 0 && <li className="px-3 py-3 text-small text-muted">No matches. Press Enter to search everything.</li>}
      </ul>
    </form>
  );
}

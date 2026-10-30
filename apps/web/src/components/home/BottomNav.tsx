'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { GridIcon, HeartIcon, HomeIcon, PinIcon, QrIcon } from '../Icons';
import { useSaved } from '@/lib/saved';
import { ScanButton } from '../Scanner';

export type NavKey = 'home' | 'categories' | 'near';

const SLOTS = 5; // home, categories, scan, near, saved

/**
 * Mobile bottom bar. The purple line above the active item slides between items. The scan button in the middle opens
 * the camera scanner.
 */
export function BottomNav({ active, onSelect, onScan }: { active: NavKey; onSelect: (k: NavKey) => void; onScan: (text: string) => void }) {
  const { count: savedCount } = useSaved();
  const slot = { home: 0, categories: 1, near: 3 }[active];
  const item = (key: NavKey, label: string, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => onSelect(key)}
      aria-current={active === key ? 'page' : undefined}
      className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${active === key ? 'text-purple-700' : 'text-muted'}`}
    >
      <span className={`transition-transform duration-300 ${active === key ? '-translate-y-0.5 scale-110' : ''}`}>{icon}</span>
      {label}
    </button>
  );

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-purple-100 bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(46,16,101,0.08)] md:hidden">
      <span
        aria-hidden
        className="absolute top-0 h-[3px] rounded-b-full bg-purple-600 transition-transform duration-300 ease-out"
        style={{ width: `${100 / SLOTS}%`, transform: `translateX(${slot * 100}%)` }}
      />
      <div className="grid grid-cols-5 items-end">
        {item('home', 'Home', <HomeIcon size={22} />)}
        {item('categories', 'Categories', <GridIcon size={22} />)}
        <div className="flex justify-center">
          <ScanButton
            onResult={onScan}
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-ink shadow-glow-sm transition active:scale-95"
          >
            <QrIcon size={26} />
          </ScanButton>
        </div>
        {item('near', 'Near you', <PinIcon size={22} />)}
        <Link href="/saved" className="relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted">
          <span className="relative">
            <HeartIcon size={22} />
            {savedCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{savedCount}</span>
            )}
          </span>
          Saved
        </Link>
      </div>
    </nav>
  );
}

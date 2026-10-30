/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicOfferDTO } from '@offerbuzz/shared';
import { askOfferaAI } from '@/lib/api';
import { useVisitorLocation } from '@/lib/location';
import { discountLabel } from '../OfferPreview';
import { endsLabel } from '../OfferCard';
import { PinIcon } from '../Icons';
import { OfferaMark } from './OfferaMark';

type Msg = { role: 'user' | 'assistant'; content: string; offers?: PublicOfferDTO[] };

const GREETING: Msg = {
  role: 'assistant',
  content: 'Hi! I am Offera AI. I find the best live offers near you. What are you looking for today?',
};
const CHIPS = ['Best offers near me', 'Grocery deals', 'Fashion offers', 'Offers ending soon'];
const HIDDEN_ON = ['/admin', '/merchant', '/intermediary', '/login'];

function MiniOffer({ o, onOpen }: { o: PublicOfferDTO; onOpen: () => void }) {
  return (
    <Link href={`/offers/${o.id}`} onClick={onOpen} className="flex w-[210px] shrink-0 snap-start gap-2.5 rounded-xl border border-purple-100 bg-white p-2 shadow-card transition active:scale-[0.98]">
      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-purple-50">{o.imageUrl && <img src={o.imageUrl} alt="" className="h-full w-full object-cover" />}</span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-[13px] font-bold text-ink">{o.title}</span>
        <span className="block truncate text-[12px] text-muted">{o.shop.name}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold">
          <span className="rounded bg-brand px-1.5 py-0.5 text-white">{discountLabel(o.discountType, o.discountValue === undefined ? '' : String(o.discountValue))}</span>
          <span className="truncate text-purple-700">{o.distanceKm === undefined ? endsLabel(o.endsAt) : o.distanceKm < 1 ? 'Under 1 km' : `${o.distanceKm.toFixed(1)} km`}</span>
        </span>
      </span>
    </Link>
  );
}

/**
 * Offera AI: a floating assistant that recommends the best live offers around the visitor. It only talks about
 * offers (the server enforces that), and it is sent the visitor's location only when they have shared it.
 */
export function OfferaAI() {
  const pathname = usePathname();
  const { coords, name: place, request, status } = useVisitorLocation();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy, open]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = useCallback(
    async (raw: string) => {
      const content = raw.trim().slice(0, 300);
      if (!content || busy) return;
      const next: Msg[] = [...msgs, { role: 'user', content }];
      setMsgs(next);
      setText('');
      setBusy(true);
      try {
        // the greeting is ours, not part of the conversation the server needs
        const history = next.slice(1).slice(-9).map(({ role, content: c }) => ({ role, content: c }));
        const res = await askOfferaAI({ messages: history, ...(coords ? { lat: coords.lat, lng: coords.lng } : {}) });
        setMsgs([...next, { role: 'assistant', content: res.reply, offers: res.offers }]);
      } catch {
        setMsgs([...next, { role: 'assistant', content: 'Sorry, I could not reach the offers right now. Please try again in a moment.' }]);
      } finally {
        setBusy(false);
      }
    },
    [msgs, busy, coords],
  );

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask Offera AI"
          className="group fixed bottom-24 right-4 z-[45] flex items-center gap-2 rounded-full bg-card py-1.5 pl-1.5 pr-1.5 shadow-glow transition active:scale-95 md:bottom-6 md:right-6 md:pr-4"
        >
          <span className="relative flex h-12 w-12 shrink-0">
            <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-purple-400/40 [animation-duration:2.4s] motion-reduce:hidden" />
            <OfferaMark size={48} className="relative drop-shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105" />
          </span>
          <span className="hidden text-body font-bold text-ink md:block">Ask Offera AI</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Offera AI"
          className="ob-fade-up fixed inset-x-0 bottom-0 z-[60] flex h-[82dvh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] sm:rounded-3xl"
        >
          <header className="flex items-center gap-3 bg-hero px-4 py-3 text-white">
            <OfferaMark size={42} />
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-extrabold leading-tight">Offera AI</p>
              <p className="truncate text-small text-purple-200">Best offers near you, live</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xl leading-none transition hover:bg-white/25">
              ×
            </button>
          </header>

          <div className="flex items-center gap-2 border-b border-purple-100 bg-purple-50 px-4 py-2 text-small">
            <PinIcon size={16} className="shrink-0 text-purple-700" />
            {coords ? (
              <span className="truncate text-purple-900">Using your location{place ? `: ${place}` : ''}</span>
            ) : (
              <>
                <span className="flex-1 truncate text-purple-900">Share your location for nearby offers</span>
                <button type="button" onClick={request} disabled={status === 'asking'} className="rounded-full bg-purple-700 px-3 py-1 text-[12px] font-bold text-white">
                  {status === 'asking' ? 'Locating...' : 'Allow'}
                </button>
              </>
            )}
          </div>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex gap-2'}>
                {m.role === 'assistant' && <OfferaMark size={28} className="mt-0.5 shrink-0" />}
                <div className={m.role === 'user' ? 'max-w-[82%]' : 'min-w-0 max-w-[88%]'}>
                  <p
                    className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-body ${
                      m.role === 'user' ? 'rounded-br-md bg-purple-700 text-white' : 'rounded-tl-md bg-purple-50 text-ink'
                    }`}
                  >
                    {m.content}
                  </p>
                  {m.offers && m.offers.length > 0 && (
                    <div className="-mr-4 mt-2 flex snap-x gap-2 overflow-x-auto pb-1 pr-4 [scrollbar-width:none]">
                      {m.offers.map((o) => (
                        <MiniOffer key={o.id} o={o} onOpen={() => setOpen(false)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex gap-2">
                <OfferaMark size={28} className="mt-0.5 shrink-0" />
                <span className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-purple-50 px-4 py-3" aria-label="Offera AI is typing">
                  {[0, 150, 300].map((d) => (
                    <span key={d} style={{ animationDelay: `${d}ms` }} className="h-2 w-2 animate-bounce rounded-full bg-purple-400" />
                  ))}
                </span>
              </div>
            )}

            {msgs.length === 1 && !busy && (
              <div className="flex flex-wrap gap-2 pt-1">
                {CHIPS.map((c) => (
                  <button key={c} type="button" onClick={() => void send(c)} className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-small font-semibold text-purple-800 transition hover:bg-purple-50 active:scale-95">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(text);
            }}
            className="border-t border-purple-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center gap-2">
              <input
                ref={input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={300}
                placeholder="Ask about offers..."
                aria-label="Ask Offera AI about offers"
                className="input h-11 rounded-full px-4"
              />
              <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white transition active:scale-95 disabled:opacity-40">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted">Offera AI only answers questions about offers.</p>
          </form>
        </div>
      )}
    </>
  );
}

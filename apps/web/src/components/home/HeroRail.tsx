'use client';

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';

const SLIDE_MS = 8_000;

/**
 * A row of banner cards, several visible at once with the next one peeking in. It slides one card to the left every
 * 8 seconds and loops without end: after the last card the first one comes round again behind it. It pauses while the
 * pointer is over it or the tab is hidden, and can be swiped or scrolled.
 *
 * To loop, the cards are rendered twice. When the row comes to rest in the second copy, it silently jumps back by one
 * copy, which looks identical.
 */
export function HeroRail({
  children,
  label,
  onIndexChange,
}: {
  children: ReactNode;
  label: string;
  /** called with the card in view, so the page can match its colour */
  onIndexChange?: (i: number) => void;
}) {
  const cards = Children.toArray(children);
  const count = cards.length;
  const loop = count > 1;
  const items = loop ? [...cards, ...cards] : cards;
  const rail = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [pos, setPos] = useState(0); // position in the doubled row
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const index = count ? pos % count : 0;

  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(q.matches);
    const on = () => setReduced(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);

  const offsetOf = (el: HTMLDivElement, i: number) => (el.children[i] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft;
  const jump = (el: HTMLDivElement, left: number) => el.scrollTo({ left, behavior: 'instant' as ScrollBehavior });

  const go = useCallback(
    (i: number) => {
      const el = rail.current;
      if (!el || !el.children.length) return;
      const target = Math.max(0, Math.min(i, el.children.length - 1));
      el.scrollTo({ left: offsetOf(el, target), behavior: reduced ? ('instant' as ScrollBehavior) : 'smooth' });
    },
    [reduced],
  );

  const prev = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    // from the first card, hop (unseen) to the same card in the second copy, then slide back one
    if (loop && pos === 0) {
      jump(el, offsetOf(el, count));
      requestAnimationFrame(() => go(count - 1));
    } else {
      go(pos - 1);
    }
  }, [go, loop, pos, count]);

  // keep the dots in step with manual swiping, and once resting in the second copy hop back to the first
  const onScroll = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const d = Math.abs(offsetOf(el, i) - el.scrollLeft);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setPos(best);
    if (!loop) return;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      if (best >= count) jump(el, el.scrollLeft - offsetOf(el, count));
    }, 160);
  }, [loop, count]);

  useEffect(() => () => clearTimeout(settle.current), []);

  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  // every 8 seconds slide to the next card (right to left); any change of card restarts the 8 seconds
  useEffect(() => {
    if (paused || reduced || count < 2) return;
    const id = setTimeout(() => {
      if (!document.hidden) go(pos + 1);
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [pos, paused, reduced, count, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="group relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={rail}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((c, i) => {
          const copy = i >= count;
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${(i % count) + 1} of ${count}`}
              aria-hidden={copy || undefined}
              // the second copy only exists for the loop: keep keyboard users out of it
              {...(copy ? { inert: true } : {})}
              className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[31%] lg:w-[23.5%]"
            >
              {c}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Previous banner"
        onClick={prev}
        className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-card-hover transition hover:scale-105 md:flex md:opacity-0 md:group-hover:opacity-100"
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        aria-label="Next banner"
        onClick={() => go(pos + 1)}
        className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-card-hover transition hover:scale-105 md:flex md:opacity-0 md:group-hover:opacity-100"
      >
        <ChevronRightIcon />
      </button>

      <div className="mt-3 flex justify-center gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show banner ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(pos >= count ? i + count : i)}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-purple-600' : 'w-2 bg-purple-200 hover:bg-purple-300'}`}
          />
        ))}
      </div>
    </section>
  );
}

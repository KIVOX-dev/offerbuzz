'use client';

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';

const SLIDE_MS = 10_000;

/**
 * A row of banner cards, several visible at once with the next one peeking in. It advances by one card every
 * 10 seconds and loops, pauses while the pointer is over it or the tab is hidden, and can be swiped or scrolled.
 */
export function HeroRail({ children, label }: { children: ReactNode; label: string }) {
  const cards = Children.toArray(children);
  const count = cards.length;
  const rail = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(q.matches);
    const on = () => setReduced(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);

  const go = useCallback(
    (i: number) => {
      const el = rail.current;
      const kids = el?.children;
      if (!el || !kids?.length) return;
      const target = kids[((i % count) + count) % count] as HTMLElement;
      el.scrollTo({ left: target.offsetLeft - (kids[0] as HTMLElement).offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
    },
    [count, reduced],
  );

  // keep the dots in step with manual swiping and scrolling
  const onScroll = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const first = (el.children[0] as HTMLElement).offsetLeft;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).offsetLeft - first - el.scrollLeft);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setIndex(best);
  }, []);

  // every 10 seconds move to the next card; any change of card restarts the 10 seconds
  useEffect(() => {
    if (paused || reduced || count < 2) return;
    const id = setTimeout(() => {
      if (!document.hidden) go(index + 1);
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [index, paused, reduced, count, go]);

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
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((c, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            className="w-[88%] shrink-0 snap-start sm:w-[62%] lg:w-[calc(42%-8px)]"
          >
            {c}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous banner"
        onClick={() => go(index - 1)}
        className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-card-hover transition hover:scale-105 md:flex md:opacity-0 md:group-hover:opacity-100"
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        aria-label="Next banner"
        onClick={() => go(index + 1)}
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
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-purple-600' : 'w-2 bg-purple-200 hover:bg-purple-300'}`}
          />
        ))}
      </div>
    </section>
  );
}

'use client';

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

const SLIDE_MS = 10_000;

/**
 * A banner slider that advances every 10 seconds and loops. It pauses while the pointer is over it, while the
 * tab is hidden, and for visitors who prefer reduced motion. Supports arrows, dots and swipe.
 */
export function Carousel({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(q.matches);
    const on = () => setReduced(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);

  // the timer restarts whenever the slide changes, so a manual click always gets a full 10 seconds
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
      className={`group relative overflow-hidden rounded-lg shadow-glow ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live={paused ? 'polite' : 'off'}
      >
        {slides.map((s, i) => (
          <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} aria-hidden={i !== index} className="h-full w-full shrink-0">
            {s}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous banner"
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-ink opacity-0 shadow-card transition group-hover:opacity-100 focus:opacity-100 md:flex"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label="Next banner"
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-ink opacity-0 shadow-card transition group-hover:opacity-100 focus:opacity-100 md:flex"
          >
            <ChevronRightIcon />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show banner ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-accent' : 'w-2 bg-white/60 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

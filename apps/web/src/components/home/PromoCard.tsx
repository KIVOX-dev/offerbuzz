/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import type { ReactNode } from 'react';

/** A 16 point starburst, used as the yellow sticker on the cards. */
const BURST = Array.from({ length: 32 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 32;
  const r = i % 2 === 0 ? 48 : 40;
  return `${(50 + r * Math.sin(a)).toFixed(1)},${(50 - r * Math.cos(a)).toFixed(1)}`;
}).join(' ');

export function Burst({ lines, size = 72 }: { lines: [string, string, string?]; size?: number }) {
  return (
    <span className="relative inline-flex origin-top-left -rotate-6 items-center justify-center drop-shadow-lg max-sm:-mb-4 max-sm:scale-[0.62]" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100" width={size} height={size} className="absolute inset-0">
        <polygon points={BURST} fill="#ffd60a" stroke="#f59e0b" strokeWidth="2" />
      </svg>
      <span className="relative text-center text-[11px] font-black uppercase leading-[1.05] text-[#7f1d1d]">
        {lines.map((l) => l && <span key={l} className="block">{l}</span>)}
      </span>
    </span>
  );
}

export type PromoTheme = 'blue' | 'indigo' | 'teal' | 'orange' | 'gold';

const THEMES: Record<PromoTheme, string> = {
  blue: 'from-[#2563eb] via-[#3b82f6] to-[#7dd3fc]',
  indigo: 'from-[#4338ca] via-[#4f46e5] to-[#3b82f6]',
  teal: 'from-[#0d9488] via-[#14b8a6] to-[#4ade80]',
  orange: 'from-[#ea580c] via-[#f97316] to-[#fbbf24]',
  gold: 'from-[#f59e0b] via-[#fbbf24] to-[#fde68a]',
};

/**
 * One grand banner card: saturated gradient with a graph-paper texture, big headline, sticker, a pill, and a photo
 * panel on the right. Pass `href` to make the whole card a link.
 */
export function PromoCard({
  theme,
  image,
  burst,
  children,
  href,
  label,
  dark,
  imagePosition = 'center',
  cutout,
}: {
  theme: PromoTheme;
  image: string;
  burst?: ReactNode;
  children: ReactNode;
  href?: string;
  label: string;
  /** dark text for light gradients (gold) */
  dark?: boolean;
  /** CSS object-position for the photo panel, to keep the subject in view */
  imagePosition?: string;
  /** a transparent cut-out (a person or product): stands on the card instead of filling a photo panel */
  cutout?: boolean;
}) {
  const body = (
    <div className={`relative h-[232px] overflow-hidden rounded-2xl bg-gradient-to-br shadow-card sm:h-[290px] md:h-[310px] ${THEMES[theme]} ${dark ? 'text-ink' : 'text-white'}`}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />
      <span aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-white/25 blur-2xl" />

      {cutout ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="pointer-events-none absolute -bottom-2 right-1 h-[104%] w-auto max-w-[44%] object-contain object-bottom sm:max-w-[52%] drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
        />
      ) : (
        <img
          src={image}
          alt=""
          loading="lazy"
          style={{ objectPosition: imagePosition }}
          className="absolute inset-y-0 right-0 h-full w-[38%] object-cover shadow-[-12px_0_24px_rgba(0,0,0,0.18)] sm:w-[46%]"
        />
      )}

      <div className="relative z-10 flex h-full max-w-[64%] flex-col items-start justify-center gap-1.5 p-4 sm:max-w-[56%] sm:gap-3 sm:p-5 md:p-6">
        {burst}
        {children}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} aria-label={label} className="block transition active:scale-[0.99] md:hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    <div aria-label={label}>{body}</div>
  );
}

/** The dark navy "50 - 80% Off" style pill. */
export function OffPill({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap rounded-xl border border-white/25 bg-[#1e1b6b] px-3 py-1.5 text-[14px] font-extrabold text-white shadow-lg sm:px-4 sm:py-2 sm:text-[17px]">{children}</span>;
}

/** The small white strip along the bottom of a card ("Up to Rs 100 off on your first order"). */
export function InfoStrip({ children }: { children: ReactNode }) {
  return <span className="hidden rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold leading-tight text-ink shadow-card sm:inline-block">{children}</span>;
}

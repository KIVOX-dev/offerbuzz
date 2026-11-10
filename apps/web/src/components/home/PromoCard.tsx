import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

/** A 16 point starburst, used as the sticker on the cards. */
const BURST = Array.from({ length: 32 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 32;
  const r = i % 2 === 0 ? 48 : 40;
  return `${(50 + r * Math.sin(a)).toFixed(1)},${(50 - r * Math.cos(a)).toFixed(1)}`;
}).join(' ');

export type PromoTheme = 'blue' | 'indigo' | 'teal' | 'orange' | 'gold';

/** Each card has its own accent: the headline shine, the pill glow, the tagline and the sticker all use it. */
const THEMES: Record<PromoTheme, { acc: string; pill: string; ink: string }> = {
  blue: { acc: '#22d3ee', pill: '#083344', ink: '#083344' },
  indigo: { acc: '#f9a8d4', pill: '#500724', ink: '#500724' },
  teal: { acc: '#bef264', pill: '#14532d', ink: '#1a2e05' },
  orange: { acc: '#fde047', pill: '#7c2d12', ink: '#431407' },
  gold: { acc: '#fdba74', pill: '#78350f', ink: '#431407' },
};

/** Accent from a picked colour, with dark shades of it for the pill and the ink. */
function customTheme(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const dark = (k: number) => '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join('');
  return { acc: hex, pill: dark(0.3), ink: dark(0.22) };
}

/**
 * One banner card: a full 5:8 photo with a live headline, an offer pill, a tagline and a sticker on top. The text is
 * animated (slide in, shine, glow, wiggle) and everything scales with the card width. Pass `href` to make the whole
 * card a link.
 */
export function PromoCard({
  theme,
  image,
  title,
  offer,
  tagline,
  burst,
  href,
  label,
  imagePosition = 'center',
  imageOnly = false,
  color,
}: {
  theme: PromoTheme;
  image: string;
  /** the headline; may hold a <small> line such as "of India" */
  title: ReactNode;
  offer?: string;
  tagline?: string;
  /** the sticker text, up to three short lines */
  burst?: [string, string, string?];
  href?: string;
  label: string;
  /** CSS background-position for the photo, to keep the subject in view */
  imagePosition?: string;
  /** just the photo: no text, sticker, shade or zoom */
  imageOnly?: boolean;
  /** custom accent (#rrggbb): replaces the theme colour; the dark pill and ink are derived from it */
  color?: string;
}) {
  const t = color ? customTheme(color) : THEMES[theme];
  const body = (
    <div
      className={`promo rounded-md shadow-card ${imageOnly ? 'promo-plain' : ''}`}
      style={{ '--acc': t.acc, '--pill': t.pill, '--ink': t.ink } as CSSProperties}
    >
      <div className="promo-bg" style={{ backgroundImage: `url(${JSON.stringify(image)})`, backgroundPosition: imagePosition }} />

      {!imageOnly && (
        <div className="promo-text">
          <h2 className="promo-title">{title}</h2>
          {offer && <span className="promo-pill">{offer}</span>}
          {tagline && <p className="promo-tag">{tagline}</p>}
        </div>
      )}

      {burst && !imageOnly && (
        <span className="promo-badge" aria-hidden>
          <svg viewBox="0 0 100 100">
            <polygon points={BURST} fill={t.acc} stroke={t.ink} strokeOpacity={0.35} strokeWidth="2" />
          </svg>
          <span>{burst.map((l) => l && <span key={l}>{l}</span>)}</span>
        </span>
      )}
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

/** The fields a card is drawn from (the admin edits these; the home page gets them from the API). */
export interface PromoCardData {
  title: string;
  subtitle?: string;
  offer?: string;
  tagline?: string;
  burst: string[];
  theme: PromoTheme;
  image: string;
  category?: string;
  imageOnly?: boolean;
  color?: string;
}

/** A card drawn from its data. With a category it links to that category's search. */
export function PromoCardView({ card, linked = true }: { card: PromoCardData; linked?: boolean }) {
  const lines = card.burst.filter(Boolean).slice(0, 3);
  return (
    <PromoCard
      theme={card.theme}
      image={card.image}
      label={card.title}
      title={card.subtitle ? <>{card.title}<small>{card.subtitle}</small></> : card.title}
      offer={card.offer}
      tagline={card.tagline}
      burst={lines.length ? ([lines[0]!, lines[1] ?? '', lines[2]] as [string, string, string?]) : undefined}
      imageOnly={card.imageOnly}
      color={card.color}
      href={linked && card.category ? `/search?category=${encodeURIComponent(card.category)}` : undefined}
    />
  );
}

import { useId } from 'react';

/**
 * The Offera AI logo: a purple badge holding a white chat bubble with a golden price tag (a % on it) inside, and AI
 * sparkles at the top right. Drawn in code so it stays sharp at any size and needs no image file.
 */
export function OfferaMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const bg = `ob-bg-${uid}`;
  const shine = `ob-shine-${uid}`;
  const tag = `ob-tag-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Offera AI" className={className}>
      <defs>
        <linearGradient id={bg} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9b6dff" />
          <stop offset="0.55" stopColor="#6d3fc9" />
          <stop offset="1" stopColor="#3b1a8a" />
        </linearGradient>
        <radialGradient id={shine} cx="22" cy="14" r="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={tag} x1="24" y1="23" x2="40" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd84d" />
          <stop offset="1" stopColor="#f4a900" />
        </linearGradient>
      </defs>

      {/* badge */}
      <circle cx="32" cy="32" r="31" fill={`url(#${bg})`} />
      <circle cx="32" cy="32" r="31" fill={`url(#${shine})`} />
      <circle cx="32" cy="32" r="30.25" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />

      {/* chat bubble */}
      <path
        d="M22 15H42A9 9 0 0 1 51 24V34A9 9 0 0 1 42 43H31L21 52V43A9 9 0 0 1 13 34V24A9 9 0 0 1 22 15Z"
        fill="#fff"
      />

      {/* price tag with a % on it */}
      <g transform="translate(32 29) scale(1.3) translate(-32 -29)">
      <path d="M24 29L29 23H38A2 2 0 0 1 40 25V33A2 2 0 0 1 38 35H29Z" fill={`url(#${tag})`} />
      <circle cx="29" cy="29" r="1.7" fill="#5b2bb5" />
      <circle cx="33.4" cy="26.7" r="1.15" fill="#5b2bb5" />
      <circle cx="37.1" cy="31.4" r="1.15" fill="#5b2bb5" />
      <path d="M37.3 25.8L33.2 32.3" stroke="#5b2bb5" strokeWidth="1.4" strokeLinecap="round" />
      </g>

      {/* AI sparkles */}
      <path d="M50 5.5L51.9 10.6L57 12.5L51.9 14.4L50 19.5L48.1 14.4L43 12.5L48.1 10.6Z" fill="#ffd60a" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
      <path d="M57 24L58 26.6L60.6 27.6L58 28.6L57 31.2L56 28.6L53.4 27.6L56 26.6Z" fill="#fff" />
      <path d="M9.5 8L10.3 10.2L12.5 11L10.3 11.8L9.5 14L8.7 11.8L6.5 11L8.7 10.2Z" fill="#fff" fillOpacity="0.85" />
    </svg>
  );
}

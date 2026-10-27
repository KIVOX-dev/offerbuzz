/** Design tokens, defined once. Tailwind config and the React Native theme both read from here. */
export const tokens = {
  colors: {
    // sampled from the OfferBuzz logo (apps/web/public/brand)
    primary: '#4F2F96',
    primaryDark: '#3E2477',
    primarySoft: '#EFEAF8',
    accent: '#F4B400', // the yellow dot in the logo; approximate, adjust against the brand file
    ink: '#222222', // text and dark accents
    /** Shade scale; 700 is the logo purple. */
    purple: {
      50: '#F6F3FB',
      100: '#EBE3F8',
      200: '#D5C6F0',
      300: '#B99DE4',
      400: '#9669D4',
      500: '#7242BD',
      600: '#5E37A8',
      700: '#4F2F96',
      800: '#3E2477',
      900: '#2B1856',
      950: '#1B0E38',
    },
    page: '#F6F3FB', // faint lavender instead of neutral grey
    card: '#FFFFFF',
    border: '#E4E6EA',
    muted: '#6B7280',
    success: '#16A34A',
    danger: '#DC2626',
  },
  gradients: {
    brand: 'linear-gradient(135deg, #7242BD 0%, #4F2F96 55%, #3E2477 100%)',
    brandHover: 'linear-gradient(135deg, #8150CC 0%, #5E37A8 55%, #4A2B8A 100%)',
    hero: 'linear-gradient(120deg, #1B0E38 0%, #3E2477 45%, #7242BD 100%)',
  },
  shadows: {
    card: '0 1px 3px rgba(43, 24, 86, 0.08)',
    cardHover: '0 8px 24px rgba(79, 47, 150, 0.16)',
    glow: '0 6px 16px rgba(79, 47, 150, 0.35)',
    glowSm: '0 3px 8px rgba(79, 47, 150, 0.28)',
  },
  /** px, multiples of 4 */
  spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 },
  radius: { sm: 4, md: 8 },
  fontSize: { body: 14, small: 12, section: 18, title: 24 },
  layout: {
    containerMax: 1280,
    headerHeightDesktop: 64,
    headerHeightMobile: 52,
    searchHeight: 40,
    bottomNavHeight: 56,
    minTouchTarget: 44,
    buttonHeightMobile: 48,
    categoryIcon: 60,
  },
  fontFamily: 'Inter',
} as const;

export type Tokens = typeof tokens;

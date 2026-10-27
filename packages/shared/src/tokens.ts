/** Design tokens, defined once. Tailwind config and the React Native theme both read from here. */
export const tokens = {
  colors: {
    primary: '#FF6A00',
    primaryDark: '#E05A00',
    primarySoft: '#FFF0E5',
    navy: '#14213D',
    page: '#F5F6F8',
    card: '#FFFFFF',
    border: '#E4E6EA',
    muted: '#6B7280',
    success: '#16A34A',
    danger: '#DC2626',
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

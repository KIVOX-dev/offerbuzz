const { tokens } = require('@offerbuzz/shared');

const px = (n) => `${n}px`;
const mapPx = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, px(v)]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ...tokens.colors },
      spacing: mapPx(tokens.spacing),
      borderRadius: mapPx(tokens.radius),
      fontFamily: { sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'] },
      fontSize: {
        body: px(tokens.fontSize.body),
        small: px(tokens.fontSize.small),
        section: px(tokens.fontSize.section),
        title: px(tokens.fontSize.title),
      },
      maxWidth: { container: px(tokens.layout.containerMax) },
      height: {
        header: px(tokens.layout.headerHeightDesktop),
        'header-sm': px(tokens.layout.headerHeightMobile),
        search: px(tokens.layout.searchHeight),
        btn: px(tokens.layout.buttonHeightMobile),
      },
      minHeight: { touch: px(tokens.layout.minTouchTarget) },
      boxShadow: { card: '0 1px 3px rgba(20,33,61,0.08)' },
    },
  },
  plugins: [],
};

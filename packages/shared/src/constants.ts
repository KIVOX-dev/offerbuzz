export const ROLES = ['customer', 'merchant', 'intermediary', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/** Roles a person may pick themselves at signup. Admin accounts are only created by the seed script. */
export const SELF_SERVE_ROLES = ['customer', 'merchant', 'intermediary'] as const;
export type SelfServeRole = (typeof SELF_SERVE_ROLES)[number];

export const USER_STATUSES = ['active', 'pending', 'blocked'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const CATEGORIES = [
  'Salon and Spa',
  'Fashion',
  'Mobile and Electronics',
  'Travels',
  'Home Appliance',
  'Gifts and Toys',
  'Fitness and Sports',
  'Food and Restaurant',
  'Education',
  'Grocery',
  'Medical',
  'Cafe and Bakeries',
  'Automobiles',
  'Baby Products',
  'Real Estate',
  'Jewellery',
  'Home Made Products',
  'Organic',
] as const;

export const OFFER_STATUSES = ['pending', 'active', 'rejected', 'expired'] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

/** percent: 1-99 off, amount: Rs off, deal: free text offer such as "Buy 1 Get 1" (no number). */
export const DISCOUNT_TYPES = ['percent', 'amount', 'deal'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PAYOUT_STATUSES = ['pending', 'paid', 'rejected'] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Defaults for the admin editable settings collection. Never hardcode these in business logic. */
export const DEFAULT_SETTINGS = {
  planPrice: 100, // Rs per month
  commissionCredits: 30, // credits per paid month, 1 credit = Rs 1
  holdDays: 365,
  payoutThreshold: 100,
  graceDays: 3,
} as const;

export const OTP = {
  length: 6,
  ttlMinutes: 5,
  maxAttempts: 5,
  resendSeconds: 30,
} as const;

// ---- Home page promo cards (editable by the admin) ------------------------------------------------------
export const PROMO_THEMES = ['blue', 'indigo', 'teal', 'orange', 'gold'] as const;
export type PromoThemeName = (typeof PROMO_THEMES)[number];

/** Photos that ship with the website; the admin can also upload one. */
export const PROMO_PRESET_IMAGES = [
  '/banners/electronics.webp',
  '/banners/fashion.webp',
  '/banners/grocery.webp',
  '/banners/travel.webp',
  '/categories/home.webp',
  '/categories/beauty.webp',
  '/categories/food.webp',
  '/categories/fitness.webp',
  '/categories/health.webp',
  '/categories/baby.webp',
  '/categories/pets.webp',
  '/categories/automotive.webp',
] as const;

/** What the home page shows until the admin has saved any cards of their own. */
export const DEFAULT_PROMO_CARDS = [
  { title: 'Sale is live', offer: '50 - 80% Off', tagline: 'Up to Rs 100 off on your first order', burst: ['BIG', 'SAVE', 'DAYS'], theme: 'blue', image: '/banners/electronics.webp', category: 'Mobile and Electronics' },
  { title: 'Festivals', subtitle: 'of India', offer: 'From Rs 99', tagline: 'Festive styles for everyone', burst: ['BIG', 'SAVE', 'DAYS'], theme: 'indigo', image: '/banners/fashion.webp', category: 'Fashion' },
  { title: 'Fresh groceries', offer: 'Min. 15% Off', tagline: 'Stock up at your local store', burst: ['FRESH', 'EVERY', 'DAY'], theme: 'teal', image: '/banners/grocery.webp', category: 'Grocery' },
  { title: 'Weekend getaways', offer: 'Up to 30% Off', tagline: 'Short trips, great deals', burst: ['WEEK', 'END', 'SALE'], theme: 'orange', image: '/banners/travel.webp', category: 'Travels' },
  { title: 'Rs 50 off', offer: 'First order', tagline: 'Claim it on your first order', burst: ['NEW', 'USER', 'DEAL'], theme: 'gold', image: '/categories/home.webp' },
] as const;

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

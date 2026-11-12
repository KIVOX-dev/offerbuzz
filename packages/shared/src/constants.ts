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

/**
 * percent: 1-99 off, amount: Rs off, upto_percent: "Up to 40% off", upto_amount: "Up to Rs 500 off",
 * deal: free text offer such as "Buy 1 Get 1" (no number).
 */
export const DISCOUNT_TYPES = ['percent', 'amount', 'upto_percent', 'upto_amount', 'deal'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

/** True for the types that are a percentage (1-99). */
export const isPercentType = (t: DiscountType) => t === 'percent' || t === 'upto_percent';

/** One wording for a discount everywhere: "30% off", "Up to 40% off", "Rs 200 off", "Up to Rs 500 off", "Special deal". */
export function discountPhrase(type: DiscountType, value?: number | string | null): string {
  const v = value === undefined || value === null || value === '' ? undefined : value;
  switch (type) {
    case 'deal':
      return 'Special deal';
    case 'percent':
      return v === undefined ? '% off' : `${v}% off`;
    case 'upto_percent':
      return v === undefined ? 'Up to % off' : `Up to ${v}% off`;
    case 'amount':
      return v === undefined ? 'Rs off' : `Rs ${v} off`;
    case 'upto_amount':
      return v === undefined ? 'Up to Rs off' : `Up to Rs ${v} off`;
  }
}

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
  commissionPercent: 25, // % of every subscription a merchant pays, credited to their Refer & Earn partner (1 credit = Rs 1)
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
  { title: 'Rs 50 off', offer: 'First order', tagline: 'Claim it on your first order', burst: ['NEW', 'USER', 'DEAL'], theme: 'gold', image: '/categories/home.webp', category: 'Home Appliance' },
] as const;

/**
 * The "Shop by Category" tiles on the home page until the admin saves tiles of their own. `category` is the shop category
 * the tile opens in search; a tile without one searches for its name.
 */
export const DEFAULT_CATEGORY_TILES = [
  { name: 'Grocery', image: '/categories/grocery.webp', category: 'Grocery' },
  { name: 'Fashion & Clothing', image: '/categories/fashion.webp', category: 'Fashion' },
  { name: 'Electronics', image: '/categories/electronics.webp', category: 'Mobile and Electronics' },
  { name: 'Home & Living', image: '/categories/home.webp', category: 'Home Appliance' },
  { name: 'Beauty & Personal Care', image: '/categories/beauty.webp', category: 'Salon and Spa' },
  { name: 'Health & Pharmacy', image: '/categories/health.webp', category: 'Medical' },
  { name: 'Fitness & Sports', image: '/categories/fitness.webp', category: 'Fitness and Sports' },
  { name: 'Baby & Kids', image: '/categories/baby.webp', category: 'Baby Products' },
  { name: 'Food & Beverages', image: '/categories/food.webp', category: 'Food and Restaurant' },
  { name: 'Automotive', image: '/categories/automotive.webp', category: 'Automobiles' },
  { name: 'Pets', image: '/categories/pets.webp' },
  { name: 'Travel & Lifestyle', image: '/categories/travel.webp', category: 'Travels' },
  { name: 'Gifts & Toys', image: '/categories/gifts.webp', category: 'Gifts and Toys' },
  { name: 'Education', image: '/categories/education.webp', category: 'Education' },
  { name: 'Cafe & Bakeries', image: '/categories/cafe.webp', category: 'Cafe and Bakeries' },
  { name: 'Real Estate', image: '/categories/realestate.webp', category: 'Real Estate' },
  { name: 'Jewellery', image: '/categories/jewellery.webp', category: 'Jewellery' },
  { name: 'Home Made Products', image: '/categories/homemade.webp', category: 'Home Made Products' },
  { name: 'Organic', image: '/categories/organic.webp', category: 'Organic' },
] as const;

/** Photos that ship with the website, offered when editing a category tile. */
export const CATEGORY_PRESET_IMAGES = DEFAULT_CATEGORY_TILES.map((t) => t.image);

/** Sub categories a merchant can pick when posting an offer, and shoppers can filter by. */
export const SUBCATEGORIES: Record<(typeof CATEGORIES)[number], readonly string[]> = {
  'Salon and Spa': ['Hair care', 'Skin care & facial', 'Bridal makeup', 'Spa & massage', 'Nails', "Men's grooming"],
  Fashion: ["Men's wear", "Women's wear", 'Kids wear', 'Ethnic & sarees', 'Footwear', 'Bags & accessories'],
  'Mobile and Electronics': ['Mobiles', 'Laptops & computers', 'TVs & audio', 'Cameras', 'Accessories', 'Repairs'],
  Travels: ['Tour packages', 'Flights & trains', 'Hotels & stays', 'Cab & car rental', 'Visa & passport'],
  'Home Appliance': ['Kitchen appliances', 'Refrigerators', 'Washing machines', 'ACs & coolers', 'Furniture', 'Small appliances'],
  'Gifts and Toys': ['Toys', 'Gift items', 'Flowers & bouquets', 'Cakes & hampers', 'Stationery'],
  'Fitness and Sports': ['Gym membership', 'Yoga & zumba', 'Sports gear', 'Sportswear', 'Personal training'],
  'Food and Restaurant': ['Restaurants', 'Fast food', 'Biryani & non-veg', 'Veg & meals', 'Sweets', 'Catering'],
  Education: ['Tuition & coaching', 'Computer courses', 'Language classes', 'Skill training', 'Books & stationery'],
  Grocery: ['Supermarket', 'Fruits & vegetables', 'Dairy & eggs', 'Provisions', 'Snacks & beverages'],
  Medical: ['Pharmacy', 'Clinics & doctors', 'Diagnostics & labs', 'Dental', 'Optical', 'Wellness'],
  'Cafe and Bakeries': ['Cafe', 'Bakery', 'Cakes', 'Ice cream & desserts', 'Juice & shakes'],
  Automobiles: ['Cars', 'Two wheelers', 'Service & repair', 'Spares & accessories', 'Tyres & batteries', 'Car wash'],
  'Baby Products': ['Baby clothing', 'Diapers & care', 'Baby food', 'Toys & gear', 'Prams & furniture'],
  'Real Estate': ['Apartments', 'Villas & houses', 'Plots & land', 'Commercial', 'Rentals'],
  Jewellery: ['Gold', 'Silver', 'Diamond', 'Imitation jewellery', 'Watches'],
  'Home Made Products': ['Pickles & snacks', 'Sweets & savouries', 'Handicrafts', 'Clothing & tailoring', 'Cosmetics'],
  Organic: ['Organic vegetables', 'Grains & pulses', 'Oils & spices', 'Personal care', 'Millets & health foods'],
};

/** Merchant subscription plans: Rs per month. */
export const MERCHANT_PLANS = {
  basic: { name: 'Basic', price: 149 },
  premium: { name: 'Premium', price: 349 },
  featured: { name: 'Featured', price: 599 },
} as const;
export type MerchantPlan = keyof typeof MERCHANT_PLANS;
export const MERCHANT_PLAN_KEYS = ['basic', 'premium', 'featured'] as const;

/** Paying for 6 or 12 months at once is 10% cheaper. */
export const LONG_TERM_DISCOUNT_PERCENT = 10;
export const LONG_TERM_MIN_MONTHS = 6;

/** What a merchant pays for `months` of a plan, in whole rupees. */
export function planAmount(plan: MerchantPlan, months: number): number {
  const gross = MERCHANT_PLANS[plan].price * months;
  return months >= LONG_TERM_MIN_MONTHS ? Math.round((gross * (100 - LONG_TERM_DISCOUNT_PERCENT)) / 100) : gross;
}

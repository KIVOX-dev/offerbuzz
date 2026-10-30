import { z } from 'zod';
import { CATEGORIES, DISCOUNT_TYPES, OTP, ROLES, SELF_SERVE_ROLES, USER_STATUSES } from './constants';

/** Accepts 10 digits, 91XXXXXXXXXX or +91XXXXXXXXXX (Indian mobiles) and returns +91XXXXXXXXXX, or null. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '').replace(/^\+/, '');
  const m = /^(?:91)?([6-9]\d{9})$/.exec(digits);
  return m ? `+91${m[1]}` : null;
}

/** Phone numbers are profile data (shop contact, intermediary details), not a login method. */
export const phoneSchema = z.string().transform((v, ctx) => {
  const n = normalizePhone(v);
  if (!n) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid 10 digit mobile number' });
  return n as string;
});

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

const role = z.enum(SELF_SERVE_ROLES);

/** `signup` creates an account (name required); `signin` only works for an existing account. */
const mode = z.enum(['signin', 'signup']).default('signin');
const name = z.string().trim().min(2, 'Enter your name').max(80);

/** Same alphabet as the generator in the API: no 0, O, 1 or I. */
export const referralCodeSchema = z.string().trim().toUpperCase().regex(/^[A-HJ-NP-Z2-9]{8}$/, 'Invalid referral code');

/** Login codes are sent by email only. */
export const sendOtpSchema = z.object({ email, mode, role: role.optional() });
export const verifyOtpSchema = z
  .object({
    email,
    code: z.string().regex(new RegExp(`^\\d{${OTP.length}}$`), `Code must be ${OTP.length} digits`),
    mode,
    role: role.optional(),
    name: name.optional(),
    /** intermediary referral code, used only when a vendor signs up */
    referralCode: referralCodeSchema.optional(),
    /** vendors only: the one category all of this shop's offers belong to */
    category: z.enum(CATEGORIES).optional(),
  })
  .refine((v) => v.mode !== 'signup' || Boolean(v.name), { message: 'Enter your name', path: ['name'] });

export const googleSchema = z.object({ idToken: z.string().min(10), role: role.optional() });
export const refreshSchema = z.object({ refreshToken: z.string().min(20) });
export const adminLoginSchema = z.object({ email, password: z.string().min(8).max(128) });

/** Vendor and intermediary passwords: 8+ characters with at least one letter and one number. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password needs at least one letter')
  .regex(/\d/, 'Password needs at least one number');
export const setPasswordSchema = z.object({ password: passwordSchema });
export const passwordLoginSchema = z.object({ email, password: z.string().min(1).max(128) });

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type GoogleInput = z.infer<typeof googleSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;

// ---- Profile and offers ------------------------------------------------------------------------

/** A shop pin. Latitude and longitude are range checked; address and placeId come from Places search when used. */
export const locationInputSchema = z.object({
  lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  address: z.string().trim().max(300).optional(),
  placeId: z.string().trim().max(200).optional(),
});

/** GET /offers/nearby */
export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(100).default(10),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** GET /search/suggest: what to offer while the customer is still typing. */
export const suggestQuerySchema = z.object({ q: z.string().trim().min(2, 'Type at least 2 characters').max(60) });

/** GET /offers/search: free text and/or one category (neither = every live offer); lat/lng sort by distance. */
export const searchQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  category: z.enum(CATEGORIES).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().int().min(1).max(60).default(40),
});

/** POST /ai/chat: the conversation so far (newest last) and, if the visitor shared it, where they are. */
export const aiChatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(500) }))
    .min(1)
    .max(10),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

/** Every field optional: send only what changed. Empty strings clear optional fields. */
export const updateProfileSchema = z.object({
  name: name.optional(),
  phone: z.union([phoneSchema, z.literal('')]).optional(),
  shopName: z.string().trim().max(80).optional(),
  city: z.string().trim().max(60).optional(),
  /** vendors only: can be set once (for accounts that signed up without one) and is then locked */
  category: z.enum(CATEGORIES).optional(),
  /** vendors only: the shop pin; the address is looked up once on save when not supplied */
  location: locationInputSchema.optional(),
});

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date');

export const offerInputSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().trim().min(10, 'Describe the offer in at least 10 characters').max(600),
    category: z.enum(CATEGORIES, { message: 'Choose a category' }),
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: z.coerce.number().positive('Enter the discount').max(1_000_000).optional(),
    startsAt: day,
    endsAt: day,
    area: z.string().trim().min(2, 'Enter the area or city').max(100),
    terms: z.string().trim().max(300).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.discountType !== 'deal' && v.discountValue === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountValue'], message: 'Enter the discount' });
    }
    if (v.discountType === 'percent' && v.discountValue !== undefined && v.discountValue >= 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountValue'], message: 'Percent must be below 100' });
    }
    if (v.endsAt < v.startsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endsAt'], message: 'End date must be on or after the start date' });
    }
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type SuggestQuery = z.infer<typeof suggestQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type LocationInput = z.infer<typeof locationInputSchema>;
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
export type OfferInput = z.infer<typeof offerInputSchema>;

// ---- Admin ---------------------------------------------------------------------------------------

export const adminUsersQuerySchema = z.object({
  role: z.enum(ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
/** Only these two moves are allowed from the admin screen: approve/unblock, or block. */
export const setUserStatusSchema = z.object({ status: z.enum(['active', 'blocked']) });
export const recordPaymentSchema = z.object({ months: z.coerce.number().int().min(1).max(12).default(1) });
export const rejectPayoutSchema = z.object({ note: z.string().trim().max(200).optional() });

export const adminOffersQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  /** running = approved and inside its dates today; pending = waiting for approval */
  view: z.enum(['running', 'pending', 'all']).default('running'),
});
export const setOfferStatusSchema = z.object({ status: z.enum(['active', 'rejected']) });

export type AdminOffersQuery = z.infer<typeof adminOffersQuerySchema>;
export type SetOfferStatusInput = z.infer<typeof setOfferStatusSchema>;
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type SetUserStatusInput = z.infer<typeof setUserStatusSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type RejectPayoutInput = z.infer<typeof rejectPayoutSchema>;

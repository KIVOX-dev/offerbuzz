import { z } from 'zod';
import { CATEGORIES, DISCOUNT_TYPES, OTP, SELF_SERVE_ROLES } from './constants';

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

/** Login codes are sent by email only. */
export const sendOtpSchema = z.object({ email, mode, role: role.optional() });
export const verifyOtpSchema = z
  .object({
    email,
    code: z.string().regex(new RegExp(`^\\d{${OTP.length}}$`), `Code must be ${OTP.length} digits`),
    mode,
    role: role.optional(),
    name: name.optional(),
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

/** Every field optional: send only what changed. Empty strings clear optional fields. */
export const updateProfileSchema = z.object({
  name: name.optional(),
  phone: z.union([phoneSchema, z.literal('')]).optional(),
  shopName: z.string().trim().max(80).optional(),
  city: z.string().trim().max(60).optional(),
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
export type OfferInput = z.infer<typeof offerInputSchema>;

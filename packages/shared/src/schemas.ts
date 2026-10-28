import { z } from 'zod';
import { OTP, SELF_SERVE_ROLES } from './constants';

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

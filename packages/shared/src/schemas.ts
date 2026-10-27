import { z } from 'zod';
import { OTP, SELF_SERVE_ROLES } from './constants';

/** Accepts 10 digits, 91XXXXXXXXXX or +91XXXXXXXXXX (Indian mobiles) and returns +91XXXXXXXXXX, or null. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '').replace(/^\+/, '');
  const m = /^(?:91)?([6-9]\d{9})$/.exec(digits);
  return m ? `+91${m[1]}` : null;
}

const phone = z
  .string()
  .transform((v, ctx) => {
    const n = normalizePhone(v);
    if (!n) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid 10 digit mobile number' });
    return n as string;
  });

const email = z.string().trim().toLowerCase().email();

/** Exactly one of phone or email identifies the person. */
const identifier = z
  .object({ phone: phone.optional(), email: email.optional() })
  .refine((v) => Boolean(v.phone) !== Boolean(v.email), { message: 'Provide either phone or email' });

const role = z.enum(SELF_SERVE_ROLES);

export const sendOtpSchema = identifier;
export const verifyOtpSchema = z
  .object({
    phone: phone.optional(),
    email: email.optional(),
    code: z.string().regex(new RegExp(`^\\d{${OTP.length}}$`), `Code must be ${OTP.length} digits`),
    role: role.optional(),
    name: z.string().trim().min(1).max(80).optional(),
  })
  .refine((v) => Boolean(v.phone) !== Boolean(v.email), { message: 'Provide either phone or email' });

export const googleSchema = z.object({ idToken: z.string().min(10), role: role.optional() });
export const refreshSchema = z.object({ refreshToken: z.string().min(20) });
export const adminLoginSchema = z.object({ email, password: z.string().min(8).max(128) });

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type GoogleInput = z.infer<typeof googleSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

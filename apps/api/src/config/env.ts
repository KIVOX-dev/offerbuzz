import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Workspace scripts run from apps/api, but the single .env lives at the repo root.
// Real environment variables (Catalyst, Docker) always win; dotenv never overrides them.
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // AppSail hands the port to the app through X_ZOHO_CATALYST_LISTEN_PORT (unverified, see infra/catalyst)
    PORT: z.coerce.number().default(3001),
    X_ZOHO_CATALYST_LISTEN_PORT: z.coerce.number().optional(),
    MONGODB_URI: z.string().min(1),
    // Optional, comma separated. Use when the local resolver refuses mongodb+srv lookups.
    DNS_SERVERS: z.string().optional(),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
    OTP_SECRET: z.string().min(32),
    OTP_DEV_MODE: bool,
    GOOGLE_CLIENT_IDS: z.string().default(''),
    // accepted as well, because it is the name most people reach for first
    GOOGLE_CLIENT_ID: z.string().optional(),
    // one Google Maps key shared by web, Android and this API (reverse geocoding when a vendor saves a pin)
    GOOGLE_MAPS_API_KEY: z.string().optional(),
    // Offera AI (Groq free tier). Models are tried in this order; if one is rate limited or down the next is used.
    GROQ_API_KEY: z.string().optional(),
    GROQ_MODELS: z.string().default('llama-3.3-70b-versatile,llama-3.1-8b-instant,openai/gpt-oss-20b,gemma2-9b-it'),
    BREVO_API_KEY: z.string().optional(),
    BREVO_SENDER_EMAIL: z.string().default('no-reply@offerbuzz.co'),
    BREVO_SENDER_NAME: z.string().default('OfferBuzz'),
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.NODE_ENV === 'production' && v.OTP_DEV_MODE) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'OTP_DEV_MODE must be false in production' });
    }
  });

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.') || 'env'}: ${i.message}`).join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${msg}`);
  }
  return parsed.data;
}

let cached: Env | undefined;
/** Lazily parsed so tests can set process.env before first use. */
export const env = (): Env => (cached ??= loadEnv());
export const resetEnvCache = (): void => {
  cached = undefined;
};

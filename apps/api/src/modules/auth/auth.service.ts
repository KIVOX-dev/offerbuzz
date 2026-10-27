import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import type { Types } from 'mongoose';
import { OTP, type AuthResponse, type SelfServeRole, type UserDTO } from '@offerbuzz/shared';
import { env } from '../../config/env';
import { User, type UserDoc } from '../../models/User';
import { Otp } from '../../models/Otp';
import { RefreshToken } from '../../models/RefreshToken';
import { signAccessToken } from '../../middleware/auth';
import { sendOtpEmail } from '../../services/brevo';
import { HttpError, badRequest, forbidden, tooMany, unauthorized } from '../../utils/errors';

const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
const hmac = (v: string) => crypto.createHmac('sha256', env().OTP_SECRET).update(v).digest('hex');

// 32 chars, no 0/O/1/I so codes survive being read aloud or typed from a QR flyer
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateReferralCode(): string {
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export function toUserDTO(u: UserDoc): UserDTO {
  return {
    id: String(u._id),
    name: u.name ?? undefined,
    phone: u.phone ?? undefined,
    email: u.email ?? undefined,
    role: u.role,
    status: u.status,
    referralCode: u.referralCode,
    qrUrl: u.qrUrl ?? undefined,
  };
}

async function issueTokens(userId: Types.ObjectId, role: UserDoc['role'], family: string = crypto.randomUUID()) {
  const refreshToken = crypto.randomBytes(48).toString('base64url');
  await RefreshToken.create({
    userId,
    family,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + env().REFRESH_TOKEN_TTL_DAYS * 86_400_000),
  });
  return {
    accessToken: signAccessToken({ id: String(userId), role }),
    refreshToken,
    expiresIn: 15 * 60,
  };
}

/** Creates a user, retrying on the (very unlikely) referral code collision. */
async function createUser(fields: Partial<UserDoc> & { role: SelfServeRole }) {
  for (let i = 0; i < 5; i++) {
    try {
      return await User.create({
        ...fields,
        referralCode: generateReferralCode(),
        // intermediaries wait for admin approval before the wallet activates
        status: fields.role === 'intermediary' ? 'pending' : 'active',
      });
    } catch (err) {
      if ((err as { code?: number; keyPattern?: Record<string, 1> }).code === 11000 &&
        (err as { keyPattern?: Record<string, 1> }).keyPattern?.referralCode) continue;
      throw err;
    }
  }
  throw new Error('Could not generate a unique referral code');
}

/**
 * Finds the user or registers one. A plain customer may upgrade to merchant or intermediary by
 * choosing that role on the login screen; any other existing role is never changed from here.
 */
async function findOrCreate(match: { email: string }, role: SelfServeRole, extra: Partial<UserDoc> = {}) {
  let user = await User.findOne(match);
  let isNewUser = false;
  if (!user) {
    user = await createUser({ ...match, ...extra, role });
    isNewUser = true;
  } else {
    if (user.status === 'blocked') throw forbidden('This account has been blocked', 'ACCOUNT_BLOCKED');
    if (user.role === 'admin') throw forbidden('Admins sign in from the admin login page', 'ADMIN_LOGIN_ONLY');
    if (user.role === 'customer' && role !== 'customer') {
      user.role = role;
      if (role === 'intermediary') user.status = 'pending';
      await user.save();
    }
  }
  return { user, isNewUser };
}

async function respond(user: UserDoc, isNewUser: boolean): Promise<AuthResponse> {
  const tokens = await issueTokens(user._id, user.role);
  return { ...tokens, user: toUserDTO(user), isNewUser };
}

// ---- OTP -------------------------------------------------------------------------------------

/**
 * Sign in only works for an existing account and sign up only for a new one, so people get a clear message
 * instead of silently creating a second account by mistyping. (This reveals whether an email is registered;
 * accepted for usability, and the OTP rate limits bound enumeration.) The one exception: a plain customer may
 * "sign up" again as vendor or intermediary, which upgrades the account.
 */
export async function sendOtp(identifier: string, mode: 'signin' | 'signup' = 'signin', role?: SelfServeRole) {
  const account = await User.findOne({ email: identifier }).select('role');
  if (mode === 'signin' && !account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'No account found with this email. Please sign up first.');
  }
  const upgrading = account?.role === 'customer' && role !== undefined && role !== 'customer';
  if (mode === 'signup' && account && !upgrading) {
    throw new HttpError(409, 'ACCOUNT_EXISTS', 'This email is already registered. Please sign in.');
  }
  const existing = await Otp.findOne({ identifier });
  const now = Date.now();
  if (existing) {
    const wait = OTP.resendSeconds * 1000 - (now - existing.sentAt.getTime());
    if (wait > 0) throw tooMany(`Please wait ${Math.ceil(wait / 1000)}s before requesting another code`);
  }
  const code = crypto.randomInt(0, 10 ** OTP.length).toString().padStart(OTP.length, '0');
  await Otp.findOneAndUpdate(
    { identifier },
    {
      codeHash: hmac(`${identifier}:${code}`),
      attempts: 0,
      sentAt: new Date(now),
      expiresAt: new Date(now + OTP.ttlMinutes * 60_000),
    },
    { upsert: true },
  );
  await sendOtpEmail(identifier, code);
  return { sent: true, resendIn: OTP.resendSeconds, ...(env().OTP_DEV_MODE ? { devOtp: code } : {}) };
}

export async function verifyOtp(input: {
  email: string;
  code: string;
  mode?: 'signin' | 'signup';
  role?: SelfServeRole;
  name?: string;
}) {
  const identifier = input.email;
  const record = await Otp.findOne({ identifier });
  if (!record || record.expiresAt.getTime() < Date.now()) throw badRequest('Code expired, request a new one', 'OTP_EXPIRED');
  if (record.attempts >= OTP.maxAttempts) {
    await record.deleteOne();
    throw tooMany('Too many wrong attempts, request a new code');
  }
  const expected = Buffer.from(record.codeHash);
  const given = Buffer.from(hmac(`${identifier}:${input.code}`));
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    await Otp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    throw badRequest('Incorrect code', 'OTP_INVALID');
  }
  await record.deleteOne(); // single use

  if (input.mode !== 'signup') {
    // sign in: never creates an account, never changes the role
    const user = await User.findOne({ email: input.email });
    if (!user) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'No account found with this email. Please sign up first.');
    if (user.status === 'blocked') throw forbidden('This account has been blocked', 'ACCOUNT_BLOCKED');
    if (user.role === 'admin') throw forbidden('Admins sign in from the admin login page', 'ADMIN_LOGIN_ONLY');
    return respond(user, false);
  }
  const { user, isNewUser } = await findOrCreate({ email: input.email }, input.role ?? 'customer', input.name ? { name: input.name } : {});
  return respond(user, isNewUser);
}

// ---- Google ----------------------------------------------------------------------------------

export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
}
type GoogleVerifier = (idToken: string) => Promise<GoogleProfile>;

const defaultVerifier: GoogleVerifier = async (idToken) => {
  const audience = env().GOOGLE_CLIENT_IDS.split(',').map((s) => s.trim()).filter(Boolean);
  if (!audience.length) throw badRequest('Google sign in is not configured', 'GOOGLE_NOT_CONFIGURED');
  const ticket = await new OAuth2Client().verifyIdToken({ idToken, audience });
  const p = ticket.getPayload();
  if (!p?.sub || !p.email || !p.email_verified) throw unauthorized('Google account email is not verified');
  return { sub: p.sub, email: p.email.toLowerCase(), name: p.name };
};
let verifyGoogle = defaultVerifier;
/** Test seam. */
export const setGoogleVerifier = (v: GoogleVerifier = defaultVerifier) => {
  verifyGoogle = v;
};

export async function googleLogin(idToken: string, role: SelfServeRole = 'customer') {
  let profile: GoogleProfile;
  try {
    profile = await verifyGoogle(idToken);
  } catch (err) {
    if (err instanceof Error && 'status' in err) throw err;
    throw unauthorized('Invalid Google token', 'GOOGLE_TOKEN_INVALID');
  }
  const byGoogle = await User.findOne({ googleId: profile.sub });
  if (byGoogle) {
    const { user, isNewUser } = await findOrCreate({ email: byGoogle.email as string }, role);
    return respond(user, isNewUser);
  }
  const { user, isNewUser } = await findOrCreate({ email: profile.email }, role, { name: profile.name });
  if (!user.googleId) {
    user.googleId = profile.sub;
    await user.save();
  }
  return respond(user, isNewUser);
}

// ---- Admin (password) ------------------------------------------------------------------------

export async function adminLogin(email: string, password: string) {
  const user = await User.findOne({ email, role: 'admin' }).select('+passwordHash');
  // compare against a dummy hash when the user is missing so timing does not reveal valid emails
  const hash = user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) throw unauthorized('Incorrect email or password', 'INVALID_CREDENTIALS');
  if (user.status !== 'active') throw forbidden('This account is disabled', 'ACCOUNT_BLOCKED');
  return respond(user, false);
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export { generateReferralCode };

// ---- Refresh / logout ------------------------------------------------------------------------

/** Rotating refresh tokens: each token is single use; replaying one revokes the whole session family. */
export async function refresh(token: string) {
  const record = await RefreshToken.findOne({ tokenHash: sha256(token) });
  if (!record || record.revokedAt || record.expiresAt.getTime() < Date.now()) {
    throw unauthorized('Session expired, please log in again', 'REFRESH_INVALID');
  }
  if (record.usedAt) {
    await RefreshToken.updateMany({ family: record.family }, { revokedAt: new Date() });
    throw unauthorized('Session expired, please log in again', 'REFRESH_REUSED');
  }
  // atomic claim so two parallel refreshes cannot both succeed
  const claimed = await RefreshToken.findOneAndUpdate({ _id: record._id, usedAt: { $exists: false } }, { usedAt: new Date() });
  if (!claimed) throw unauthorized('Session expired, please log in again', 'REFRESH_REUSED');

  const user = await User.findById(record.userId);
  if (!user || user.status === 'blocked') throw unauthorized('Account unavailable', 'REFRESH_INVALID');
  return issueTokens(user._id, user.role, record.family);
}

export async function logout(token: string) {
  const record = await RefreshToken.findOne({ tokenHash: sha256(token) });
  if (record) await RefreshToken.updateMany({ family: record.family }, { revokedAt: new Date() });
}

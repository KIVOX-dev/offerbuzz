import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let app: import('express').Express;
let svc: typeof import('../src/modules/auth/auth.service');
let User: typeof import('../src/models/User').User;
let Otp: typeof import('../src/models/Otp').Otp;

const EMAIL = 'shopper@example.com';
const NAME = 'Test Shopper';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongod.getUri('offerbuzz_test'),
    JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret',
    OTP_SECRET: 'test-otp-secret-test-otp-secret-123',
    OTP_DEV_MODE: 'true',
    // never let tests pick up real credentials from the developer's .env
    BREVO_API_KEY: '',
    DNS_SERVERS: '',
  });
  const { createApp } = await import('../src/app');
  svc = await import('../src/modules/auth/auth.service');
  User = (await import('../src/models/User')).User;
  Otp = (await import('../src/models/Otp')).Otp;
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await Promise.all([User.deleteMany({}), Otp.deleteMany({}), mongoose.connection.collection('offers').deleteMany({}), mongoose.connection.collection('walletentries').deleteMany({}), mongoose.connection.collection('subscriptions').deleteMany({}), mongoose.connection.collection('visits').deleteMany({}), mongoose.connection.collection('pagehits').deleteMany({}), mongoose.connection.collection('payoutrequests').deleteMany({}), mongoose.connection.collection('refreshtokens').deleteMany({})]);
  }
});

const send = (body: Record<string, unknown>) => request(app).post('/api/v1/auth/send-otp').send(body);
const verify = (body: Record<string, unknown>) => request(app).post('/api/v1/auth/verify-otp').send(body);

/** Full sign up: request a code, then verify it. `extra` is merged into both requests. */
async function signUp(extra: Record<string, unknown> = {}, email = EMAIL) {
  const sent = await send({ email, mode: 'signup', ...extra });
  expect(sent.status).toBe(200);
  return verify({ email, code: sent.body.devOtp, mode: 'signup', name: NAME, ...extra });
}

async function signIn(email = EMAIL) {
  const sent = await send({ email, mode: 'signin' });
  expect(sent.status).toBe(200);
  return verify({ email, code: sent.body.devOtp, mode: 'signin' });
}

describe('health', () => {
  it('GET /health returns 200 without needing the database', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('sign up', () => {
  it('creates a customer with name and email and returns tokens', async () => {
    const res = await signUp();
    expect(res.status).toBe(200);
    expect(res.body.isNewUser).toBe(true);
    expect(res.body.user).toMatchObject({ role: 'customer', email: EMAIL, name: NAME, status: 'active' });
    expect(res.body.user.referralCode).toMatch(/^[A-Z2-9]{8}$/);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('requires a name', async () => {
    const sent = await send({ email: EMAIL, mode: 'signup' });
    const res = await verify({ email: EMAIL, code: sent.body.devOtp, mode: 'signup' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Enter your name');
    expect(await User.countDocuments()).toBe(0);
  });

  it('creates intermediaries as pending until the admin approves', async () => {
    const res = await signUp({ role: 'intermediary' });
    expect(res.body.user).toMatchObject({ role: 'intermediary', status: 'pending' });
  });

  it('never lets a caller self-assign admin', async () => {
    const res = await send({ email: EMAIL, mode: 'signup', role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('refuses an email that is already registered and points to sign in', async () => {
    await signUp();
    await Otp.deleteMany({});
    const again = await send({ email: EMAIL, mode: 'signup' });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('ACCOUNT_EXISTS');
  });

  it('lets a customer sign up again as merchant (upgrade), but never downgrades a merchant', async () => {
    await signUp();
    await Otp.deleteMany({});
    const up = await signUp({ role: 'merchant' });
    expect(up.status).toBe(200);
    expect(up.body.user.role).toBe('merchant');
    expect(up.body.isNewUser).toBe(false);
    await Otp.deleteMany({});
    // a merchant cannot sign up again as customer or anything else
    expect((await send({ email: EMAIL, mode: 'signup', role: 'customer' })).status).toBe(409);
    expect((await send({ email: EMAIL, mode: 'signup', role: 'intermediary' })).status).toBe(409);
    const back = await signIn();
    expect(back.body.user.role).toBe('merchant');
  });

  it('normalizes the email to lower case', async () => {
    const res = await signUp({}, 'Shop@Example.com');
    expect(res.body.user.email).toBe('shop@example.com');
  });
});

describe('sign in', () => {
  it('works for an existing account and does not create anything', async () => {
    await signUp();
    await Otp.deleteMany({});
    const res = await signIn();
    expect(res.status).toBe(200);
    expect(res.body.isNewUser).toBe(false);
    expect(await User.countDocuments()).toBe(1);
  });

  it('is the default mode when none is sent', async () => {
    const res = await send({ email: 'nobody@example.com' });
    expect(res.status).toBe(404);
  });

  it('tells an unknown email to sign up first, and creates nothing', async () => {
    const res = await send({ email: 'nobody@example.com', mode: 'signin' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ACCOUNT_NOT_FOUND');
    expect(await User.countDocuments()).toBe(0);
  });

  it('cannot be used to create an account by skipping send-otp mode', async () => {
    const sent = await send({ email: 'ghost@example.com', mode: 'signup' });
    const res = await verify({ email: 'ghost@example.com', code: sent.body.devOtp, mode: 'signin' });
    expect(res.status).toBe(404);
    expect(await User.countDocuments()).toBe(0);
  });

  it('blocks blocked accounts', async () => {
    await signUp();
    await User.updateMany({}, { status: 'blocked' });
    await Otp.deleteMany({});
    const sent = await send({ email: EMAIL, mode: 'signin' });
    const res = await verify({ email: EMAIL, code: sent.body.devOtp, mode: 'signin' });
    expect(res.status).toBe(403);
  });

  it('admins cannot use the OTP flow', async () => {
    await User.create({ email: EMAIL, role: 'admin', referralCode: svc.generateReferralCode() });
    const sent = await send({ email: EMAIL, mode: 'signin' });
    const res = await verify({ email: EMAIL, code: sent.body.devOtp, mode: 'signin' });
    expect(res.status).toBe(403);
  });
});

describe('one time codes', () => {
  it('rejects a wrong code, counts attempts, and burns the code after use', async () => {
    const sent = await send({ email: EMAIL, mode: 'signup' });
    const wrong = sent.body.devOtp === '000000' ? '111111' : '000000';
    const bad = await verify({ email: EMAIL, code: wrong, mode: 'signup', name: NAME });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('OTP_INVALID');
    const ok = await verify({ email: EMAIL, code: sent.body.devOtp, mode: 'signup', name: NAME });
    expect(ok.status).toBe(200);
    const replay = await verify({ email: EMAIL, code: sent.body.devOtp, mode: 'signup', name: NAME });
    expect(replay.status).toBe(400);
  });

  it('locks the code after too many wrong attempts', async () => {
    const sent = await send({ email: EMAIL, mode: 'signup' });
    const wrong = sent.body.devOtp === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) await verify({ email: EMAIL, code: wrong, mode: 'signup', name: NAME });
    const res = await verify({ email: EMAIL, code: sent.body.devOtp, mode: 'signup', name: NAME });
    expect(res.status).toBe(429);
  });

  it('throttles resending a code', async () => {
    await send({ email: EMAIL, mode: 'signup' });
    const again = await send({ email: EMAIL, mode: 'signup' });
    expect(again.status).toBe(429);
  });

  it('validates input', async () => {
    const bad = await send({ email: 'not-an-email', mode: 'signup' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
    expect((await send({ phone: '9876543210' })).status).toBe(400); // phone login is gone
    expect((await send({ email: EMAIL, mode: 'nope' })).status).toBe(400);
  });
});

describe('refresh tokens', () => {
  it('rotates, and replaying an old token revokes the whole session', async () => {
    const login = await signUp();
    const r1 = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken });
    expect(r1.status).toBe(200);
    expect(r1.body.refreshToken).not.toBe(login.body.refreshToken);

    const replay = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken });
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('REFRESH_REUSED');

    const afterRevoke = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: r1.body.refreshToken });
    expect(afterRevoke.status).toBe(401);
  });

  it('logout revokes the session', async () => {
    const login = await signUp();
    const out = await request(app).post('/api/v1/auth/logout').send({ refreshToken: login.body.refreshToken });
    expect(out.status).toBe(204);
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('role based access', () => {
  it('GET /me requires a token and returns the user', async () => {
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
    const login = await signUp();
    const me = await request(app).get('/api/v1/me').set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(EMAIL);
  });

  it('requireRole lets the right role in and keeps others out', async () => {
    const { Router } = await import('express');
    const { authenticate, requireRole } = await import('../src/middleware/auth');
    const r = Router();
    r.get('/admin-only', authenticate, requireRole('admin'), (_q, s) => void s.json({ ok: true }));
    const { default: express } = await import('express');
    const { errorHandler } = await import('../src/middleware/errorHandler');
    const mini = express().use(r).use(errorHandler);

    const customer = await signUp();
    const denied = await request(mini).get('/admin-only').set('Authorization', `Bearer ${customer.body.accessToken}`);
    expect(denied.status).toBe(403);

    await User.create({
      email: 'admin@offerbuzz.co',
      role: 'admin',
      referralCode: svc.generateReferralCode(),
      passwordHash: await svc.hashPassword('a-long-admin-password'),
    });
    const admin = await request(app).post('/api/v1/auth/admin/login').send({ email: 'admin@offerbuzz.co', password: 'a-long-admin-password' });
    expect(admin.status).toBe(200);
    const allowed = await request(mini).get('/admin-only').set('Authorization', `Bearer ${admin.body.accessToken}`);
    expect(allowed.status).toBe(200);
  });
});

describe('admin login', () => {
  it('rejects wrong passwords and non-admin emails with the same error', async () => {
    await User.create({
      email: 'admin@offerbuzz.co',
      role: 'admin',
      referralCode: svc.generateReferralCode(),
      passwordHash: await svc.hashPassword('a-long-admin-password'),
    });
    const wrong = await request(app).post('/api/v1/auth/admin/login').send({ email: 'admin@offerbuzz.co', password: 'not-the-password' });
    const missing = await request(app).post('/api/v1/auth/admin/login').send({ email: 'nobody@offerbuzz.co', password: 'not-the-password' });
    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(wrong.body.error.message).toBe(missing.body.error.message);
  });
});

describe('google sign in', () => {
  it('creates a user from a verified token and links googleId', async () => {
    svc.setGoogleVerifier(async () => ({ sub: 'g-123', email: 'Owner@Gmail.com', name: 'Owner' }));
    const res = await request(app).post('/api/v1/auth/google').send({ idToken: 'x'.repeat(20), role: 'merchant' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'owner@gmail.com', role: 'merchant', name: 'Owner' });
    const again = await request(app).post('/api/v1/auth/google').send({ idToken: 'x'.repeat(20) });
    expect(again.body.isNewUser).toBe(false);
    expect(await User.countDocuments()).toBe(1);
  });

  it('rejects an invalid token', async () => {
    svc.setGoogleVerifier(async () => {
      throw new Error('bad token');
    });
    const res = await request(app).post('/api/v1/auth/google').send({ idToken: 'x'.repeat(20) });
    expect(res.status).toBe(401);
    svc.setGoogleVerifier();
  });
});

describe('password', () => {
  const PW = 'Sunshine123';
  const setPw = (token: string, password: string) =>
    request(app).post('/api/v1/auth/set-password').set('authorization', `Bearer ${token}`).send({ password });
  const login = (email: string, password: string) => request(app).post('/api/v1/auth/login').send({ email, password });

  it('sign up returns hasPassword false until a password is set, then email + password signs in', async () => {
    const res = await signUp({ role: 'merchant' });
    expect(res.body.user.hasPassword).toBe(false);
    expect((await setPw(res.body.accessToken, PW)).status).toBe(204);

    const ok = await login(EMAIL, PW);
    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe('merchant');
    expect(ok.body.user.hasPassword).toBe(true);
    expect(ok.body.accessToken).toBeTruthy();
    // the hash is never exposed
    expect(JSON.stringify(ok.body)).not.toContain('$2');
  });

  it('rejects weak passwords and requires a token to set one', async () => {
    const res = await signUp({ role: 'merchant' });
    expect((await setPw(res.body.accessToken, 'short1')).status).toBe(400);
    expect((await setPw(res.body.accessToken, 'onlyletters')).status).toBe(400);
    expect((await setPw(res.body.accessToken, '123456789')).status).toBe(400);
    const noToken = await request(app).post('/api/v1/auth/set-password').send({ password: PW });
    expect(noToken.status).toBe(401);
  });

  it('a wrong password or an account without one is INVALID_CREDENTIALS; an unknown email must sign up', async () => {
    const res = await signUp({ role: 'merchant' });
    const noPassword = await login(EMAIL, PW);
    await setPw(res.body.accessToken, PW);
    const wrong = await login(EMAIL, 'Wrong12345');
    for (const r of [noPassword, wrong]) {
      expect(r.status).toBe(401);
      expect(r.body.error.code).toBe('INVALID_CREDENTIALS');
    }
    const unknown = await login('nobody@example.com', PW);
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe('ACCOUNT_NOT_FOUND');
    expect(await User.countDocuments({ email: 'nobody@example.com' })).toBe(0);
  });

  it('forgot password: a code sign in can set a new password, and the old one stops working', async () => {
    const first = await signUp({ role: 'merchant' });
    await setPw(first.body.accessToken, PW);
    const viaCode = await signIn();
    expect((await setPw(viaCode.body.accessToken, 'Newpass456')).status).toBe(204);
    expect((await login(EMAIL, PW)).status).toBe(401);
    expect((await login(EMAIL, 'Newpass456')).status).toBe(200);
  });

  it('changing the password signs out the other sessions', async () => {
    const first = await signUp({ role: 'merchant' });
    await setPw(first.body.accessToken, PW);
    const old = await login(EMAIL, PW);
    await setPw(first.body.accessToken, 'Newpass456');
    const replay = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: old.body.refreshToken });
    expect(replay.status).toBe(401);
  });

  it('blocked accounts cannot sign in with a password, and admins are refused here', async () => {
    const res = await signUp({ role: 'merchant' });
    await setPw(res.body.accessToken, PW);
    await User.updateOne({ email: EMAIL }, { status: 'blocked' });
    expect((await login(EMAIL, PW)).body.error.code).toBe('ACCOUNT_BLOCKED');

    await User.create({
      email: 'boss@example.com', role: 'admin', status: 'active', referralCode: 'ADMINREF',
      passwordHash: await svc.hashPassword('Adminpass123'),
    });
    const admin = await login('boss@example.com', 'Adminpass123');
    expect(admin.status).toBe(403);
    expect(admin.body.error.code).toBe('ADMIN_LOGIN_ONLY');
  });
});

describe('vendor offers and profile', () => {
  const OFFER = {
    title: 'Flat 30% off',
    description: 'Thirty percent off on all services this month.',
    category: 'Salon and Spa',
    discountType: 'percent',
    discountValue: 30,
    startsAt: '2026-11-01',
    endsAt: '2026-11-30',
    area: 'RS Puram, Coimbatore',
  };
  const authed = (r: request.Test, token: string) => r.set('authorization', `Bearer ${token}`);
  const post = (token: string, body: Record<string, unknown>) => authed(request(app).post('/api/v1/offers'), token).send(body);

  it('a vendor posts an offer (pending) and sees it with zeroed insights', async () => {
    const v = await signUp({ role: 'merchant' });
    const created = await post(v.body.accessToken, OFFER);
    expect(created.status).toBe(201);
    expect(created.body.offer).toMatchObject({ title: 'Flat 30% off', status: 'pending', views: 0, claims: 0, endsAt: '2026-11-30' });

    const mine = await authed(request(app).get('/api/v1/offers/mine'), v.body.accessToken);
    expect(mine.status).toBe(200);
    expect(mine.body.offers).toHaveLength(1);
    expect(mine.body.totals).toEqual({ offers: 1, pending: 1, active: 0, views: 0, claims: 0 });
  });

  it('validates the offer form', async () => {
    const v = await signUp({ role: 'merchant' });
    const t = v.body.accessToken;
    expect((await post(t, { ...OFFER, title: 'ab' })).status).toBe(400);
    expect((await post(t, { ...OFFER, category: 'Nonsense' })).status).toBe(400);
    expect((await post(t, { ...OFFER, discountValue: undefined })).status).toBe(400);
    expect((await post(t, { ...OFFER, discountValue: 100 })).status).toBe(400);
    expect((await post(t, { ...OFFER, endsAt: '2026-10-01' })).status).toBe(400);
    // a free text deal needs no number
    expect((await post(t, { ...OFFER, discountType: 'deal', discountValue: undefined, title: 'Buy 1 Get 1' })).status).toBe(201);
  });

  it('only vendors can post, and vendors only ever see and delete their own offers', async () => {
    const a = await signUp({ role: 'merchant' }, 'a@example.com');
    const b = await signUp({ role: 'merchant' }, 'b@example.com');
    const customer = await signUp({ role: 'customer' }, 'c@example.com');
    expect((await post(customer.body.accessToken, OFFER)).status).toBe(403);
    expect((await request(app).post('/api/v1/offers').send(OFFER)).status).toBe(401);

    const offer = (await post(a.body.accessToken, OFFER)).body.offer;
    const bList = await authed(request(app).get('/api/v1/offers/mine'), b.body.accessToken);
    expect(bList.body.offers).toHaveLength(0);
    expect((await authed(request(app).delete(`/api/v1/offers/${offer.id}`), b.body.accessToken)).status).toBe(404);
    expect((await authed(request(app).delete(`/api/v1/offers/${offer.id}`), a.body.accessToken)).status).toBe(204);
  });

  it('an approved offer past its end date reads as expired', async () => {
    const v = await signUp({ role: 'merchant' });
    const offer = (await post(v.body.accessToken, { ...OFFER, startsAt: '2020-01-01', endsAt: '2020-01-31' })).body.offer;
    const Offer = (await import('../src/models/Offer')).Offer;
    await Offer.updateOne({ _id: offer.id }, { status: 'active' });
    const mine = await authed(request(app).get('/api/v1/offers/mine'), v.body.accessToken);
    expect(mine.body.offers[0].status).toBe('expired');
    expect(mine.body.totals.active).toBe(0);
  });

  it('PUT /me updates the profile, never the email or role, and guards phone numbers', async () => {
    const a = await signUp({ role: 'merchant' }, 'a@example.com');
    const b = await signUp({ role: 'merchant' }, 'b@example.com');
    const put = (token: string, body: Record<string, unknown>) => authed(request(app).put('/api/v1/me'), token).send(body);

    const ok = await put(a.body.accessToken, { name: 'New Name', shopName: 'Glow Salon', city: 'Coimbatore', phone: '98765 43210', email: 'hacker@x.com', role: 'admin' });
    expect(ok.status).toBe(200);
    expect(ok.body.user).toMatchObject({ name: 'New Name', shopName: 'Glow Salon', city: 'Coimbatore', phone: '+919876543210', email: 'a@example.com', role: 'merchant' });

    const clash = await put(b.body.accessToken, { phone: '9876543210' });
    expect(clash.status).toBe(409);
    expect((await put(a.body.accessToken, { phone: '12345' })).status).toBe(400);
    expect((await put(a.body.accessToken, { shopName: '' })).body.user.shopName).toBeUndefined();
    expect((await request(app).put('/api/v1/me').send({ name: 'x y' })).status).toBe(401);
  });
});

describe('referrals and intermediary wallet', () => {
  const authed = (r: request.Test, token: string) => r.set('authorization', `Bearer ${token}`);
  const wallet = (token: string) => authed(request(app).get('/api/v1/wallet'), token);

  async function referrer() {
    const res = await signUp({ role: 'intermediary' }, 'agent@example.com');
    return { token: res.body.accessToken as string, code: res.body.user.referralCode as string, id: res.body.user.id as string };
  }
  const vendorVia = (code: string | undefined, email = 'shop@example.com') =>
    signUp(code ? { role: 'merchant', referralCode: code } : { role: 'merchant' }, email);

  it('a vendor who signs up with a code is linked to that intermediary', async () => {
    const agent = await referrer();
    const v = await vendorVia(agent.code);
    expect(v.status).toBe(200);
    const doc = await User.findById(v.body.user.id);
    expect(String(doc?.referredBy)).toBe(agent.id);
  });

  it('accepts the code in lower case, and ignores unknown codes, customer codes and non-vendor signups', async () => {
    const agent = await referrer();
    const lower = await vendorVia(agent.code.toLowerCase(), 'a@example.com');
    expect(String((await User.findById(lower.body.user.id))?.referredBy)).toBe(agent.id);

    const unknown = await vendorVia('ZZZZZZZZ', 'b@example.com');
    expect(unknown.status).toBe(200);
    expect((await User.findById(unknown.body.user.id))?.referredBy).toBeUndefined();

    const cust = await signUp({ role: 'customer' }, 'cust@example.com');
    const viaCustomerCode = await vendorVia(cust.body.user.referralCode, 'c@example.com');
    expect((await User.findById(viaCustomerCode.body.user.id))?.referredBy).toBeUndefined();

    const customerSignup = await signUp({ role: 'customer', referralCode: agent.code }, 'd@example.com');
    expect((await User.findById(customerSignup.body.user.id))?.referredBy).toBeUndefined();
  });

  it('rejects a malformed code at the door', async () => {
    const bad = await signUp({ role: 'merchant', referralCode: 'not-a-code' }, 'e@example.com');
    expect(bad.status).toBe(400);
  });

  it('GET /referral/:code tells the signup form who referred the vendor (first name only)', async () => {
    const agent = await referrer();
    const ok = await request(app).get(`/api/v1/referral/${agent.code}`);
    expect(ok.body).toEqual({ valid: true, name: 'Test' });
    expect((await request(app).get('/api/v1/referral/ZZZZZZZZ')).body).toEqual({ valid: false });
    expect((await request(app).get('/api/v1/referral/bad')).body).toEqual({ valid: false });
  });

  it('a paid subscription credits the referrer once per month, held for the hold period', async () => {
    const agent = await referrer();
    const v = await vendorVia(agent.code);
    const credit = await svc2().creditReferrerForSubscription(v.body.user.id, '2026-11');
    expect(credit).toMatchObject({ credits: 30, reason: 'subscription', kind: 'credit' });
    // the same payment delivered twice changes nothing
    expect(await svc2().creditReferrerForSubscription(v.body.user.id, '2026-11')).toBeNull();
    // a later month is a new commission
    expect(await svc2().creditReferrerForSubscription(v.body.user.id, '2026-12')).not.toBeNull();

    const w = await wallet(agent.token);
    expect(w.status).toBe(200);
    expect(w.body).toMatchObject({ balance: 60, available: 0, onHold: 60, totalEarned: 60, payoutThreshold: 100, holdDays: 365 });
    expect(w.body.entries).toHaveLength(2);
    expect(w.body.shops).toHaveLength(1);
  });

  it('credits past the hold period become available; payouts reduce what is available', async () => {
    const agent = await referrer();
    const v = await vendorVia(agent.code);
    await svc2().creditReferrerForSubscription(v.body.user.id, '2025-01');
    const WalletEntry = (await import('../src/models/WalletEntry')).WalletEntry;
    await WalletEntry.updateOne({ period: '2025-01' }, { availableAt: new Date(Date.now() - 1000) });
    await svc2().creditReferrerForSubscription(v.body.user.id, '2026-11');

    let w = (await wallet(agent.token)).body;
    expect(w).toMatchObject({ balance: 60, available: 30, onHold: 30 });

    await WalletEntry.create({ intermediaryId: agent.id, kind: 'debit', reason: 'payout', credits: 10, availableAt: new Date() });
    w = (await wallet(agent.token)).body;
    expect(w).toMatchObject({ balance: 50, available: 20, onHold: 30, totalEarned: 60 });
  });

  it('a vendor with no referrer earns nobody anything, and only intermediaries can open a wallet', async () => {
    const v = await vendorVia(undefined);
    expect(await svc2().creditReferrerForSubscription(v.body.user.id, '2026-11')).toBeNull();
    expect((await wallet(v.body.accessToken)).status).toBe(403);
    expect((await request(app).get('/api/v1/wallet')).status).toBe(401);
  });
});

const svc2 = () => walletSvc;
let walletSvc: typeof import('../src/modules/wallet/wallet.service');
beforeAll(async () => {
  walletSvc = await import('../src/modules/wallet/wallet.service');
});

describe('admin area', () => {
  const ADMIN = { email: 'boss@example.com', password: 'Adminpass123' };
  const authed = (r: request.Test, token: string) => r.set('authorization', `Bearer ${token}`);
  const OFFER = {
    title: 'Flat 30% off',
    description: 'Thirty percent off on all services this month.',
    category: 'Salon and Spa',
    discountType: 'percent',
    discountValue: 30,
    startsAt: '2020-01-01',
    endsAt: '2099-12-31',
    area: 'RS Puram, Coimbatore',
  };

  async function adminToken() {
    await User.create({
      email: ADMIN.email, role: 'admin', status: 'active', referralCode: 'ADMINREF',
      passwordHash: await svc.hashPassword(ADMIN.password),
    });
    const res = await request(app).post('/api/v1/auth/admin/login').send(ADMIN);
    return res.body.accessToken as string;
  }
  const get = (t: string, url: string) => authed(request(app).get(`/api/v1${url}`), t);
  const send2 = (t: string, method: 'post' | 'patch', url: string, body: Record<string, unknown> = {}) =>
    authed(request(app)[method](`/api/v1${url}`), t).send(body);

  /** An approved intermediary and a vendor they referred. */
  async function agentAndVendor() {
    const agent = await signUp({ role: 'intermediary' }, 'agent@example.com');
    await User.updateOne({ _id: agent.body.user.id }, { status: 'active' });
    const vendor = await signUp({ role: 'merchant', referralCode: agent.body.user.referralCode }, 'shop@example.com');
    return { agent: agent.body, vendor: vendor.body };
  }

  it('only an admin can use /admin routes', async () => {
    const vendor = await signUp({ role: 'merchant' });
    expect((await request(app).get('/api/v1/admin/overview')).status).toBe(401);
    expect((await get(vendor.body.accessToken, '/admin/overview')).status).toBe(403);
    expect((await get(await adminToken(), '/admin/overview')).status).toBe(200);
  });

  it('counts vendors that have paid, after the admin records a payment', async () => {
    const t = await adminToken();
    const { agent, vendor } = await agentAndVendor();
    await signUp({ role: 'merchant' }, 'solo@example.com');

    let o = (await get(t, '/admin/overview')).body;
    expect(o.vendors).toEqual({ total: 2, subscribed: 0, unsubscribed: 2 });

    const paid = await send2(t, 'post', `/admin/vendors/${vendor.user.id}/payment`, { months: 2 });
    expect(paid.status).toBe(200);
    expect(paid.body.referrerCredited).toBe(true);
    o = (await get(t, '/admin/overview')).body;
    expect(o.vendors).toEqual({ total: 2, subscribed: 1, unsubscribed: 1 });

    // two months paid = two commissions of 30 for the intermediary
    const wallet = await authed(request(app).get('/api/v1/wallet'), agent.accessToken);
    expect(wallet.body.balance).toBe(60);
    // paying again extends the plan and credits the following months, never the same month twice
    await send2(t, 'post', `/admin/vendors/${vendor.user.id}/payment`, { months: 1 });
    expect((await authed(request(app).get('/api/v1/wallet'), agent.accessToken)).body.balance).toBe(90);

    expect((await send2(t, 'post', `/admin/vendors/${agent.user.id}/payment`, {})).status).toBe(400);
  });

  it('lists users with filters, search and subscription state', async () => {
    const t = await adminToken();
    const { vendor } = await agentAndVendor();
    await send2(t, 'post', `/admin/vendors/${vendor.user.id}/payment`, { months: 1 });

    const vendors = (await get(t, '/admin/users?role=merchant')).body;
    expect(vendors.total).toBe(1);
    expect(vendors.users[0]).toMatchObject({ email: 'shop@example.com', subscribed: true });
    expect(vendors.users[0].referredBy).toBe('Test Shopper');
    expect((await get(t, '/admin/users?q=agent')).body.users).toHaveLength(1);
    expect((await get(t, '/admin/users?role=bogus')).status).toBe(400);
  });

  it('approves an intermediary, blocks a user (and signs them out), but never admins or yourself', async () => {
    const t = await adminToken();
    const pending = await signUp({ role: 'intermediary' }, 'new@example.com');
    expect(pending.body.user.status).toBe('pending');
    expect((await send2(t, 'patch', `/admin/users/${pending.body.user.id}/status`, { status: 'active' })).status).toBe(200);
    expect((await User.findById(pending.body.user.id))?.status).toBe('active');

    await send2(t, 'patch', `/admin/users/${pending.body.user.id}/status`, { status: 'blocked' });
    const refresh = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: pending.body.refreshToken });
    expect(refresh.status).toBe(401);

    const adminDoc = await User.findOne({ email: ADMIN.email });
    expect((await send2(t, 'patch', `/admin/users/${adminDoc!.id}/status`, { status: 'blocked' })).status).toBe(403);
    expect((await send2(t, 'patch', `/admin/users/${pending.body.user.id}/status`, { status: 'weird' })).status).toBe(400);
  });

  it('payout flow: needs 100 available, one request at a time, admin pays and the wallet is debited', async () => {
    const t = await adminToken();
    const { agent, vendor } = await agentAndVendor();
    const WalletEntry = (await import('../src/models/WalletEntry')).WalletEntry;
    const request1 = () => authed(request(app).post('/api/v1/wallet/payout-request'), agent.accessToken).send({});

    // nothing earned yet
    expect((await request1()).body.error.code).toBe('PAYOUT_MINIMUM');

    // 4 commissions of 30 = 120, released from the hold period
    for (const period of ['2025-01', '2025-02', '2025-03', '2025-04']) {
      await walletSvc.creditReferrerForSubscription(vendor.user.id, period);
    }
    await WalletEntry.updateMany({}, { availableAt: new Date(Date.now() - 1000) });
    const ok = await request1();
    expect(ok.status).toBe(201);
    expect(ok.body.credits).toBe(120);
    expect((await request1()).status).toBe(409);

    const w = await authed(request(app).get('/api/v1/wallet'), agent.accessToken);
    expect(w.body).toMatchObject({ available: 120, requested: 120, requestable: 0 });

    const wallets = (await get(t, '/admin/wallets')).body;
    expect(wallets.payoutThreshold).toBe(100);
    expect(wallets.wallets[0]).toMatchObject({ balance: 120, available: 120, requested: 120, shops: 1 });
    expect(wallets.payouts[0]).toMatchObject({ credits: 120, status: 'pending' });

    const paid = await send2(t, 'post', `/admin/payouts/${ok.body.id}/pay`);
    expect(paid.status).toBe(204);
    expect((await send2(t, 'post', `/admin/payouts/${ok.body.id}/pay`)).status).toBe(409);
    const after = (await authed(request(app).get('/api/v1/wallet'), agent.accessToken)).body;
    expect(after).toMatchObject({ balance: 0, available: 0, requested: 0, totalEarned: 120 });
  });

  it('rejecting a payout leaves the credits in the wallet, and pending intermediaries cannot request', async () => {
    const t = await adminToken();
    const { agent, vendor } = await agentAndVendor();
    const WalletEntry = (await import('../src/models/WalletEntry')).WalletEntry;
    for (const period of ['2025-01', '2025-02', '2025-03', '2025-04']) await walletSvc.creditReferrerForSubscription(vendor.user.id, period);
    await WalletEntry.updateMany({}, { availableAt: new Date(Date.now() - 1000) });
    const req = await authed(request(app).post('/api/v1/wallet/payout-request'), agent.accessToken).send({});
    const rej = await send2(t, 'post', `/admin/payouts/${req.body.id}/reject`, { note: 'Bank details missing' });
    expect(rej.status).toBe(204);
    const w = (await authed(request(app).get('/api/v1/wallet'), agent.accessToken)).body;
    expect(w).toMatchObject({ balance: 120, available: 120, requested: 0, requestable: 120 });

    await User.updateOne({ _id: agent.user.id }, { status: 'pending' });
    const again = await authed(request(app).post('/api/v1/wallet/payout-request'), agent.accessToken).send({});
    expect(again.status).toBe(403);
  });

  it('shows running offers by category, and only approved offers inside their dates run', async () => {
    const t = await adminToken();
    const vendor = await signUp({ role: 'merchant' }, 'v@example.com');
    const post = (body: Record<string, unknown>) =>
      authed(request(app).post('/api/v1/offers'), vendor.body.accessToken).send(body);
    const salon = (await post(OFFER)).body.offer;
    const fashion = (await post({ ...OFFER, category: 'Fashion', title: 'Fashion sale' })).body.offer;
    const future = (await post({ ...OFFER, category: 'Fashion', title: 'Later', startsAt: '2098-01-01' })).body.offer;
    const old = (await post({ ...OFFER, category: 'Jewellery', title: 'Old', endsAt: '2020-02-01' })).body.offer;

    // nothing runs until it is approved
    let res = (await get(t, '/admin/offers')).body;
    expect(res.offers).toHaveLength(0);
    expect(res.categories.find((c: { category: string }) => c.category === 'Fashion')).toMatchObject({ running: 0, pending: 2 });
    expect((await get(t, '/admin/offers?view=pending')).body.offers).toHaveLength(4);

    for (const o of [salon, fashion, future, old]) {
      expect((await send2(t, 'patch', `/admin/offers/${o.id}/status`, { status: 'active' })).status).toBe(200);
    }
    res = (await get(t, '/admin/offers')).body;
    expect(res.offers.map((o: { title: string }) => o.title).sort()).toEqual(['Fashion sale', 'Flat 30% off']);
    expect(res.offers[0].vendor).toBeTruthy();
    expect(res.categories[0]).toMatchObject({ running: 1 });
    expect(res.categories.find((c: { category: string }) => c.category === 'Fashion')).toMatchObject({ running: 1, pending: 0 });

    expect((await get(t, '/admin/offers?category=Fashion')).body.offers).toHaveLength(1);
    expect((await get(t, '/admin/offers?category=Nope')).status).toBe(400);

    await send2(t, 'patch', `/admin/offers/${salon.id}/status`, { status: 'rejected' });
    expect((await get(t, '/admin/offers')).body.offers).toHaveLength(1);
    expect((await get(t, '/admin/overview')).body.pendingOffers).toBe(0);
    expect((await send2(t, 'patch', `/admin/offers/${salon.id}/status`, { status: 'expired' })).status).toBe(400);
  });
});

describe('site analytics', () => {
  const VID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const track = (body: Record<string, unknown>, ua = 'Mozilla/5.0 (Windows NT 10.0) Chrome/120') =>
    request(app).post('/api/v1/track').set('user-agent', ua).send(body);

  async function admin() {
    await User.create({ email: 'boss@example.com', role: 'admin', status: 'active', referralCode: 'ADMINREF', passwordHash: await svc.hashPassword('Adminpass123') });
    return (await request(app).post('/api/v1/auth/admin/login').send({ email: 'boss@example.com', password: 'Adminpass123' })).body.accessToken as string;
  }
  const analytics = (t: string) => request(app).get('/api/v1/admin/analytics').set('authorization', `Bearer ${t}`);

  it('counts unique visitors once a day, and page views every time', async () => {
    const t = await admin();
    expect((await track({ visitorId: VID, path: '/' })).status).toBe(204);
    await track({ visitorId: VID, path: '/login' });
    await track({ visitorId: 'zzzzzzzz-1111-2222-3333-444444444444', path: '/' });

    const a = (await analytics(t)).body;
    expect(a.visitors.today).toBe(2);
    expect(a.pageViews.today).toBe(3);
    expect(a.visitors.last7).toBe(2);
    expect(a.series).toHaveLength(14);
    expect(a.series[13]).toMatchObject({ visitors: 2, views: 3 });
    expect(a.topPages[0]).toEqual({ path: '/', views: 2 });
  });

  it('ignores bots, bad ids, private paths and Do Not Track, and always answers 204', async () => {
    const t = await admin();
    expect((await track({ visitorId: VID, path: '/' }, 'Googlebot/2.1')).status).toBe(204);
    expect((await track({ visitorId: 'short', path: '/' })).status).toBe(204);
    expect((await track({ visitorId: VID, path: '/admin/users' })).status).toBe(204);
    expect((await track({ visitorId: VID, path: '/api/v1/me' })).status).toBe(204);
    expect((await track({ visitorId: VID, path: 'no-slash' })).status).toBe(204);
    expect((await request(app).post('/api/v1/track').set('dnt', '1').send({ visitorId: VID, path: '/' })).status).toBe(204);
    expect((await request(app).post('/api/v1/track').send({})).status).toBe(204);
    expect((await analytics(t)).body.pageViews.today).toBe(0);
  });

  it('strips query strings so a page is counted as one page', async () => {
    const t = await admin();
    await track({ visitorId: VID, path: '/login?role=merchant&ref=ABCD2345' });
    await track({ visitorId: VID, path: '/login/' });
    expect((await analytics(t)).body.topPages).toEqual([{ path: '/login', views: 2 }]);
  });

  it('counts new sign ups, and only admins can read the numbers', async () => {
    const t = await admin();
    await signUp({ role: 'customer' }, 'new1@example.com');
    await signUp({ role: 'merchant' }, 'new2@example.com');
    const a = (await analytics(t)).body;
    expect(a.newUsers.today).toBe(3); // the two sign ups plus the admin account made just now
    const vendor = await signUp({ role: 'merchant' }, 'new3@example.com');
    expect((await analytics(vendor.body.accessToken)).status).toBe(403);
    expect((await request(app).get('/api/v1/admin/analytics')).status).toBe(401);
  });
});

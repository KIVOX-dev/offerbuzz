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
    await Promise.all([User.deleteMany({}), Otp.deleteMany({}), mongoose.connection.collection('refreshtokens').deleteMany({})]);
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

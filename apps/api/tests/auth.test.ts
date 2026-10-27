import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let app: import('express').Express;
let svc: typeof import('../src/modules/auth/auth.service');
let User: typeof import('../src/models/User').User;
let Otp: typeof import('../src/models/Otp').Otp;

const PHONE = '9876543210';
const E164 = '+919876543210';

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

async function loginWithOtp(body: Record<string, unknown> = {}) {
  const sent = await request(app).post('/api/v1/auth/send-otp').send({ phone: PHONE });
  expect(sent.status).toBe(200);
  return request(app)
    .post('/api/v1/auth/verify-otp')
    .send({ phone: PHONE, code: sent.body.devOtp, ...body });
}

describe('health', () => {
  it('GET /health returns 200 without needing the database', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('phone OTP login', () => {
  it('registers a new customer by default and returns tokens', async () => {
    const res = await loginWithOtp();
    expect(res.status).toBe(200);
    expect(res.body.isNewUser).toBe(true);
    expect(res.body.user).toMatchObject({ role: 'customer', phone: E164, status: 'active' });
    expect(res.body.user.referralCode).toMatch(/^[A-Z2-9]{8}$/);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('creates intermediaries as pending until the admin approves', async () => {
    const res = await loginWithOtp({ role: 'intermediary' });
    expect(res.body.user).toMatchObject({ role: 'intermediary', status: 'pending' });
  });

  it('never lets a caller self-assign admin', async () => {
    const sent = await request(app).post('/api/v1/auth/send-otp').send({ phone: PHONE });
    const res = await request(app).post('/api/v1/auth/verify-otp').send({ phone: PHONE, code: sent.body.devOtp, role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('upgrades a customer to merchant, but does not downgrade a merchant', async () => {
    await loginWithOtp();
    await Otp.deleteMany({});
    const up = await loginWithOtp({ role: 'merchant' });
    expect(up.body.user.role).toBe('merchant');
    expect(up.body.isNewUser).toBe(false);
    await Otp.deleteMany({});
    const again = await loginWithOtp({ role: 'customer' });
    expect(again.body.user.role).toBe('merchant');
  });

  it('rejects a wrong code, counts attempts, and burns the code after use', async () => {
    const sent = await request(app).post('/api/v1/auth/send-otp').send({ phone: PHONE });
    const wrong = sent.body.devOtp === '000000' ? '111111' : '000000';
    const bad = await request(app).post('/api/v1/auth/verify-otp').send({ phone: PHONE, code: wrong });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('OTP_INVALID');
    const ok = await request(app).post('/api/v1/auth/verify-otp').send({ phone: PHONE, code: sent.body.devOtp });
    expect(ok.status).toBe(200);
    const replay = await request(app).post('/api/v1/auth/verify-otp').send({ phone: PHONE, code: sent.body.devOtp });
    expect(replay.status).toBe(400);
  });

  it('locks the code after too many wrong attempts', async () => {
    const sent = await request(app).post('/api/v1/auth/send-otp').send({ phone: PHONE });
    const wrong = sent.body.devOtp === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) await request(app).post('/api/v1/auth/verify-otp').send({ phone: PHONE, code: wrong });
    const res = await request(app).post('/api/v1/auth/verify-otp').send({ phone: PHONE, code: sent.body.devOtp });
    expect(res.status).toBe(429);
  });

  it('throttles resending a code', async () => {
    await request(app).post('/api/v1/auth/send-otp').send({ phone: PHONE });
    const again = await request(app).post('/api/v1/auth/send-otp').send({ phone: PHONE });
    expect(again.status).toBe(429);
  });

  it('validates input', async () => {
    const res = await request(app).post('/api/v1/auth/send-otp').send({ phone: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const both = await request(app).post('/api/v1/auth/send-otp').send({ phone: PHONE, email: 'a@b.co' });
    expect(both.status).toBe(400);
  });

  it('works for email as well', async () => {
    const sent = await request(app).post('/api/v1/auth/send-otp').send({ email: 'Shop@Example.com' });
    const res = await request(app).post('/api/v1/auth/verify-otp').send({ email: 'shop@example.com', code: sent.body.devOtp });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('shop@example.com');
  });

  it('blocks blocked accounts', async () => {
    await loginWithOtp();
    await User.updateMany({}, { status: 'blocked' });
    await Otp.deleteMany({});
    const res = await loginWithOtp();
    expect(res.status).toBe(403);
  });
});

describe('refresh tokens', () => {
  it('rotates, and replaying an old token revokes the whole session', async () => {
    const login = await loginWithOtp();
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
    const login = await loginWithOtp();
    const out = await request(app).post('/api/v1/auth/logout').send({ refreshToken: login.body.refreshToken });
    expect(out.status).toBe(204);
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('role based access', () => {
  it('GET /me requires a token and returns the user', async () => {
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
    const login = await loginWithOtp();
    const me = await request(app).get('/api/v1/me').set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.phone).toBe(E164);
  });

  it('requireRole lets the right role in and keeps others out', async () => {
    const { Router } = await import('express');
    const { authenticate, requireRole } = await import('../src/middleware/auth');
    const r = Router();
    r.get('/admin-only', authenticate, requireRole('admin'), (_q, s) => void s.json({ ok: true }));
    const { default: express } = await import('express');
    const { errorHandler } = await import('../src/middleware/errorHandler');
    const mini = express().use(r).use(errorHandler);

    const customer = await loginWithOtp();
    const denied = await request(mini).get('/admin-only').set('Authorization', `Bearer ${customer.body.accessToken}`);
    expect(denied.status).toBe(403);

    process.env.ADMIN_PASSWORD = 'a-long-admin-password';
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

  it('admins cannot use the OTP flow', async () => {
    await User.create({ phone: E164, role: 'admin', referralCode: svc.generateReferralCode() });
    const res = await loginWithOtp();
    expect(res.status).toBe(403);
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

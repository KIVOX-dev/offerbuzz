import crypto from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { OFFERS_PER_MONTH, planAmount } from '@offerbuzz/shared';

let mongod: MongoMemoryServer;
let app: import('express').Express;
let User: typeof import('../src/models/User').User;
let Offer: typeof import('../src/models/Offer').Offer;
let Subscription: typeof import('../src/models/Subscription').Subscription;
let Payment: typeof import('../src/models/Payment').Payment;
let WalletEntry: typeof import('../src/models/WalletEntry').WalletEntry;
let sub: typeof import('../src/modules/subscription/subscription.service');
let addMonths: typeof import('../src/utils/months').addMonths;

const KEY_ID = 'rzp_test_key';
const KEY_SECRET = 'test_key_secret_value';
const WEBHOOK_SECRET = 'test_webhook_secret';
const OFFER = {
  title: 'Flat 30% off',
  description: 'Thirty percent off on all services this month.',
  category: 'Salon and Spa',
  discountType: 'percent',
  discountValue: 30,
  startsAt: '2026-11-01',
  endsAt: '2026-11-30',
  area: 'RS Puram, Coimbatore',
  phone: '9876543210',
};

const authed = (r: request.Test, token: string) => r.set('authorization', `Bearer ${token}`);
const sign = (orderId: string, paymentId: string) => crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');

let orderSeq = 0;
/** Razorpay's order API, faked: every call gets a fresh order id. */
function fakeRazorpay() {
  mails.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: { body?: string }) => {
      // Brevo (email): remember what was sent
      if (String(url).includes('brevo.com')) {
        const b = JSON.parse(init?.body ?? '{}');
        mails.push({ to: b.to[0].email, subject: b.subject, html: b.htmlContent });
        return { ok: true, text: async () => '' };
      }
      return { ok: true, json: async () => ({ id: `order_TEST${++orderSeq}` }) };
    }),
  );
}
const mails: { to: string; subject: string; html: string }[] = [];
/** Turns email sending on (a fake Brevo key) for the rest of one test. */
async function mailOn() {
  process.env.BREVO_API_KEY = 'test-brevo-key';
  (await import('../src/config/env')).resetEnvCache();
}

async function merchant(email = 'shop@example.com') {
  const sent = await request(app).post('/api/v1/auth/send-otp').send({ email, mode: 'signup' });
  const res = await request(app)
    .post('/api/v1/auth/verify-otp')
    .send({ email, code: sent.body.devOtp, mode: 'signup', name: 'Test Shop', role: 'merchant', category: 'Salon and Spa' });
  await User.updateOne({ email }, { location: { type: 'Point', coordinates: [76.9558, 11.0168] }, locationAddress: 'Test Street, Coimbatore' });
  return { token: res.body.accessToken as string, id: res.body.user.id as string };
}

/** Pays for a plan through the same two calls the website makes. */
async function pay(token: string, plan: string, months: number) {
  const order = await authed(request(app).post('/api/v1/payments/create-order'), token).send({ plan, months });
  expect(order.status).toBe(201);
  const paymentId = `pay_TEST${++orderSeq}`;
  const verified = await authed(request(app).post('/api/v1/payments/verify'), token).send({
    razorpay_order_id: order.body.orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: sign(order.body.orderId, paymentId),
  });
  return { order, paymentId, verified };
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongod.getUri('offerbuzz_payments_test'),
    JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret',
    OTP_SECRET: 'test-otp-secret-test-otp-secret-123',
    OTP_DEV_MODE: 'true',
    BREVO_API_KEY: '',
    DNS_SERVERS: '',
    RAZORPAY_KEY_ID: KEY_ID,
    RAZORPAY_KEY_SECRET: KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
  });
  const { createApp } = await import('../src/app');
  User = (await import('../src/models/User')).User;
  Offer = (await import('../src/models/Offer')).Offer;
  Subscription = (await import('../src/models/Subscription')).Subscription;
  Payment = (await import('../src/models/Payment')).Payment;
  WalletEntry = (await import('../src/models/WalletEntry')).WalletEntry;
  sub = await import('../src/modules/subscription/subscription.service');
  addMonths = (await import('../src/utils/months')).addMonths;
  (await import('../src/services/geocode')).setReverseGeocoder(async () => ({ address: 'Somewhere', placeId: 'p1' }));
  app = createApp();
  await (await import('../src/config/db')).connectDb();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  fakeRazorpay();
  await Promise.all([User.deleteMany({}), Offer.deleteMany({}), Subscription.deleteMany({}), Payment.deleteMany({}), WalletEntry.deleteMany({})]);
  await mongoose.connection.collection('otps').deleteMany({});
});

afterEach(async () => {
  vi.unstubAllGlobals();
  process.env.BREVO_API_KEY = '';
  (await import('../src/config/env')).resetEnvCache();
});

describe('pricing', () => {
  it('works out 1, 6 and 12 months, with 10% off from 6 months', () => {
    expect(planAmount('basic', 1)).toBe(149);
    expect(planAmount('basic', 6)).toBe(805); // 894 less 10%
    expect(planAmount('basic', 12)).toBe(1609); // 1788 less 10%
    expect(planAmount('premium', 12)).toBe(3769);
    expect(planAmount('featured', 12)).toBe(6469);
  });
});

describe('offers run for 30 days at most', () => {
  it('accepts a 30 day offer and refuses a longer one, at posting time', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 1);
    const post = (body: Record<string, unknown>) => authed(request(app).post('/api/v1/offers'), m.token).send(body);
    const long = await post({ ...OFFER, startsAt: '2026-11-01', endsAt: '2026-12-01' }); // 31 days counting both ends
    expect(long.status).toBe(400);
    expect(JSON.stringify(long.body)).toMatch(/30 days/);
    expect((await post({ ...OFFER, startsAt: '2026-11-01', endsAt: '2027-03-01' })).status).toBe(400);
    expect((await post({ ...OFFER, startsAt: '2026-11-01', endsAt: '2026-11-30' })).status).toBe(201); // exactly 30 days
    // a refused offer does not use a slot
    const s = await authed(request(app).get('/api/v1/subscription'), m.token);
    expect(s.body.offerQuota.used).toBe(1);
  });
});

describe('no plan, no posting', () => {
  it('blocks a merchant who has not paid', async () => {
    const m = await merchant();
    const res = await authed(request(app).post('/api/v1/offers'), m.token).send(OFFER);
    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe('PLAN_REQUIRED');
    expect(await Offer.countDocuments()).toBe(0);
  });

  it('blocks a merchant whose plan has ended', async () => {
    const m = await merchant();
    const past = new Date(Date.now() - 86_400_000);
    await Subscription.create({ merchantId: m.id, plan: 'basic', paidUntil: past, lastPaidAt: addMonths(past, -1), periodStart: addMonths(past, -1) });
    const res = await authed(request(app).post('/api/v1/offers'), m.token).send(OFFER);
    expect(res.status).toBe(402);
  });
});

describe('paying through Razorpay', () => {
  it('creates an order for the right amount in paise, which the browser cannot change', async () => {
    const m = await merchant();
    const order = await authed(request(app).post('/api/v1/payments/create-order'), m.token).send({ plan: 'premium', months: 12 });
    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({ keyId: KEY_ID, amount: 376900, currency: 'INR', plan: 'premium', months: 12 });
    const sent = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(sent.amount).toBe(376900);
    expect(await Payment.countDocuments({ status: 'created' })).toBe(1);
    // bad terms and unknown plans are refused
    expect((await authed(request(app).post('/api/v1/payments/create-order'), m.token).send({ plan: 'premium', months: 5 })).status).toBe(400);
    expect((await authed(request(app).post('/api/v1/payments/create-order'), m.token).send({ plan: 'gold', months: 1 })).status).toBe(400);
  });

  it('only merchants can start a payment', async () => {
    expect((await request(app).post('/api/v1/payments/create-order').send({ plan: 'basic', months: 1 })).status).toBe(401);
  });

  it('a verified payment activates the plan and lets the merchant post', async () => {
    const m = await merchant();
    const { verified } = await pay(m.token, 'basic', 1);
    expect(verified.status).toBe(200);
    expect(verified.body).toMatchObject({ plan: 'basic', months: 1, amount: 149 });
    const s = await authed(request(app).get('/api/v1/subscription'), m.token);
    expect(s.body).toMatchObject({ active: true, plan: 'basic', offerQuota: { limit: OFFERS_PER_MONTH, used: 0, remaining: OFFERS_PER_MONTH } });
    expect((await authed(request(app).post('/api/v1/offers'), m.token).send(OFFER)).status).toBe(201);
  });

  it('rejects a wrong signature, and someone else\'s order', async () => {
    const m = await merchant();
    const other = await merchant('other@example.com');
    const order = await authed(request(app).post('/api/v1/payments/create-order'), m.token).send({ plan: 'basic', months: 1 });
    const body = (sig: string) => ({ razorpay_order_id: order.body.orderId, razorpay_payment_id: 'pay_X123456', razorpay_signature: sig });
    const bad = await authed(request(app).post('/api/v1/payments/verify'), m.token).send(body('0'.repeat(64)));
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('BAD_SIGNATURE');
    const theirs = await authed(request(app).post('/api/v1/payments/verify'), other.token).send(body(sign(order.body.orderId, 'pay_X123456')));
    expect(theirs.status).toBe(403);
    expect(await Subscription.countDocuments()).toBe(0);
  });

  it('applies a payment once, even if the browser confirms it twice', async () => {
    const m = await merchant();
    const { order, paymentId, verified } = await pay(m.token, 'basic', 1);
    const first = (await Subscription.findOne({ merchantId: m.id }))!.paidUntil.getTime();
    const again = await authed(request(app).post('/api/v1/payments/verify'), m.token).send({
      razorpay_order_id: order.body.orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sign(order.body.orderId, paymentId),
    });
    expect(again.status).toBe(200);
    expect(again.body.paidUntil).toBe(verified.body.paidUntil);
    expect((await Subscription.findOne({ merchantId: m.id }))!.paidUntil.getTime()).toBe(first);
  });

  it('the webhook activates the plan when the browser never came back, and is not applied twice', async () => {
    const m = await merchant();
    const order = await authed(request(app).post('/api/v1/payments/create-order'), m.token).send({ plan: 'premium', months: 6 });
    const event = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_WEB123', order_id: order.body.orderId, amount: order.body.amount, status: 'captured' } } },
    });
    const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(event).digest('hex');
    const hook = () => request(app).post('/api/v1/payments/webhook').set('content-type', 'application/json').set('x-razorpay-signature', sig).send(event);

    expect((await request(app).post('/api/v1/payments/webhook').set('content-type', 'application/json').set('x-razorpay-signature', 'nope').send(event)).status).toBe(400);
    expect(await Subscription.countDocuments()).toBe(0);

    expect((await hook()).status).toBe(200);
    const s = (await Subscription.findOne({ merchantId: m.id }))!;
    expect(s.plan).toBe('premium');
    expect(Math.round((s.paidUntil.getTime() - Date.now()) / 86_400_000)).toBeGreaterThanOrEqual(180);
    const until = s.paidUntil.getTime();
    expect((await hook()).status).toBe(200); // Razorpay retries
    expect((await Subscription.findOne({ merchantId: m.id }))!.paidUntil.getTime()).toBe(until);
  });

  it('the webhook refuses a payment of the wrong amount', async () => {
    const m = await merchant();
    const order = await authed(request(app).post('/api/v1/payments/create-order'), m.token).send({ plan: 'featured', months: 12 });
    const event = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_LOW1234', order_id: order.body.orderId, amount: 100 } } } });
    const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(event).digest('hex');
    const res = await request(app).post('/api/v1/payments/webhook').set('content-type', 'application/json').set('x-razorpay-signature', sig).send(event);
    expect(res.status).toBe(400);
    expect(await Subscription.countDocuments()).toBe(0);
  });

  it('says so when Razorpay is not set up', async () => {
    const m = await merchant();
    const { resetEnvCache } = await import('../src/config/env');
    const keep = process.env.RAZORPAY_KEY_ID;
    process.env.RAZORPAY_KEY_ID = '';
    resetEnvCache();
    try {
      const res = await authed(request(app).post('/api/v1/payments/create-order'), m.token).send({ plan: 'basic', months: 1 });
      expect(res.status).toBe(503);
    } finally {
      process.env.RAZORPAY_KEY_ID = keep;
      resetEnvCache();
    }
  });
});

describe('2 offers per paid month', () => {
  it('lets a merchant post 2 offers, then stops the 3rd with a clear message', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 1);
    const post = () => authed(request(app).post('/api/v1/offers'), m.token).send(OFFER);
    expect((await post()).status).toBe(201);
    expect((await post()).status).toBe(201);
    const third = await post();
    expect(third.status).toBe(403);
    expect(third.body.error.code).toBe('OFFER_LIMIT_REACHED');
    expect(third.body.error.message).toMatch(/2 offers/);
    const s = await authed(request(app).get('/api/v1/subscription'), m.token);
    expect(s.body.offerQuota).toMatchObject({ limit: 2, used: 2, remaining: 0 });
  });

  it('deleting an offer does not give the slot back', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 1);
    const post = () => authed(request(app).post('/api/v1/offers'), m.token).send(OFFER);
    const a = await post();
    await post();
    expect((await authed(request(app).delete(`/api/v1/offers/${a.body.offer.id}`), m.token)).status).toBe(204);
    expect((await post()).status).toBe(403);
  });

  it('an offer that fails to save does not use up a slot', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 1);
    // the shop has no pin and the offer gives no usable place, so saving is refused after the slot was taken
    await User.updateOne({ _id: m.id }, { $unset: { location: 1 } });
    const bad = await authed(request(app).post('/api/v1/offers'), m.token).send({ ...OFFER, area: 'zzzz nowhere' });
    expect(bad.status).toBe(409);
    const s = await authed(request(app).get('/api/v1/subscription'), m.token);
    expect(s.body.offerQuota.used).toBe(0);
  });

  it('two posts at the same moment cannot both take the last slot', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 1);
    const results = await Promise.all(Array.from({ length: 5 }, () => authed(request(app).post('/api/v1/offers'), m.token).send(OFFER)));
    expect(results.filter((r) => r.status === 201)).toHaveLength(2);
    expect(await Offer.countDocuments()).toBe(2);
  });

  it('a yearly plan gives 2 offers in each of the 12 months (24 in all), and the count starts again each month', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 12);
    const s0 = (await Subscription.findOne({ merchantId: m.id }))!;
    expect(Math.round((s0.paidUntil.getTime() - Date.now()) / 86_400_000)).toBeGreaterThanOrEqual(364);

    const post = () => authed(request(app).post('/api/v1/offers'), m.token).send(OFFER);
    expect((await post()).status).toBe(201);
    expect((await post()).status).toBe(201);
    expect((await post()).status).toBe(403);

    // pretend the paid run began 1 month + 1 day ago: it is now month 2 of 12, so there are 2 fresh slots
    const began = addMonths(new Date(), -1);
    began.setUTCDate(began.getUTCDate() - 1);
    await Subscription.updateOne({ merchantId: m.id }, { periodStart: began });
    const s = await authed(request(app).get('/api/v1/subscription'), m.token);
    expect(s.body.offerQuota).toMatchObject({ used: 0, remaining: 2 });
    expect((await post()).status).toBe(201);
    expect((await post()).status).toBe(201);
    expect((await post()).status).toBe(403);
  });

  it('paying again early keeps the same month windows; coming back after a lapse starts fresh', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 1);
    const first = (await Subscription.findOne({ merchantId: m.id }))!.periodStart!.getTime();
    await pay(m.token, 'basic', 1); // renewed early
    expect((await Subscription.findOne({ merchantId: m.id }))!.periodStart!.getTime()).toBe(first);

    const past = new Date(Date.now() - 40 * 86_400_000);
    await Subscription.updateOne({ merchantId: m.id }, { paidUntil: past, periodStart: addMonths(past, -2), quotaUsed: 2 });
    await pay(m.token, 'basic', 1); // after the lapse
    const after = (await Subscription.findOne({ merchantId: m.id }))!;
    expect(after.periodStart!.getTime()).toBeGreaterThan(Date.now() - 60_000);
    expect(sub.quotaOf(after).remaining).toBe(2);
  });
});

describe('month windows', () => {
  it('moves to the next window on the same day each month, and clamps month ends', () => {
    const start = new Date('2026-01-31T10:00:00Z');
    const paidUntil = addMonths(start, 12);
    expect(addMonths(start, 1).toISOString()).toBe('2026-02-28T10:00:00.000Z');
    const w = sub.currentWindow(start, paidUntil, new Date('2026-04-01T00:00:00Z'));
    expect(w.start.toISOString()).toBe('2026-03-31T10:00:00.000Z');
    // the last window never runs past the paid-until date
    const last = sub.currentWindow(start, addMonths(start, 12), new Date('2026-12-31T00:00:00Z'));
    expect(last.end.getTime()).toBeLessThanOrEqual(paidUntil.getTime());
  });
});

describe('emails and the days counter', () => {
  it('thanks the merchant and tells the team inbox, with the plan details and the end date', async () => {
    const m = await merchant();
    await mailOn();
    await pay(m.token, 'premium', 12);
    await vi.waitFor(() => expect(mails).toHaveLength(2));
    const toMerchant = mails.find((x) => x.to === 'shop@example.com')!;
    expect(toMerchant.subject).toBe('Thank you for subscribing to the OfferBuzz Premium plan');
    expect(toMerchant.html).toContain('12 months');
    expect(toMerchant.html).toContain('3769');
    expect(toMerchant.html).toContain('24 offers in all');
    const until = (await Subscription.findOne({ merchantId: m.id }))!.paidUntil;
    const endText = until.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
    expect(toMerchant.html).toContain(endText);
    const toTeam = mails.find((x) => x.to === 'offerbuzzdotin@gmail.com')!;
    expect(toTeam.subject).toContain('Premium');
    for (const text of ['Test Shop', 'shop@example.com', endText, '3769', 'pay_TEST']) expect(toTeam.html).toContain(text);
  });

  it('a payment still works when the email server is down', async () => {
    const m = await merchant();
    await mailOn();
    const ok = fetch as unknown as ReturnType<typeof vi.fn>;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: unknown) => (String(url).includes('brevo.com') ? { ok: false, status: 500, text: async () => 'down' } : ok(url, init))));
    const { verified } = await pay(m.token, 'basic', 1);
    expect(verified.status).toBe(200);
    expect((await authed(request(app).get('/api/v1/subscription'), m.token)).body.active).toBe(true);
  });

  it('reminds the merchant once, 2 days before the plan ends, and again after they renew', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 1);
    await mailOn();
    mails.length = 0;
    const { notifyEndingPlans } = await import('../src/services/planEmails');

    // 5 days left: too early
    await Subscription.updateOne({ merchantId: m.id }, { paidUntil: new Date(Date.now() + 5 * 86_400_000) });
    expect(await notifyEndingPlans()).toBe(0);

    // 47 hours left: send
    await Subscription.updateOne({ merchantId: m.id }, { paidUntil: new Date(Date.now() + 47 * 3_600_000) });
    expect(await notifyEndingPlans()).toBe(1);
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toBe('shop@example.com');
    expect(mails[0].subject).toBe('Your OfferBuzz plan ends in 2 days');
    expect(mails[0].html).toContain('Basic');

    // checked again an hour later: not sent twice
    expect(await notifyEndingPlans()).toBe(0);
    expect(mails).toHaveLength(1);

    // an expired plan is not reminded
    await Subscription.updateOne({ merchantId: m.id }, { paidUntil: new Date(Date.now() - 3_600_000) });
    expect(await notifyEndingPlans()).toBe(0);

    // renewed, and a month later it is about to end again: reminded again
    await Subscription.updateOne({ merchantId: m.id }, { paidUntil: new Date(Date.now() + 30 * 3_600_000) });
    expect(await notifyEndingPlans()).toBe(1);
    expect(mails[1].subject).toBe('Your OfferBuzz plan ends in 2 days');
  });

  it('a failed reminder is tried again on the next check', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 1);
    await mailOn();
    await Subscription.updateOne({ merchantId: m.id }, { paidUntil: new Date(Date.now() + 20 * 3_600_000) });
    const { notifyEndingPlans } = await import('../src/services/planEmails');
    const ok = fetch as unknown as ReturnType<typeof vi.fn>;
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, text: async () => 'down' })));
    expect(await notifyEndingPlans()).toBe(0);
    vi.stubGlobal('fetch', ok);
    mails.length = 0;
    expect(await notifyEndingPlans()).toBe(1);
  });

  it('counts the days down: full term after paying, whole days as it runs out, 0 once it has ended', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 1);
    const get = async () => (await authed(request(app).get('/api/v1/subscription'), m.token)).body;
    let s = await get();
    expect(s.daysLeft).toBeGreaterThanOrEqual(28);
    expect(s.daysLeft).toBeLessThanOrEqual(31);
    expect(s.totalDays).toBe(s.daysLeft);

    await Subscription.updateOne({ merchantId: m.id }, { paidUntil: new Date(Date.now() + 36 * 3_600_000) });
    s = await get();
    expect(s.daysLeft).toBe(2); // a part day counts as a day
    expect(s.active).toBe(true);

    await Subscription.updateOne({ merchantId: m.id }, { paidUntil: new Date(Date.now() - 1000) });
    s = await get();
    expect(s).toMatchObject({ daysLeft: 0, active: false });
    expect((await authed(request(app).post('/api/v1/offers'), m.token).send(OFFER)).status).toBe(402); // ended means no posting
  });
});

describe('Refer & Earn credits', () => {
  async function referredMerchant() {
    const agent = await User.create({ email: 'agent@example.com', role: 'intermediary', status: 'active', referralCode: 'AGENT123', name: 'Agent' });
    const m = await merchant();
    await User.updateOne({ _id: m.id }, { referredBy: agent._id });
    return { agent, m };
  }

  it('credits the partner 25% when a referred merchant pays through Razorpay', async () => {
    const { agent, m } = await referredMerchant();
    await pay(m.token, 'basic', 1);
    const rows = await WalletEntry.find({ intermediaryId: agent._id });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'credit', reason: 'subscription', credits: 37 }); // 25% of Rs 149 = 37.25
    expect(String(rows[0].merchantId)).toBe(m.id);
  });

  it('a 12 month payment credits the partner for each of the 12 months, once, even if confirmed twice', async () => {
    const { agent, m } = await referredMerchant();
    const { order, paymentId } = await pay(m.token, 'premium', 12);
    await authed(request(app).post('/api/v1/payments/verify'), m.token).send({
      razorpay_order_id: order.body.orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sign(order.body.orderId, paymentId),
    });
    const rows = await WalletEntry.find({ intermediaryId: agent._id });
    expect(rows).toHaveLength(12);
    expect(new Set(rows.map((r) => r.period)).size).toBe(12);
    // Rs 3769 over 12 months, 25% of each month's share
    expect(rows.reduce((n, r) => n + r.credits, 0)).toBeGreaterThanOrEqual(940);
  });

  it('a merchant nobody referred earns nobody a credit', async () => {
    const m = await merchant();
    await pay(m.token, 'basic', 1);
    expect(await WalletEntry.countDocuments()).toBe(0);
  });
});

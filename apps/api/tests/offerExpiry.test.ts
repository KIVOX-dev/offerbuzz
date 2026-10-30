import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let notifyExpiringOffers: typeof import('../src/services/offerExpiry').notifyExpiringOffers;
let User: typeof import('../src/models/User').User;
let Offer: typeof import('../src/models/Offer').Offer;

const NOW = new Date('2026-10-30T10:00:00.000Z');
const day = (offset: number) => new Date(NOW.getTime() + offset * 86_400_000);

async function makeOffer(merchantId: unknown, title: string, endsAt: Date, extra: Record<string, unknown> = {}) {
  return Offer.create({
    merchantId,
    title,
    description: 'desc',
    category: 'Fashion',
    discountType: 'deal',
    startsAt: day(-10),
    endsAt,
    area: 'RS Puram',
    status: 'active',
    ...extra,
  });
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongod.getUri('offerbuzz_expiry_test'),
    JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret',
    OTP_SECRET: 'test-otp-secret-test-otp-secret-123',
    OTP_DEV_MODE: 'true',
    BREVO_API_KEY: '',
    DNS_SERVERS: '',
  });
  await mongoose.connect(process.env.MONGODB_URI as string);
  ({ notifyExpiringOffers } = await import('../src/services/offerExpiry'));
  User = (await import('../src/models/User')).User;
  Offer = (await import('../src/models/Offer')).Offer;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Offer.deleteMany({});
  await User.deleteMany({});
});

describe('notifyExpiringOffers', () => {
  it('notifies once for offers ending within two days and skips the rest', async () => {
    const vendor = await User.create({ role: 'merchant', email: 'shop@example.com', name: 'Shop', referralCode: 'AAAA1111' });
    const soon = await makeOffer(vendor._id, 'Ends soon', day(1));
    const today = await makeOffer(vendor._id, 'Ends today', day(0));
    const later = await makeOffer(vendor._id, 'Ends later', day(10));
    const over = await makeOffer(vendor._id, 'Already over', day(-1));
    const pending = await makeOffer(vendor._id, 'Not approved', day(1), { status: 'pending' });

    expect(await notifyExpiringOffers(NOW)).toBe(2);
    expect((await Offer.findById(soon._id))?.expiryNoticeSentAt).toBeTruthy();
    expect((await Offer.findById(today._id))?.expiryNoticeSentAt).toBeTruthy();
    for (const o of [later, over, pending]) expect((await Offer.findById(o._id))?.expiryNoticeSentAt).toBeFalsy();

    // a second run does not email again
    expect(await notifyExpiringOffers(NOW)).toBe(0);
  });

  it('skips vendors with no email address', async () => {
    const vendor = await User.create({ role: 'merchant', phone: '9345975747', name: 'Phone only', referralCode: 'BBBB2222' });
    const offer = await makeOffer(vendor._id, 'No mail', day(1));
    expect(await notifyExpiringOffers(NOW)).toBe(0);
    expect((await Offer.findById(offer._id))?.expiryNoticeSentAt).toBeFalsy();
  });
});

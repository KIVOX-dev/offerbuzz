import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let askOffera: typeof import('../src/modules/ai/ai.service').askOffera;
let OFF_TOPIC_REPLY: string;
let resetGroqCooldowns: typeof import('../src/services/groq').resetGroqCooldowns;
let resetEnvCache: typeof import('../src/config/env').resetEnvCache;
let User: typeof import('../src/models/User').User;
let Offer: typeof import('../src/models/Offer').Offer;
let app: import('express').Express;

const HERE = { lat: 11.0, lng: 76.96 };
const messages = (text: string) => [{ role: 'user' as const, content: text }];

const groqReply = (body: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(body) } }] }), { status: 200 });

async function seed() {
  const today = new Date();
  const day = (n: number) => new Date(today.getTime() + n * 86_400_000);
  const mk = async (email: string, shopName: string, lng: number, lat: number, category: string, title: string, value: number) => {
    const v = await User.create({ role: 'merchant', email, name: shopName, shopName, category, referralCode: email.slice(0, 8).toUpperCase().padEnd(8, 'A'), location: { type: 'Point', coordinates: [lng, lat] } });
    return Offer.create({ merchantId: v._id, title, description: 'Great deal for everyone.', category, discountType: 'percent', discountValue: value, startsAt: day(-1), endsAt: day(10), area: 'RS Puram', status: 'active' });
  };
  const near = await mk('near@example.com', 'Near Fresh', HERE.lng, HERE.lat, 'Grocery', 'Veg combo', 20);
  const mid = await mk('mid@example.com', 'Mid Styles', HERE.lng + 0.05, HERE.lat, 'Fashion', 'Saree sale', 40);
  return { near: String(near._id), mid: String(mid._id) };
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongod.getUri('offerbuzz_ai_test'),
    JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret',
    OTP_SECRET: 'test-otp-secret-test-otp-secret-123',
    OTP_DEV_MODE: 'true',
    BREVO_API_KEY: '',
    DNS_SERVERS: '',
    GROQ_API_KEY: '',
    GROQ_MODELS: 'model-a,model-b',
  });
  await mongoose.connect(process.env.MONGODB_URI as string);
  ({ askOffera, OFF_TOPIC_REPLY } = await import('../src/modules/ai/ai.service'));
  ({ resetGroqCooldowns } = await import('../src/services/groq'));
  ({ resetEnvCache } = await import('../src/config/env'));
  User = (await import('../src/models/User')).User;
  Offer = (await import('../src/models/Offer')).Offer;
  app = (await import('../src/app')).createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Offer.deleteMany({});
  await User.deleteMany({});
  resetGroqCooldowns();
  process.env.GROQ_API_KEY = '';
  resetEnvCache();
});

afterEach(() => vi.unstubAllGlobals());

const withKey = () => {
  process.env.GROQ_API_KEY = 'test-key';
  resetEnvCache();
};

describe('Offera AI', () => {
  it('answers straight from the offers when there is no AI key, nearest first', async () => {
    const ids = await seed();
    const res = await askOffera({ messages: messages('best deals near me'), ...HERE });
    expect(res.source).toBe('basic');
    expect(res.offers.length).toBeGreaterThan(0);
    expect(res.reply).toContain('near you');
    expect(res.offers.map((o) => o.id)).toContain(ids.near);
  });

  it('falls back to the next model when the first is rate limited, and drops offers the model made up', async () => {
    const ids = await seed();
    withKey();
    const used: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: { body: string }) => {
        const model = JSON.parse(init.body).model as string;
        used.push(model);
        if (model === 'model-a') return new Response('{}', { status: 429, headers: { 'retry-after': '30' } });
        return groqReply({ onTopic: true, reply: 'Try Saree sale at Mid Styles.', offerIds: [ids.mid, 'f'.repeat(24)] });
      }),
    );
    const res = await askOffera({ messages: messages('fashion deals'), ...HERE });
    expect(used).toEqual(['model-a', 'model-b']);
    expect(res.source).toBe('ai');
    expect(res.reply).toBe('Try Saree sale at Mid Styles.');
    expect(res.offers.map((o) => o.id)).toEqual([ids.mid]); // the invented id is gone

    // the rate limited model rests, so the next question goes straight to model-b
    used.length = 0;
    await askOffera({ messages: messages('anything else?'), ...HERE });
    expect(used).toEqual(['model-b']);
  });

  it('refuses anything that is not about offers, with fixed text and no offers', async () => {
    await seed();
    withKey();
    vi.stubGlobal('fetch', vi.fn(async () => groqReply({ onTopic: false, reply: 'The capital of France is Paris.', offerIds: [] })));
    const res = await askOffera({ messages: messages('what is the capital of France?'), ...HERE });
    expect(res.reply).toBe(OFF_TOPIC_REPLY);
    expect(res.offers).toEqual([]);
  });

  it('does not pass on a long wandering answer that recommends nothing', async () => {
    await seed();
    withKey();
    vi.stubGlobal('fetch', vi.fn(async () => groqReply({ onTopic: true, reply: 'Here is a long story. '.repeat(30), offerIds: [] })));
    const res = await askOffera({ messages: messages('tell me a story'), ...HERE });
    expect(res.source).toBe('basic');
    expect(res.reply).not.toContain('long story');
  });

  it('still answers when every model fails', async () => {
    await seed();
    withKey();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 503 })));
    const res = await askOffera({ messages: messages('best offers'), ...HERE });
    expect(res.source).toBe('basic');
    expect(res.offers.length).toBeGreaterThan(0);
  });

  it('shows the newest offers when the location is unknown, and handles no offers at all', async () => {
    const res = await askOffera({ messages: messages('hello') });
    expect(res.offers).toEqual([]);
    expect(res.reply).toMatch(/no live offers/i);
    await seed();
    const res2 = await askOffera({ messages: messages('hello') });
    expect(res2.offers.length).toBeGreaterThan(0);
  });

  it('validates the request over HTTP', async () => {
    expect((await request(app).post('/api/v1/ai/chat').send({ messages: [] })).status).toBe(400);
    expect((await request(app).post('/api/v1/ai/chat').send({ messages: [{ role: 'user', content: 'x'.repeat(501) }] })).status).toBe(400);
    expect((await request(app).post('/api/v1/ai/chat').send({ messages: [{ role: 'user', content: 'hi' }], lat: 99, lng: 0 })).status).toBe(400);
    await seed();
    const ok = await request(app).post('/api/v1/ai/chat').send({ messages: [{ role: 'user', content: 'best deals' }], ...HERE });
    expect(ok.status).toBe(200);
    expect(ok.body.offers.length).toBeGreaterThan(0);
  });
});

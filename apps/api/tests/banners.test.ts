import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let app: import('express').Express;
let token: string;

const CARD = {
  title: 'Sale is live',
  offer: '50 - 80% Off',
  tagline: 'Up to Rs 100 off',
  burst: ['BIG', 'SAVE', 'DAYS'],
  theme: 'blue',
  image: '/banners/electronics.webp',
  category: 'Mobile and Electronics',
};
const IMAGE_ONLY = { title: '', burst: [], theme: 'blue', color: '#84002A', image: '/banners/fashion.webp', category: 'Fashion', imageOnly: true };
const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongod.getUri('offerbuzz_banners_test'),
    JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret',
    OTP_SECRET: 'test-otp-secret-test-otp-secret-123',
    BREVO_API_KEY: '',
    DNS_SERVERS: '',
  });
  const { createApp } = await import('../src/app');
  const svc = await import('../src/modules/auth/auth.service');
  const { User } = await import('../src/models/User');
  app = createApp();
  await (await import('../src/config/db')).connectDb();
  await User.create({
    email: 'boss@example.com', role: 'admin', status: 'active', referralCode: 'ADMINREF',
    passwordHash: await svc.hashPassword('Adminpass123'),
  });
  token = (await request(app).post('/api/v1/auth/admin/login').send({ email: 'boss@example.com', password: 'Adminpass123' })).body.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await mongoose.connection.collection('banners').deleteMany({});
  await mongoose.connection.collection('bannerimages').deleteMany({});
});

describe('home page cards', () => {
  it('only an admin can change cards, and visitors only see the active ones in order', async () => {
    expect((await request(app).post('/api/v1/admin/banners').send(CARD)).status).toBe(401);

    const a = await auth(request(app).post('/api/v1/admin/banners')).send(CARD);
    expect(a.status).toBe(201);
    const b = await auth(request(app).post('/api/v1/admin/banners')).send({ ...CARD, title: 'Second', active: false });
    expect(b.status).toBe(201);
    await auth(request(app).post('/api/v1/admin/banners')).send({ ...CARD, title: 'Third' });

    const pub = await request(app).get('/api/v1/banners');
    expect(pub.body.cards.map((c: { title: string }) => c.title)).toEqual(['Sale is live', 'Third']);
    const all = await auth(request(app).get('/api/v1/admin/banners'));
    expect(all.body.cards).toHaveLength(3);
  });

  it('rejects bad input', async () => {
    expect((await auth(request(app).post('/api/v1/admin/banners')).send({ ...CARD, title: '' })).status).toBe(400);
    expect((await auth(request(app).post('/api/v1/admin/banners')).send({ ...CARD, theme: 'pink' })).status).toBe(400);
    expect((await auth(request(app).post('/api/v1/admin/banners')).send({ ...CARD, image: 'javascript:alert(1)' })).status).toBe(400);
    expect((await auth(request(app).post('/api/v1/admin/banners')).send({ ...CARD, burst: ['A', 'B', 'C', 'D'] })).status).toBe(400);
  });

  it('edits, reorders and deletes a card', async () => {
    const a = (await auth(request(app).post('/api/v1/admin/banners')).send(CARD)).body.card;
    const b = (await auth(request(app).post('/api/v1/admin/banners')).send({ ...CARD, title: 'Second' })).body.card;

    const edited = await auth(request(app).put(`/api/v1/admin/banners/${a.id}`)).send({ ...CARD, title: 'Renamed', offer: '' });
    expect(edited.status).toBe(200);
    expect(edited.body.card.title).toBe('Renamed');
    expect(edited.body.card.offer).toBeUndefined();

    const moved = await auth(request(app).post(`/api/v1/admin/banners/${b.id}/move`)).send({ direction: 'up' });
    expect(moved.body.cards.map((c: { title: string }) => c.title)).toEqual(['Second', 'Renamed']);

    expect((await auth(request(app).delete(`/api/v1/admin/banners/${a.id}`))).status).toBe(204);
    expect((await auth(request(app).get('/api/v1/admin/banners'))).body.cards).toHaveLength(1);
    expect((await auth(request(app).put('/api/v1/admin/banners/not-an-id')).send(CARD)).status).toBe(404);
  });

  it('starts from the standard cards only when there are none', async () => {
    const first = await auth(request(app).post('/api/v1/admin/banners/seed-defaults')).send({});
    expect(first.status).toBe(201);
    expect(first.body.cards).toHaveLength(5);
    expect((await auth(request(app).post('/api/v1/admin/banners/seed-defaults')).send({})).status).toBe(409);
  });

  it('stores an uploaded photo, serves it publicly, and refuses files that are not images', async () => {
    const card = (await auth(request(app).post('/api/v1/admin/banners')).send(CARD)).body.card;
    const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

    const fake = await auth(request(app).put(`/api/v1/admin/banners/${card.id}/image`)).set('content-type', 'image/png').send(Buffer.from('not a picture at all'));
    expect(fake.status).toBe(415);

    const ok = await auth(request(app).put(`/api/v1/admin/banners/${card.id}/image`)).set('content-type', 'image/png').send(png);
    expect(ok.status).toBe(200);
    expect(ok.body.card.image).toContain(`/api/v1/banners/${card.id}/image`);

    const served = await request(app).get(`/api/v1/banners/${card.id}/image`);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe('image/png');

    // picking a ready made photo again drops the upload
    await auth(request(app).put(`/api/v1/admin/banners/${card.id}`)).send(CARD);
    expect((await request(app).get(`/api/v1/banners/${card.id}/image`)).status).toBe(404);
  });

  it('saves an image-only card with no headline, a custom colour and a category', async () => {
    const res = await auth(request(app).post('/api/v1/admin/banners')).send(IMAGE_ONLY);
    expect(res.status).toBe(201);
    expect(res.body.card).toMatchObject({ title: '', imageOnly: true, color: '#84002A', category: 'Fashion' });
    // a normal card still needs a headline, and every card needs a category
    expect((await auth(request(app).post('/api/v1/admin/banners')).send({ ...IMAGE_ONLY, imageOnly: false })).status).toBe(400);
    expect((await auth(request(app).post('/api/v1/admin/banners')).send({ ...IMAGE_ONLY, category: '' })).status).toBe(400);
  });
});

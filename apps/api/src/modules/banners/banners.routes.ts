import express, { Router } from 'express';
import mongoose from 'mongoose';
import { DEFAULT_PROMO_CARDS, promoCardSchema, type PromoCardDTO, type PromoCardInput } from '@offerbuzz/shared';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/async';
import { HttpError, notFound } from '../../utils/errors';
import { Banner, BannerImage, type BannerDoc } from '../../models/Banner';

export const bannersRouter = Router();

const MAX_IMAGE_BYTES = 600 * 1024;

function toDTO(b: BannerDoc): PromoCardDTO {
  return {
    id: String(b._id),
    title: b.title,
    subtitle: b.subtitle || undefined,
    offer: b.offer || undefined,
    tagline: b.tagline || undefined,
    burst: b.burst ?? [],
    theme: b.theme as PromoCardDTO['theme'],
    color: b.color || undefined,
    // the date in the address makes browsers fetch a replaced photo instead of the cached one
    image: b.hasUpload ? `/api/v1/banners/${b._id}/image?v=${b.updatedAt.getTime()}` : b.image,
    category: b.category || undefined,
    imageOnly: Boolean(b.imageOnly),
    active: b.active,
    order: b.order,
  };
}

/** The first bytes of the file must really be the image type it claims. */
function matchesType(buf: Buffer, type: string): boolean {
  if (type === 'image/jpeg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (type === 'image/png') return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === 'image/webp') return buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  return false;
}

const idOf = (v: unknown) => {
  const id = String(v);
  if (!mongoose.isValidObjectId(id)) throw notFound('Card not found');
  return id;
};

const asDoc = (b: unknown) => b as BannerDoc;

// ---- Public: what the home page shows ----------------------------------------------------------------------
bannersRouter.get(
  '/banners',
  wrap(async (_req, res) => {
    const rows = await Banner.find({ active: true }).sort({ order: 1, createdAt: 1 });
    res.set('cache-control', 'public, max-age=60');
    res.json({ cards: rows.map((b) => toDTO(asDoc(b))) });
  }),
);

bannersRouter.get(
  '/banners/:id/image',
  wrap(async (req, res) => {
    const image = await BannerImage.findOne({ bannerId: idOf(req.params.id) });
    if (!image) throw notFound('Photo not found');
    res.set({ 'content-type': image.contentType, 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' });
    res.send(image.data);
  }),
);

// ---- Admin ---------------------------------------------------------------------------------------------------
bannersRouter.use('/admin/banners', authenticate, requireRole('admin'));

bannersRouter.get(
  '/admin/banners',
  wrap(async (_req, res) => {
    const rows = await Banner.find().sort({ order: 1, createdAt: 1 });
    res.json({ cards: rows.map((b) => toDTO(asDoc(b))) });
  }),
);

bannersRouter.post(
  '/admin/banners',
  validate(promoCardSchema),
  wrap(async (req, res) => {
    const last = await Banner.findOne().sort({ order: -1 }).select('order');
    const b = await Banner.create({ ...(req.body as PromoCardInput), order: (last?.order ?? -1) + 1 });
    res.status(201).json({ card: toDTO(asDoc(b)) });
  }),
);

// loads the five cards the site shipped with, so the admin has something to edit (only when there are none yet)
bannersRouter.post(
  '/admin/banners/seed-defaults',
  wrap(async (_req, res) => {
    if (await Banner.exists({})) throw new HttpError(409, 'ALREADY_HAS_CARDS', 'There are already cards, edit those instead');
    const rows = await Banner.insertMany(DEFAULT_PROMO_CARDS.map((c, order) => ({ ...c, burst: [...c.burst], order, active: true })));
    res.status(201).json({ cards: rows.map((b) => toDTO(asDoc(b))) });
  }),
);

// moves a card up or down by swapping its place with the neighbour
bannersRouter.post(
  '/admin/banners/:id/move',
  wrap(async (req, res) => {
    const id = idOf(req.params.id);
    const dir = req.body?.direction === 'up' ? -1 : 1;
    const rows = await Banner.find().sort({ order: 1, createdAt: 1 });
    const i = rows.findIndex((r) => String(r._id) === id);
    if (i < 0) throw notFound('Card not found');
    const j = i + dir;
    if (j >= 0 && j < rows.length) {
      [rows[i], rows[j]] = [rows[j]!, rows[i]!];
      await Banner.bulkWrite(rows.map((r, order) => ({ updateOne: { filter: { _id: r._id }, update: { order } } })));
    }
    const fresh = await Banner.find().sort({ order: 1, createdAt: 1 });
    res.json({ cards: fresh.map((b) => toDTO(asDoc(b))) });
  }),
);

bannersRouter.put(
  '/admin/banners/:id',
  validate(promoCardSchema),
  wrap(async (req, res) => {
    const body = req.body as PromoCardInput;
    const current = await Banner.findById(idOf(req.params.id));
    if (!current) throw notFound('Card not found');
    current.set({ ...body, subtitle: body.subtitle || null, offer: body.offer || null, tagline: body.tagline || null, category: body.category || null, color: body.color || null });
    // choosing a ready photo replaces any uploaded one
    if (current.hasUpload && !body.image.startsWith('/api/')) {
      current.hasUpload = false;
      await BannerImage.deleteOne({ bannerId: current._id });
    }
    await current.save();
    res.json({ card: toDTO(asDoc(current)) });
  }),
);

bannersRouter.delete(
  '/admin/banners/:id',
  wrap(async (req, res) => {
    const id = idOf(req.params.id);
    const gone = await Banner.findByIdAndDelete(id);
    if (!gone) throw notFound('Card not found');
    await BannerImage.deleteOne({ bannerId: id });
    res.status(204).end();
  }),
);

// The body is the raw photo (Content-Type image/jpeg, image/png or image/webp).
bannersRouter.put(
  '/admin/banners/:id/image',
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: MAX_IMAGE_BYTES }),
  wrap(async (req, res) => {
    const card = await Banner.findById(idOf(req.params.id));
    if (!card) throw notFound('Card not found');
    const type = req.get('content-type')?.split(';')[0]?.trim() ?? '';
    const body = req.body as unknown;
    if (!Buffer.isBuffer(body) || body.length === 0) throw new HttpError(415, 'BAD_IMAGE', 'Upload a JPEG, PNG or WebP photo');
    if (!matchesType(body, type)) throw new HttpError(415, 'BAD_IMAGE', 'That file is not a valid photo');
    await BannerImage.findOneAndUpdate({ bannerId: card._id }, { contentType: type, data: body }, { upsert: true });
    card.hasUpload = true;
    card.image = `/api/v1/banners/${card._id}/image`;
    await card.save();
    res.json({ card: toDTO(asDoc(card)) });
  }),
);

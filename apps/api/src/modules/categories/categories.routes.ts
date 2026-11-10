import express, { Router } from 'express';
import mongoose from 'mongoose';
import { DEFAULT_CATEGORY_TILES, categoryTileSchema, type CategoryTileDTO, type CategoryTileInput } from '@offerbuzz/shared';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/async';
import { HttpError, notFound } from '../../utils/errors';
import { CategoryTile, CategoryTileImage, type CategoryTileDoc } from '../../models/CategoryTile';

export const categoriesRouter = Router();

const MAX_IMAGE_BYTES = 600 * 1024;

function toDTO(t: CategoryTileDoc): CategoryTileDTO {
  return {
    id: String(t._id),
    name: t.name,
    // the stamp in the address makes browsers fetch a replaced photo instead of the cached one
    image: t.hasUpload ? `/api/v1/home-categories/${t._id}/image?v=${t.updatedAt.getTime()}` : t.image,
    category: t.category || undefined,
    active: t.active,
    order: t.order,
  };
}

function matchesType(buf: Buffer, type: string): boolean {
  if (type === 'image/jpeg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (type === 'image/png') return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === 'image/webp') return buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  return false;
}

const idOf = (v: unknown) => {
  const id = String(v);
  if (!mongoose.isValidObjectId(id)) throw notFound('Category not found');
  return id;
};
const asDoc = (t: unknown) => t as CategoryTileDoc;

// ---- Public: what the home page shows ----------------------------------------------------------------------
categoriesRouter.get(
  '/home-categories',
  wrap(async (_req, res) => {
    const rows = await CategoryTile.find({ active: true }).sort({ order: 1, createdAt: 1 });
    res.set('cache-control', 'public, max-age=60');
    res.json({ categories: rows.map((t) => toDTO(asDoc(t))) });
  }),
);

categoriesRouter.get(
  '/home-categories/:id/image',
  wrap(async (req, res) => {
    const image = await CategoryTileImage.findOne({ tileId: idOf(req.params.id) });
    if (!image) throw notFound('Photo not found');
    res.set({ 'content-type': image.contentType, 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' });
    res.send(image.data);
  }),
);

// ---- Admin ---------------------------------------------------------------------------------------------------
categoriesRouter.use('/admin/home-categories', authenticate, requireRole('admin'));

categoriesRouter.get(
  '/admin/home-categories',
  wrap(async (_req, res) => {
    const rows = await CategoryTile.find().sort({ order: 1, createdAt: 1 });
    res.json({ categories: rows.map((t) => toDTO(asDoc(t))) });
  }),
);

categoriesRouter.post(
  '/admin/home-categories',
  validate(categoryTileSchema),
  wrap(async (req, res) => {
    const last = await CategoryTile.findOne().sort({ order: -1 }).select('order');
    const t = await CategoryTile.create({ ...(req.body as CategoryTileInput), order: (last?.order ?? -1) + 1 });
    res.status(201).json({ category: toDTO(asDoc(t)) });
  }),
);

// loads the tiles the site shipped with, so the admin has something to edit (only when there are none yet)
categoriesRouter.post(
  '/admin/home-categories/seed-defaults',
  wrap(async (_req, res) => {
    if (await CategoryTile.exists({})) throw new HttpError(409, 'ALREADY_HAS_CATEGORIES', 'There are already categories, edit those instead');
    const rows = await CategoryTile.insertMany(DEFAULT_CATEGORY_TILES.map((c, order) => ({ ...c, order, active: true })));
    res.status(201).json({ categories: rows.map((t) => toDTO(asDoc(t))) });
  }),
);

categoriesRouter.post(
  '/admin/home-categories/:id/move',
  wrap(async (req, res) => {
    const id = idOf(req.params.id);
    const wanted = Number(req.body?.position); // 1-based place to move the tile to
    const dir = req.body?.direction === 'up' ? -1 : 1;
    const rows = await CategoryTile.find().sort({ order: 1, createdAt: 1 });
    const i = rows.findIndex((r) => String(r._id) === id);
    if (i < 0) throw notFound('Category not found');
    const j = Number.isInteger(wanted) && wanted >= 1 ? Math.min(wanted, rows.length) - 1 : i + dir;
    if (j >= 0 && j < rows.length && j !== i) {
      const [moved] = rows.splice(i, 1);
      rows.splice(j, 0, moved!);
      await CategoryTile.bulkWrite(rows.map((r, order) => ({ updateOne: { filter: { _id: r._id }, update: { order } } })));
    }
    const fresh = await CategoryTile.find().sort({ order: 1, createdAt: 1 });
    res.json({ categories: fresh.map((t) => toDTO(asDoc(t))) });
  }),
);

categoriesRouter.put(
  '/admin/home-categories/:id',
  validate(categoryTileSchema),
  wrap(async (req, res) => {
    const body = req.body as CategoryTileInput;
    const current = await CategoryTile.findById(idOf(req.params.id));
    if (!current) throw notFound('Category not found');
    current.set({ ...body, category: body.category || null });
    // choosing a ready photo replaces any uploaded one
    if (current.hasUpload && !body.image.startsWith('/api/')) {
      current.hasUpload = false;
      await CategoryTileImage.deleteOne({ tileId: current._id });
    }
    await current.save();
    res.json({ category: toDTO(asDoc(current)) });
  }),
);

categoriesRouter.delete(
  '/admin/home-categories/:id',
  wrap(async (req, res) => {
    const id = idOf(req.params.id);
    const gone = await CategoryTile.findByIdAndDelete(id);
    if (!gone) throw notFound('Category not found');
    await CategoryTileImage.deleteOne({ tileId: id });
    res.status(204).end();
  }),
);

// The body is the raw photo (Content-Type image/jpeg, image/png or image/webp).
categoriesRouter.put(
  '/admin/home-categories/:id/image',
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: MAX_IMAGE_BYTES }),
  wrap(async (req, res) => {
    const tile = await CategoryTile.findById(idOf(req.params.id));
    if (!tile) throw notFound('Category not found');
    const type = req.get('content-type')?.split(';')[0]?.trim() ?? '';
    const body = req.body as unknown;
    if (!Buffer.isBuffer(body) || body.length === 0) throw new HttpError(415, 'BAD_IMAGE', 'Upload a JPEG, PNG or WebP photo');
    if (!matchesType(body, type)) throw new HttpError(415, 'BAD_IMAGE', 'That file is not a valid photo');
    await CategoryTileImage.findOneAndUpdate({ tileId: tile._id }, { contentType: type, data: body }, { upsert: true });
    tile.hasUpload = true;
    tile.image = `/api/v1/home-categories/${tile._id}/image`;
    await tile.save();
    res.json({ category: toDTO(asDoc(tile)) });
  }),
);

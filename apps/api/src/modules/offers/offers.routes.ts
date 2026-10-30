import express, { Router } from 'express';
import mongoose from 'mongoose';
import {
  CATEGORIES,
  nearbyQuerySchema,
  searchQuerySchema,
  suggestQuerySchema,
  type SearchQuery,
  type SuggestQuery,
  type SuggestResponse,
  offerInputSchema,
  type MyOffersResponse,
  type NearbyOffersResponse,
  type NearbyQuery,
  type OfferDTO,
  type OfferInput,
  type PublicOfferDTO,
} from '@offerbuzz/shared';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/async';
import { HttpError, notFound } from '../../utils/errors';
import { User, type UserDoc } from '../../models/User';
import { toLocationDTO } from '../auth/auth.service';
import { Offer, type OfferDoc } from '../../models/Offer';
import { OfferImage } from '../../models/OfferImage';

export const offersRouter = Router();

const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

export function toOfferDTO(o: OfferDoc): OfferDTO {
  const today = dateOnly(new Date());
  return {
    id: String(o._id),
    title: o.title,
    description: o.description,
    category: o.category,
    discountType: o.discountType,
    discountValue: o.discountValue ?? undefined,
    startsAt: dateOnly(o.startsAt),
    endsAt: dateOnly(o.endsAt),
    area: o.area,
    terms: o.terms ?? undefined,
    // an approved offer past its end date reads as expired without needing a background job
    status: o.status === 'active' && dateOnly(o.endsAt) < today ? 'expired' : o.status,
    views: o.views,
    claims: o.claims,
    createdAt: o.createdAt.toISOString(),
    ...(o.hasImage ? { imageUrl: `/api/v1/offers/${o._id}/image` } : {}),
  };
}

const vendorOnly = [authenticate, requireRole('merchant')];

offersRouter.post(
  '/offers',
  ...vendorOnly,
  validate(offerInputSchema),
  wrap(async (req, res) => {
    const b = req.body as OfferInput;
    // a shop only posts into the category it chose at sign up
    const vendor = await User.findById(req.auth!.id).select('category location');
    if (!vendor?.category) {
      throw new HttpError(409, 'CATEGORY_REQUIRED', 'Choose your shop category in your profile before posting offers');
    }
    if (b.category !== vendor.category) {
      throw new HttpError(400, 'CATEGORY_MISMATCH', `Your shop posts offers in ${vendor.category} only`);
    }
    if (!vendor.location?.coordinates?.length) {
      throw new HttpError(409, 'LOCATION_REQUIRED', 'Share your shop location in your profile before posting offers');
    }
    const offer = await Offer.create({
      merchantId: req.auth!.id,
      title: b.title,
      description: b.description,
      category: b.category,
      discountType: b.discountType,
      discountValue: b.discountType === 'deal' ? undefined : b.discountValue,
      startsAt: new Date(`${b.startsAt}T00:00:00.000Z`),
      endsAt: new Date(`${b.endsAt}T00:00:00.000Z`),
      area: b.area,
      terms: b.terms || undefined,
    });
    res.status(201).json({ offer: toOfferDTO(offer) });
  }),
);

offersRouter.get(
  '/offers/mine',
  ...vendorOnly,
  wrap(async (req, res) => {
    const docs = await Offer.find({ merchantId: req.auth!.id }).sort({ createdAt: -1 }).limit(200);
    const offers = docs.map(toOfferDTO);
    const body: MyOffersResponse = {
      offers,
      totals: {
        offers: offers.length,
        pending: offers.filter((o) => o.status === 'pending').length,
        active: offers.filter((o) => o.status === 'active').length,
        views: offers.reduce((n, o) => n + o.views, 0),
        claims: offers.reduce((n, o) => n + o.claims, 0),
      },
    };
    res.json(body);
  }),
);

// ---- Public: what customers see -------------------------------------------------------------------

const startOfToday = () => new Date(`${dateOnly(new Date())}T00:00:00.000Z`);

/** Offers that are approved and inside their dates, with the shop that posted them. */
function toPublicOffer(o: OfferDoc, vendor: Pick<UserDoc, 'name' | 'shopName' | 'location' | 'locationAddress' | 'placeId'>, distanceM?: number): PublicOfferDTO | undefined {
  const location = toLocationDTO(vendor);
  if (!location) return undefined;
  return {
    ...toOfferDTO(o),
    shop: { name: vendor.shopName || vendor.name || 'Shop', location },
    ...(distanceM === undefined ? {} : { distanceKm: Math.round(distanceM / 10) / 100 }),
  };
}

// Customers near a point, closest shop first. Uses the 2dsphere index on the vendor's pin ($geoNear), so no Google
// Distance Matrix and no per-request geocoding.
offersRouter.get(
  '/offers/nearby',
  validate(nearbyQuerySchema, 'query'),
  wrap(async (req, res) => {
    const q = req.query as unknown as NearbyQuery;
    const today = startOfToday();
    const rows = await User.aggregate<{ vendor: UserDoc; offer: OfferDoc; distanceM: number }>([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [q.lng, q.lat] },
          distanceField: 'distanceM',
          maxDistance: q.radiusKm * 1000,
          spherical: true,
          query: { role: 'merchant', status: 'active' },
        },
      },
      {
        $lookup: {
          from: 'offers',
          let: { id: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$merchantId', '$$id'] }, status: 'active', startsAt: { $lte: today }, endsAt: { $gte: today } } },
          ],
          as: 'offers',
        },
      },
      { $unwind: '$offers' },
      { $sort: { distanceM: 1, 'offers.createdAt': -1 } },
      { $limit: q.limit },
      { $project: { distanceM: 1, offer: '$offers', vendor: { name: '$name', shopName: '$shopName', location: '$location', locationAddress: '$locationAddress', placeId: '$placeId' } } },
    ]);
    const offers = rows.flatMap((r) => toPublicOffer(r.offer, r.vendor, r.distanceM) ?? []);
    const body: NearbyOffersResponse = { offers };
    res.set('cache-control', 'public, max-age=60');
    res.json(body);
  }),
);

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Straight line distance in metres between two points. */
function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(bLat - aLat) / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

const liveWindow = () => {
  const today = startOfToday();
  return { status: 'active' as const, startsAt: { $lte: today }, endsAt: { $gte: today } };
};

// What to show under the search box while typing: matching categories, shops and live offers.
offersRouter.get(
  '/search/suggest',
  validate(suggestQuerySchema, 'query'),
  wrap(async (req, res) => {
    const { q } = req.query as unknown as SuggestQuery;
    const rx = new RegExp(escapeRegex(q), 'i');
    const [shops, offers] = await Promise.all([
      User.find({ role: 'merchant', status: 'active', shopName: rx, 'location.coordinates.0': { $exists: true } }).select('shopName').limit(4),
      Offer.find({ ...liveWindow(), title: rx }).select('title merchantId').sort({ createdAt: -1 }).limit(5),
    ]);
    const owners = await User.find({ _id: { $in: offers.map((o) => o.merchantId) } }).select('shopName name');
    const ownerName = new Map(owners.map((u) => [String(u._id), u.shopName || u.name || 'Shop']));
    const body: SuggestResponse = {
      categories: CATEGORIES.filter((c) => rx.test(c)).slice(0, 4),
      shops: shops.map((u) => ({ id: String(u._id), name: u.shopName as string })),
      offers: offers.map((o) => ({ id: String(o._id), title: o.title, shop: ownerName.get(String(o.merchantId)) ?? 'Shop' })),
    };
    res.set('cache-control', 'public, max-age=30');
    res.json(body);
  }),
);

// Full results for a search or a category. With lat/lng the nearest shops come first, otherwise the newest offers.
offersRouter.get(
  '/offers/search',
  validate(searchQuerySchema, 'query'),
  wrap(async (req, res) => {
    const q = req.query as unknown as SearchQuery;
    const filter: Record<string, unknown> = { ...liveWindow() };
    if (q.category) filter.category = q.category;
    if (q.q) {
      const rx = new RegExp(escapeRegex(q.q), 'i');
      const shopIds = await User.find({ role: 'merchant', status: 'active', shopName: rx }).select('_id').limit(50);
      filter.$or = [{ title: rx }, { description: rx }, { category: rx }, { area: rx }, { merchantId: { $in: shopIds.map((u) => u._id) } }];
    }
    const docs = await Offer.find(filter).sort({ createdAt: -1 }).limit(200);
    const vendors = await User.find({ _id: { $in: docs.map((o) => o.merchantId) }, status: 'active' }).select('name shopName location locationAddress placeId');
    const byId = new Map(vendors.map((v) => [String(v._id), v]));
    const here = q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : undefined;
    const offers = docs
      .flatMap((o) => {
        const v = byId.get(String(o.merchantId));
        const c = v?.location?.coordinates;
        if (!v || !c) return [];
        const dto = toPublicOffer(o, v, here ? distanceM(here.lat, here.lng, c[1], c[0]) : undefined);
        return dto ? [dto] : [];
      })
      // newest first from the query above; with a location the nearest shops come first (sort is stable)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, q.limit);
    const body: NearbyOffersResponse = { offers };
    res.json(body);
  }),
);

// The customer's saved offers: live ones only, in the order requested. Not counted as views.
offersRouter.get(
  '/offers/by-ids',
  wrap(async (req, res) => {
    const ids = String(req.query.ids ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s, i, all) => mongoose.isValidObjectId(s) && all.indexOf(s) === i)
      .slice(0, 50);
    const docs = ids.length ? await Offer.find({ _id: { $in: ids }, ...liveWindow() }) : [];
    const vendors = await User.find({ _id: { $in: docs.map((o) => o.merchantId) }, status: 'active' }).select('name shopName location locationAddress placeId');
    const byId = new Map(vendors.map((v) => [String(v._id), v]));
    const byOffer = new Map(docs.map((o) => [String(o._id), o]));
    const offers = ids.flatMap((id) => {
      const o = byOffer.get(id);
      const v = o && byId.get(String(o.merchantId));
      const dto = o && v ? toPublicOffer(o, v) : undefined;
      return dto ? [dto] : [];
    });
    const body: NearbyOffersResponse = { offers };
    res.json(body);
  }),
);

offersRouter.get(
  '/offers/:id',
  wrap(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) throw notFound('Offer not found');
    const today = startOfToday();
    const offer = await Offer.findOneAndUpdate(
      { _id: id, status: 'active', startsAt: { $lte: today }, endsAt: { $gte: today } },
      { $inc: { views: 1 } },
      { new: true },
    );
    if (!offer) throw notFound('Offer not found');
    const vendor = await User.findById(offer.merchantId).select('name shopName location locationAddress placeId');
    const dto = vendor && toPublicOffer(offer, vendor);
    if (!dto) throw notFound('Offer not found');
    res.json({ offer: dto });
  }),
);

offersRouter.delete(
  '/offers/:id',
  ...vendorOnly,
  wrap(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) throw notFound('Offer not found');
    const removed = await Offer.findOneAndDelete({ _id: id, merchantId: req.auth!.id });
    if (!removed) throw notFound('Offer not found');
    await OfferImage.deleteOne({ offerId: id });
    res.status(204).end();
  }),
);

// ---- Offer photo ---------------------------------------------------------------------------------

const MAX_IMAGE_BYTES = 400 * 1024;

/** The first bytes of the file must really be the image type it claims, so nothing else is stored or served as an image. */
function matchesType(buf: Buffer, type: string): boolean {
  if (type === 'image/jpeg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (type === 'image/png') return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === 'image/webp') return buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  return false;
}

// The body is the raw image (Content-Type image/jpeg, image/png or image/webp). The global JSON parser ignores these types.
offersRouter.put(
  '/offers/:id/image',
  ...vendorOnly,
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: MAX_IMAGE_BYTES }),
  wrap(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) throw notFound('Offer not found');
    const offer = await Offer.findOne({ _id: id, merchantId: req.auth!.id });
    if (!offer) throw notFound('Offer not found');
    const type = req.get('content-type')?.split(';')[0]?.trim() ?? '';
    const body = req.body as unknown;
    if (!Buffer.isBuffer(body) || body.length === 0) throw new HttpError(415, 'BAD_IMAGE', 'Upload a JPEG, PNG or WebP photo');
    if (!matchesType(body, type)) throw new HttpError(415, 'BAD_IMAGE', 'That file is not a valid photo');
    await OfferImage.findOneAndUpdate({ offerId: offer._id }, { contentType: type, data: body }, { upsert: true });
    offer.hasImage = true;
    await offer.save();
    res.json({ offer: toOfferDTO(offer) });
  }),
);

// Public: offer photos are shown to every visitor once the offer is live, and are not secret.
offersRouter.get(
  '/offers/:id/image',
  wrap(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) throw notFound('Photo not found');
    const image = await OfferImage.findOne({ offerId: id });
    if (!image) throw notFound('Photo not found');
    res.set({ 'content-type': image.contentType, 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' });
    res.send(image.data);
  }),
);

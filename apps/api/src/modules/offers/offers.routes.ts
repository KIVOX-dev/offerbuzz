import { Router } from 'express';
import mongoose from 'mongoose';
import { offerInputSchema, type MyOffersResponse, type OfferDTO, type OfferInput } from '@offerbuzz/shared';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/async';
import { notFound } from '../../utils/errors';
import { Offer, type OfferDoc } from '../../models/Offer';

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
  };
}

const vendorOnly = [authenticate, requireRole('merchant')];

offersRouter.post(
  '/offers',
  ...vendorOnly,
  validate(offerInputSchema),
  wrap(async (req, res) => {
    const b = req.body as OfferInput;
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

offersRouter.delete(
  '/offers/:id',
  ...vendorOnly,
  wrap(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) throw notFound('Offer not found');
    const removed = await Offer.findOneAndDelete({ _id: id, merchantId: req.auth!.id });
    if (!removed) throw notFound('Offer not found');
    res.status(204).end();
  }),
);

import { Schema, model, type InferSchemaType } from 'mongoose';
import { CATEGORIES, DISCOUNT_TYPES, OFFER_STATUSES } from '@offerbuzz/shared';

const offerSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    discountType: { type: String, enum: DISCOUNT_TYPES, required: true },
    discountValue: Number,
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true, index: true },
    area: { type: String, required: true, trim: true },
    terms: { type: String, trim: true },
    // new offers wait for admin approval before they show to customers
    status: { type: String, enum: OFFER_STATUSES, default: 'pending', index: true },
    // set once the vendor has been emailed that the offer is about to end, so it is never sent twice
    expiryNoticeSentAt: Date,
    // where this offer can be redeemed: the shop's pin by default, or another spot the vendor chose (a second branch)
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },
    },
    address: String,
    placeId: String,
    hasImage: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    claims: { type: Number, default: 0 },
  },
  { timestamps: true },
);

offerSchema.index({ location: '2dsphere' });

export type OfferDoc = InferSchemaType<typeof offerSchema> & { _id: import('mongoose').Types.ObjectId; createdAt: Date };
export const Offer = model('Offer', offerSchema);

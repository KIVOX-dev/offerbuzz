import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { CATEGORIES, PROMO_THEMES } from '@offerbuzz/shared';

/** A home page promo card, edited by the admin. Lower `order` shows first. */
const bannerSchema = new Schema(
  {
    // an image-only card has no headline
    title: { type: String, default: '', maxlength: 40 },
    subtitle: { type: String, maxlength: 24 },
    offer: { type: String, maxlength: 24 },
    tagline: { type: String, maxlength: 60 },
    burst: { type: [String], default: [] },
    color: { type: String, match: /^#[0-9a-fA-F]{6}$/ },
    theme: { type: String, enum: PROMO_THEMES, required: true },
    image: { type: String, required: true },
    category: { type: String, enum: CATEGORIES },
    imageOnly: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
    /** an uploaded photo is stored in BannerImage and served from the API */
    hasUpload: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type BannerDoc = InferSchemaType<typeof bannerSchema> & { _id: Types.ObjectId; updatedAt: Date };
export const Banner = model('Banner', bannerSchema);

const bannerImageSchema = new Schema(
  {
    bannerId: { type: Schema.Types.ObjectId, ref: 'Banner', required: true, unique: true },
    contentType: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp'], required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);
export const BannerImage = model('BannerImage', bannerImageSchema);

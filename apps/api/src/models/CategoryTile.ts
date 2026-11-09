import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { CATEGORIES } from '@offerbuzz/shared';

/** A "Shop by Category" tile on the home page, edited by the admin. Lower `order` shows first. */
const tileSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 40 },
    image: { type: String, required: true },
    category: { type: String, enum: CATEGORIES },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
    /** an uploaded photo is stored in CategoryTileImage and served from the API */
    hasUpload: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type CategoryTileDoc = InferSchemaType<typeof tileSchema> & { _id: Types.ObjectId; updatedAt: Date };
export const CategoryTile = model('CategoryTile', tileSchema);

const tileImageSchema = new Schema(
  {
    tileId: { type: Schema.Types.ObjectId, ref: 'CategoryTile', required: true, unique: true },
    contentType: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp'], required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);
export const CategoryTileImage = model('CategoryTileImage', tileImageSchema);

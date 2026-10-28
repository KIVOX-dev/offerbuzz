import { Schema, model } from 'mongoose';

/**
 * One photo per offer, kept in the database for now (the website shrinks it to under 400 KB before upload).
 * Move to object storage such as Backblaze B2 when volume grows; the URL the site uses would not change.
 */
const offerImageSchema = new Schema(
  {
    offerId: { type: Schema.Types.ObjectId, ref: 'Offer', required: true, unique: true },
    contentType: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp'], required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

export const OfferImage = model('OfferImage', offerImageSchema);

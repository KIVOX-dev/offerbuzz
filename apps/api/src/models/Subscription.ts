import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * One row per vendor: the paid plan runs until `paidUntil`. Payments (Razorpay, or the admin recording one) extend it.
 * Each paid month allows OFFERS_PER_MONTH offers: `periodStart` is when the current unbroken paid run began, so month
 * windows are periodStart + 0, 1, 2... months. `quotaWindowStart` / `quotaUsed` count the offers posted in the current
 * window. It is a counter, not a count of live offers, so deleting an offer does not give the slot back.
 */
const subscriptionSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    paidUntil: { type: Date, required: true, index: true },
    plan: { type: String, enum: ['basic', 'premium', 'featured'], default: 'basic' },
    lastPaidAt: { type: Date, required: true },
    periodStart: Date,
    quotaWindowStart: Date,
    quotaUsed: { type: Number, default: 0 },
    // the paidUntil date the "ending soon" email was already sent for, so it is sent once per end date
    endingNoticeFor: Date,
  },
  { timestamps: true },
);

export type SubscriptionDoc = InferSchemaType<typeof subscriptionSchema> & { _id: import('mongoose').Types.ObjectId };
export const Subscription = model('Subscription', subscriptionSchema);

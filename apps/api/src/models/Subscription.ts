import { Schema, model, type InferSchemaType } from 'mongoose';

/** One row per vendor: the paid plan runs until `paidUntil`. Payments extend it (admin records them until a gateway exists). */
const subscriptionSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    paidUntil: { type: Date, required: true, index: true },
    lastPaidAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export type SubscriptionDoc = InferSchemaType<typeof subscriptionSchema> & { _id: import('mongoose').Types.ObjectId };
export const Subscription = model('Subscription', subscriptionSchema);

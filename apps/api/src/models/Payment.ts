import { Schema, model, type InferSchemaType } from 'mongoose';
import { MERCHANT_PLAN_KEYS } from '@offerbuzz/shared';

/** One row per Razorpay order. `processing` is held only while the plan is being extended, so a payment is applied once. */
const paymentSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: MERCHANT_PLAN_KEYS, required: true },
    months: { type: Number, required: true },
    /** paise */
    amount: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, sparse: true, unique: true },
    status: { type: String, enum: ['created', 'processing', 'paid'], default: 'created', index: true },
    paidAt: Date,
  },
  { timestamps: true },
);

export type PaymentDoc = InferSchemaType<typeof paymentSchema> & { _id: import('mongoose').Types.ObjectId };
export const Payment = model('Payment', paymentSchema);

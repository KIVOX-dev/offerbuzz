import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * Append-only ledger for an intermediary wallet (1 credit = Rs 1). Balances are always computed from
 * these rows, never stored, so they cannot drift.
 */
const walletEntrySchema = new Schema(
  {
    intermediaryId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'User' },
    kind: { type: String, enum: ['credit', 'debit'], required: true },
    reason: { type: String, enum: ['subscription', 'payout', 'adjustment'], required: true },
    credits: { type: Number, required: true, min: 0 },
    /** billing month this credit is for, YYYY-MM; makes a subscription credit idempotent */
    period: String,
    /** credits can be withdrawn only from this moment on (the hold period) */
    availableAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// one commission per referred shop per billing month, even if the payment event is delivered twice
walletEntrySchema.index(
  { merchantId: 1, period: 1 },
  { unique: true, partialFilterExpression: { reason: 'subscription' } },
);

export type WalletEntryDoc = InferSchemaType<typeof walletEntrySchema> & { _id: import('mongoose').Types.ObjectId; createdAt: Date };
export const WalletEntry = model('WalletEntry', walletEntrySchema);

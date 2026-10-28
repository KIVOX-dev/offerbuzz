import { Schema, model, type InferSchemaType } from 'mongoose';
import { PAYOUT_STATUSES } from '@offerbuzz/shared';

const payoutRequestSchema = new Schema(
  {
    intermediaryId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    credits: { type: Number, required: true, min: 1 },
    status: { type: String, enum: PAYOUT_STATUSES, default: 'pending', index: true },
    note: String,
    processedAt: Date,
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// one waiting request per intermediary at a time (also stops a double click creating two)
payoutRequestSchema.index({ intermediaryId: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

export type PayoutRequestDoc = InferSchemaType<typeof payoutRequestSchema> & {
  _id: import('mongoose').Types.ObjectId;
  createdAt: Date;
};
export const PayoutRequest = model('PayoutRequest', payoutRequestSchema);

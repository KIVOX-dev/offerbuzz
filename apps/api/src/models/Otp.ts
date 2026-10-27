import { Schema, model } from 'mongoose';

const otpSchema = new Schema(
  {
    identifier: { type: String, required: true, unique: true }, // +91... or email
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL cleanup

export const Otp = model('Otp', otpSchema);

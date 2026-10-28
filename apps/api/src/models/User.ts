import { Schema, model, type InferSchemaType } from 'mongoose';
import { ROLES, USER_STATUSES } from '@offerbuzz/shared';

const userSchema = new Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true, index: true },
    googleId: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, select: false }, // admin accounts only
    role: { type: String, enum: ROLES, required: true, index: true },
    referralCode: { type: String, required: true, unique: true },
    shopName: { type: String, trim: true },
    city: { type: String, trim: true },
    qrUrl: String, // filled in by the QR service in Phase 5
    status: { type: String, enum: USER_STATUSES, default: 'active', index: true },
    fcmTokens: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: import('mongoose').Types.ObjectId };
export const User = model('User', userSchema);

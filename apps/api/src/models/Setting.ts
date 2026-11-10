import { Schema, model } from 'mongoose';
import { DEFAULT_SETTINGS } from '@offerbuzz/shared';

/** Singleton document (key = "global"). Business numbers live here, editable by the admin. */
const settingSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true },
    commissionPercent: { type: Number, default: DEFAULT_SETTINGS.commissionPercent },
    holdDays: { type: Number, default: DEFAULT_SETTINGS.holdDays },
    payoutThreshold: { type: Number, default: DEFAULT_SETTINGS.payoutThreshold },
    graceDays: { type: Number, default: DEFAULT_SETTINGS.graceDays },
  },
  { timestamps: true },
);

export const Setting = model('Setting', settingSchema);

export async function getSettings() {
  return Setting.findOneAndUpdate({ key: 'global' }, { $setOnInsert: { key: 'global' } }, { upsert: true, new: true });
}

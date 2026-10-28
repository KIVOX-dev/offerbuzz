import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * Anonymous site traffic. `Visit` is one row per visitor per day (so unique visitors can be counted) and `PageHit`
 * is one row per page per day. The visitor id is a random value the browser makes up; it holds no personal data.
 * Days are India time (YYYY-MM-DD).
 */
const visitSchema = new Schema(
  {
    day: { type: String, required: true },
    visitorId: { type: String, required: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);
visitSchema.index({ day: 1, visitorId: 1 }, { unique: true });

const pageHitSchema = new Schema({
  day: { type: String, required: true },
  path: { type: String, required: true },
  views: { type: Number, default: 0 },
});
pageHitSchema.index({ day: 1, path: 1 }, { unique: true });

export type VisitDoc = InferSchemaType<typeof visitSchema>;
export const Visit = model('Visit', visitSchema);
export const PageHit = model('PageHit', pageHitSchema);

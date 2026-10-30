import { Offer } from '../models/Offer';
import { User } from '../models/User';

/**
 * Offers posted before offers carried their own location get their shop's pin copied onto them, so the nearby search
 * (which looks at the offers directly) finds them. Safe to run on every start: it only touches offers without one.
 */
export async function backfillOfferLocations(): Promise<number> {
  const vendors = await User.find({ role: 'merchant', 'location.coordinates.0': { $exists: true } }).select('location locationAddress placeId');
  let changed = 0;
  for (const v of vendors) {
    const res = await Offer.updateMany(
      { merchantId: v._id, 'location.coordinates.0': { $exists: false } },
      { $set: { location: v.location, address: v.locationAddress, placeId: v.placeId } },
    );
    changed += res.modifiedCount;
  }
  return changed;
}

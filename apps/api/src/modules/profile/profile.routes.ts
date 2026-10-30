import { Router } from 'express';
import { updateProfileSchema, type UpdateProfileInput } from '@offerbuzz/shared';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/async';
import { HttpError, notFound } from '../../utils/errors';
import { reverseGeocode } from '../../services/geocode';
import { User } from '../../models/User';
import { toUserDTO } from '../auth/auth.service';

export const profileRouter = Router();

/** Edit your own profile. Email and role are never changed from here. */
profileRouter.put(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  wrap(async (req, res) => {
    const b = req.body as UpdateProfileInput;
    const user = await User.findById(req.auth!.id).select('+passwordHash');
    if (!user) throw notFound('User not found');
    if (b.name !== undefined) user.name = b.name;
    if (b.shopName !== undefined) user.shopName = b.shopName || undefined;
    if (b.category !== undefined && b.category !== user.category) {
      if (user.role !== 'merchant') throw new HttpError(400, 'NOT_A_VENDOR', 'Only vendors have a shop category');
      if (user.category) throw new HttpError(409, 'CATEGORY_LOCKED', 'Your shop category is already set. Contact support to change it.');
      user.category = b.category;
    }
    if (b.location) {
      if (user.role !== 'merchant') throw new HttpError(400, 'NOT_A_VENDOR', 'Only vendors have a shop location');
      const { lat, lng } = b.location;
      const current = user.location?.coordinates;
      const moved = !current || current[0] !== lng || current[1] !== lat;
      let address = b.location.address || undefined;
      let placeId = b.location.placeId || undefined;
      if (!address && !moved) {
        // same pin saved again: keep the cached address instead of asking Google
        address = user.locationAddress ?? undefined;
        placeId = user.placeId ?? undefined;
      } else if (!address) {
        // a dragged pin or "use my location" has no address yet: look it up once, now, and store it
        ({ address, placeId } = await reverseGeocode(lat, lng));
      }
      user.location = { type: 'Point', coordinates: [lng, lat] };
      user.locationAddress = address;
      user.placeId = placeId;
    }
    if (b.city !== undefined) user.city = b.city || undefined;
    if (b.phone !== undefined) {
      if (b.phone === '') user.phone = undefined;
      else if (b.phone !== user.phone) {
        const taken = await User.exists({ phone: b.phone, _id: { $ne: user._id } });
        if (taken) throw new HttpError(409, 'PHONE_TAKEN', 'This phone number is already used by another account');
        user.phone = b.phone;
      }
    }
    await user.save();
    res.json({ user: { ...toUserDTO(user), hasPassword: Boolean(user.passwordHash) } });
  }),
);

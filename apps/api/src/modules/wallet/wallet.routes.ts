import { Router } from 'express';
import { payoutRequestSchema, referralCodeSchema } from '@offerbuzz/shared';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/async';
import { User } from '../../models/User';
import { getWallet, requestPayout } from './wallet.service';

export const walletRouter = Router();

walletRouter.get(
  '/wallet',
  authenticate,
  requireRole('intermediary'),
  wrap(async (req, res) => {
    res.json(await getWallet(req.auth!.id));
  }),
);

/** The intermediary asks to be paid all available credits. Needs the minimum (payoutThreshold) available. */
walletRouter.post(
  '/wallet/payout-request',
  authenticate,
  requireRole('intermediary'),
  validate(payoutRequestSchema),
  wrap(async (req, res) => {
    const p = await requestPayout(req.auth!.id, req.body);
    res.status(201).json({ id: String(p._id), credits: p.credits, status: p.status });
  }),
);

/** Public: lets the vendor signup form confirm a code and show who referred them. First name only. */
walletRouter.get(
  '/referral/:code',
  wrap(async (req, res) => {
    const code = referralCodeSchema.safeParse(req.params.code);
    const who = code.success
      ? await User.findOne({ referralCode: code.data, role: 'intermediary', status: { $ne: 'blocked' } }).select('name')
      : null;
    if (!who) return void res.json({ valid: false });
    res.json({ valid: true, name: who.name?.split(' ')[0] });
  }),
);

import { Router } from 'express';
import {
  adminOffersQuerySchema,
  adminUsersQuerySchema,
  recordPaymentSchema,
  rejectPayoutSchema,
  setOfferStatusSchema,
  setUserStatusSchema,
  type AdminOffersQuery,
  type AdminUsersQuery,
  type RecordPaymentInput,
  type RejectPayoutInput,
  type SetOfferStatusInput,
  type SetUserStatusInput,
} from '@offerbuzz/shared';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/async';
import { payPayout, rejectPayout } from '../wallet/wallet.service';
import { analytics } from '../analytics/analytics.service';
import * as svc from './admin.service';

export const adminRouter = Router();

// every admin route needs an admin token
adminRouter.use('/admin', authenticate, requireRole('admin'));

adminRouter.get('/admin/overview', wrap(async (_req, res) => void res.json(await svc.overview())));

adminRouter.get(
  '/admin/users',
  validate(adminUsersQuerySchema, 'query'),
  wrap(async (req, res) => {
    res.json(await svc.listUsers(req.query as unknown as AdminUsersQuery));
  }),
);

adminRouter.patch(
  '/admin/users/:id/status',
  validate(setUserStatusSchema),
  wrap(async (req, res) => {
    const user = await svc.setUserStatus(req.auth!.id, String(req.params.id), (req.body as SetUserStatusInput).status);
    res.json({ id: String(user._id), status: user.status });
  }),
);

adminRouter.post(
  '/admin/vendors/:id/payment',
  validate(recordPaymentSchema),
  wrap(async (req, res) => {
    res.json(await svc.recordSubscriptionPayment(String(req.params.id), (req.body as RecordPaymentInput).months));
  }),
);

adminRouter.get('/admin/wallets', wrap(async (_req, res) => void res.json(await svc.walletsOverview())));

adminRouter.post(
  '/admin/payouts/:id/pay',
  wrap(async (req, res) => {
    await payPayout(String(req.params.id), req.auth!.id);
    res.status(204).end();
  }),
);

adminRouter.post(
  '/admin/payouts/:id/reject',
  validate(rejectPayoutSchema),
  wrap(async (req, res) => {
    await rejectPayout(String(req.params.id), req.auth!.id, (req.body as RejectPayoutInput).note);
    res.status(204).end();
  }),
);

adminRouter.get(
  '/admin/offers',
  validate(adminOffersQuerySchema, 'query'),
  wrap(async (req, res) => {
    res.json(await svc.offersOverview(req.query as unknown as AdminOffersQuery));
  }),
);

adminRouter.patch(
  '/admin/offers/:id/status',
  validate(setOfferStatusSchema),
  wrap(async (req, res) => {
    const offer = await svc.setOfferStatus(String(req.params.id), (req.body as SetOfferStatusInput).status);
    res.json({ id: String(offer._id), status: offer.status });
  }),
);

adminRouter.get('/admin/analytics', wrap(async (_req, res) => void res.json(await analytics(14))));

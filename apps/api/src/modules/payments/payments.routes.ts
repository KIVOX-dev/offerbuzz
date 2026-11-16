import { Router } from 'express';
import { createOrderSchema, verifyPaymentSchema, type CreateOrderInput, type VerifyPaymentInput } from '@offerbuzz/shared';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/async';
import * as svc from './payments.service';

export const paymentsRouter = Router();

paymentsRouter.post(
  '/payments/create-order',
  authenticate,
  requireRole('merchant'),
  validate(createOrderSchema),
  wrap(async (req, res) => {
    res.status(201).json(await svc.createOrder(req.auth!.id, req.body as CreateOrderInput));
  }),
);

paymentsRouter.post(
  '/payments/verify',
  authenticate,
  requireRole('merchant'),
  validate(verifyPaymentSchema),
  wrap(async (req, res) => {
    res.json(await svc.verifyAndApply(req.auth!.id, req.body as VerifyPaymentInput));
  }),
);

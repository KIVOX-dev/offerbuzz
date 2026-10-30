import { Router } from 'express';
import {
  adminLoginSchema,
  googleSchema,
  passwordLoginSchema,
  refreshSchema,
  setPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
  type AdminLoginInput,
  type GoogleInput,
  type PasswordLoginInput,
  type RefreshInput,
  type SendOtpInput,
  type SetPasswordInput,
  type VerifyOtpInput,
} from '@offerbuzz/shared';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { loginLimiter, otpLimiter } from '../../middleware/rateLimit';
import { wrap } from '../../utils/async';
import { notFound } from '../../utils/errors';
import { User } from '../../models/User';
import * as svc from './auth.service';

export const authRouter = Router();

authRouter.post(
  '/auth/send-otp',
  otpLimiter(),
  validate(sendOtpSchema),
  wrap(async (req, res) => {
    const b = req.body as SendOtpInput;
    res.json(await svc.sendOtp(b.email, b.mode, b.role));
  }),
);

authRouter.post(
  '/auth/verify-otp',
  loginLimiter(),
  validate(verifyOtpSchema),
  wrap(async (req, res) => {
    res.json(await svc.verifyOtp(req.body as VerifyOtpInput));
  }),
);

authRouter.post(
  '/auth/google',
  loginLimiter(),
  validate(googleSchema),
  wrap(async (req, res) => {
    const b = req.body as GoogleInput;
    res.json(await svc.googleLogin(b.idToken, b.role));
  }),
);

// Diagnostic: shows which Google Client ID(s) the server is set up with (public values only).
authRouter.get('/auth/google/status', (_req, res) => {
  res.json(svc.googleSetupStatus());
});

// Unlisted: not linked from the role cards. Email + password for admin accounts only.
authRouter.post(
  '/auth/admin/login',
  loginLimiter(),
  validate(adminLoginSchema),
  wrap(async (req, res) => {
    const b = req.body as AdminLoginInput;
    res.json(await svc.adminLogin(b.email, b.password));
  }),
);

authRouter.post(
  '/auth/login',
  loginLimiter(),
  validate(passwordLoginSchema),
  wrap(async (req, res) => {
    const b = req.body as PasswordLoginInput;
    res.json(await svc.passwordLogin(b.email, b.password));
  }),
);

authRouter.post(
  '/auth/set-password',
  loginLimiter(),
  authenticate,
  validate(setPasswordSchema),
  wrap(async (req, res) => {
    await svc.setPassword(req.auth!.id, (req.body as SetPasswordInput).password);
    res.status(204).end();
  }),
);

authRouter.post(
  '/auth/refresh',
  loginLimiter(),
  validate(refreshSchema),
  wrap(async (req, res) => {
    res.json(await svc.refresh((req.body as RefreshInput).refreshToken));
  }),
);

authRouter.post(
  '/auth/logout',
  validate(refreshSchema),
  wrap(async (req, res) => {
    await svc.logout((req.body as RefreshInput).refreshToken);
    res.status(204).end();
  }),
);

authRouter.get(
  '/me',
  authenticate,
  wrap(async (req, res) => {
    const user = await User.findById(req.auth!.id);
    if (!user) throw notFound('User not found');
    res.json({ user: svc.toUserDTO(user) });
  }),
);

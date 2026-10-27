import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const make = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit: env().NODE_ENV === 'test' ? 10_000 : limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message } },
  });

// In-memory counters are per instance; swap in a Catalyst Cache store when scaling out (Phase 9).
export const generalLimiter = () => make(60_000, 300, 'Too many requests, slow down');
export const otpLimiter = () => make(15 * 60_000, 10, 'Too many code requests, try again later');
export const loginLimiter = () => make(15 * 60_000, 20, 'Too many login attempts, try again later');
export const webhookLimiter = () => make(60_000, 120, 'Too many webhook calls');

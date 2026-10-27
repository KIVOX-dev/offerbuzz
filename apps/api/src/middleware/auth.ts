import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@offerbuzz/shared';
import { env } from '../config/env';
import { forbidden, unauthorized } from '../utils/errors';

export interface AuthUser {
  id: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthUser;
  }
}

export const signAccessToken = (user: AuthUser): string =>
  jwt.sign({ role: user.role }, env().JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: env().JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'],
  });

/** Requires a valid access token. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(unauthorized());
  try {
    const payload = jwt.verify(header.slice(7), env().JWT_ACCESS_SECRET) as jwt.JwtPayload;
    req.auth = { id: String(payload.sub), role: payload.role as Role };
    next();
  } catch {
    next(unauthorized('Invalid or expired token', 'TOKEN_INVALID'));
  }
};

/** Role based access control. Always chain after `authenticate`. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.role)) return next(forbidden());
    next();
  };

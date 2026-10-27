import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from '../utils/errors';

/** Validates and replaces req.body (or query) with the parsed value. */
export const validate =
  (schema: ZodTypeAny, source: 'body' | 'query' = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new HttpError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input', result.error.issues),
      );
    }
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };

import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../utils/errors';
import { env } from '../config/env';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Malformed JSON body' } });
  }
  if (env().NODE_ENV !== 'test') console.error(err); // Sentry hooks in here in Phase 9
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
};

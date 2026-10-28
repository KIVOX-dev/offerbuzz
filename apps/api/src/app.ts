import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDb } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';
import { authRouter } from './modules/auth/auth.routes';
import { offersRouter } from './modules/offers/offers.routes';
import { profileRouter } from './modules/profile/profile.routes';
import { wrap } from './utils/async';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Cloudflare / Catalyst; needed for correct client IPs in rate limiting

  app.use(helmet());
  const origins = env().CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins, credentials: true }));
  // Webhook routes (Phase 4) mount BEFORE this with express.raw so signatures can be verified.
  app.use(express.json({ limit: '100kb' }));

  // Liveness: no DB call, so Docker HEALTHCHECK and UptimeRobot stay green during a DB blip.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'up' : 'down' });
  });

  app.use('/api/v1', generalLimiter());
  // Lazily (re)connect on first use; cheap no-op afterwards.
  app.use(
    '/api/v1',
    wrap(async (_req, _res, next) => {
      await connectDb();
      next();
    }),
  );
  app.use('/api/v1', authRouter);
  app.use('/api/v1', profileRouter);
  app.use('/api/v1', offersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

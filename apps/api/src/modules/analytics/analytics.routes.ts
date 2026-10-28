import { Router } from 'express';
import { wrap } from '../../utils/async';
import { recordView } from './analytics.service';

export const analyticsRouter = Router();

/**
 * Public page view beacon sent by the website. Always answers 204: tracking is best effort and must never show
 * the visitor an error. Do Not Track is respected.
 */
analyticsRouter.post(
  '/track',
  wrap(async (req, res) => {
    if (req.get('dnt') !== '1') {
      const body = (req.body ?? {}) as { visitorId?: unknown; path?: unknown };
      await recordView(body, req.get('user-agent') ?? '').catch(() => undefined);
    }
    res.status(204).end();
  }),
);

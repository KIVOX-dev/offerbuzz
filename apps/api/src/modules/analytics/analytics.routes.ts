import { Router } from 'express';
import { wrap } from '../../utils/async';
import { recordView, totalHits } from './analytics.service';

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

/** Public: the total website hits, shown at the bottom of every page. Cached briefly so it is cheap to call. */
analyticsRouter.get(
  '/stats/hits',
  wrap(async (_req, res) => {
    res.set('cache-control', 'public, max-age=60');
    res.json({ hits: await totalHits() });
  }),
);

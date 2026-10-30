import { Router } from 'express';
import { aiChatSchema, aiRewriteSchema, type AiChatInput, type AiRewriteInput } from '@offerbuzz/shared';
import { authenticate, requireRole } from '../../middleware/auth';
import { aiLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/async';
import { env } from '../../config/env';
import { modelList } from '../../services/groq';
import { askOffera } from './ai.service';
import { rewriteDescription } from './rewrite.service';

export const aiRouter = Router();

// Public (visitors do not need an account) but tightly rate limited, since it spends a free third party quota.
aiRouter.post(
  '/ai/chat',
  aiLimiter(),
  validate(aiChatSchema),
  wrap(async (req, res) => {
    res.json(await askOffera(req.body as AiChatInput));
  }),
);

// Vendors only: polish an offer description. Same free quota, so the same tight limit.
aiRouter.post(
  '/ai/rewrite',
  authenticate,
  requireRole('merchant'),
  aiLimiter(),
  validate(aiRewriteSchema),
  wrap(async (req, res) => {
    res.json(await rewriteDescription(req.body as AiRewriteInput));
  }),
);

// Diagnostic: is the AI switched on, and which models are in the fallback chain? Never returns the key itself.
aiRouter.get('/ai/status', (_req, res) => {
  res.json({ configured: Boolean(env().GROQ_API_KEY), models: modelList() });
});

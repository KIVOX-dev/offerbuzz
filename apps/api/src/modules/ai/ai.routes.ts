import { Router } from 'express';
import { aiChatSchema, type AiChatInput } from '@offerbuzz/shared';
import { aiLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/async';
import { askOffera } from './ai.service';

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

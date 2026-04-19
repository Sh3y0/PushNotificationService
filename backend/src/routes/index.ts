import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController.js';
import { notificationController } from '../controllers/notificationController.js';
import { healthController } from '../controllers/healthController.js';
import { apiKeyAuth } from '../middlewares/apiKeyAuth.js';
import {
  parseBody,
  parseParams,
  subscribeBodySchema,
  unsubscribeBodySchema,
  playerIdParamSchema,
  sendBodySchema,
} from '../utils/validate.js';

const router = Router();

router.get('/health', (req, res, next) => healthController.health(req, res, next));

router.post('/subscribe', parseBody(subscribeBodySchema), (req, res, next) =>
  subscriptionController.subscribe(req, res, next),
);

router.post('/unsubscribe', parseBody(unsubscribeBodySchema), (req, res, next) =>
  subscriptionController.unsubscribe(req, res, next),
);

router.get('/status/:playerId', parseParams(playerIdParamSchema), (req, res, next) =>
  subscriptionController.status(req, res, next),
);

router.get('/subscribers', apiKeyAuth, (req, res, next) => subscriptionController.listSubscribers(req, res, next));

router.post('/send', apiKeyAuth, parseBody(sendBodySchema), (req, res, next) =>
  notificationController.send(req, res, next),
);

export { router as apiRouter };

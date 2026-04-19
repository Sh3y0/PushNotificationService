import type { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscriptionService.js';
import type { SubscribeBody, UnsubscribeBody, PlayerIdParams } from '../utils/validate.js';

export const subscriptionController = {
  async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = (req as Request & { validated: SubscribeBody }).validated;
      const row = await subscriptionService.subscribe(body);
      res.status(200).json({
        id: row.id,
        playerId: row.player_id,
        isSubscribed: row.is_subscribed,
        segment: row.segment,
      });
    } catch (err) {
      next(err);
    }
  },

  async unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = (req as Request & { validated: UnsubscribeBody }).validated;
      const row = await subscriptionService.unsubscribe(body);
      res.status(200).json({
        playerId: row.player_id,
        isSubscribed: row.is_subscribed,
        segment: row.segment,
      });
    } catch (err) {
      next(err);
    }
  },

  async status(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { playerId } = (req as Request & { validatedParams: PlayerIdParams }).validatedParams;
      const statusPayload = await subscriptionService.getStatus(playerId);
      res.status(200).json(statusPayload);
    } catch (err) {
      next(err);
    }
  },

  async listSubscribers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subscribers = await subscriptionService.listSubscribers();
      res.status(200).json({ subscribers });
    } catch (err) {
      next(err);
    }
  },
};

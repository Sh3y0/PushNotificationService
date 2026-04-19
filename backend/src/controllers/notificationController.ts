import type { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService.js';
import type { SendBody } from '../utils/validate.js';

function readOneSignalId(data: unknown): string | undefined {
  if (data && typeof data === 'object' && 'id' in data) {
    const id = (data as { id: unknown }).id;
    return typeof id === 'string' ? id : undefined;
  }
  return undefined;
}

export const notificationController = {
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, message, url, segment } = (req as Request & { validated: SendBody }).validated;
      const { log, oneSignal } = await notificationService.sendAndLog({
        title,
        message,
        url,
        segment: segment ?? null,
      });

      res.status(oneSignal.ok ? 202 : 502).json({
        logId: log.id,
        status: log.status,
        segment: log.segment,
        oneSignal: oneSignal.ok ? { id: readOneSignalId(oneSignal.data) } : { error: oneSignal.error },
      });
    } catch (err) {
      next(err);
    }
  },
};

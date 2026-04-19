import { sendNotification } from './oneSignalService.js';
import { notificationLogRepository } from '../repositories/notificationLogRepository.js';
import { logger } from '../utils/logger.js';
import type { SendBody } from '../utils/validate.js';

export const notificationService = {
  async sendAndLog(payload: SendBody) {
    const segmentLabel = payload.segment ?? 'all';
    const result = await sendNotification({
      title: payload.title,
      message: payload.message,
      url: payload.url,
      segment: payload.segment ?? null,
    });

    const status = result.ok ? 'sent' : 'failed';
    const logRow = await notificationLogRepository.insert({
      title: payload.title,
      message: payload.message,
      url: payload.url,
      segment: segmentLabel,
      status,
    });

    if (result.ok) {
      logger.info('Notification dispatched', { logId: logRow.id, segment: segmentLabel });
    } else {
      logger.error('Notification failed', { logId: logRow.id, error: result.error });
    }

    return { log: logRow, oneSignal: result };
  },
};

import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const ONESIGNAL_URL = 'https://onesignal.com/api/v1/notifications';

type OneSignalFilter = { field: string; key: string; relation: string; value: string };

type OneSignalPayload = {
  app_id: string;
  headings: { en: string };
  contents: { en: string };
  url: string;
  filters?: OneSignalFilter[];
  included_segments?: string[];
};

function authHeader(): string {
  const token = Buffer.from(`:${env.ONESIGNAL_API_KEY}`).toString('base64');
  return `Basic ${token}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type SendNotificationInput = {
  title: string;
  message: string;
  url: string;
  segment?: string | null;
};

export type SendNotificationResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; data?: unknown };

export async function sendNotification(input: SendNotificationInput): Promise<SendNotificationResult> {
  const { title, message, url, segment } = input;

  const body: OneSignalPayload = {
    app_id: env.ONESIGNAL_APP_ID,
    headings: { en: title },
    contents: { en: message },
    url,
  };

  if (segment) {
    body.filters = [{ field: 'tag', key: 'segment', relation: '=', value: segment }];
  } else {
    body.included_segments = ['Subscribed Users'];
  }

  const maxAttempts = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await axios.post(ONESIGNAL_URL, body, {
        headers: {
          Authorization: authHeader(),
          'Content-Type': 'application/json',
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        return { ok: true, data: response.data };
      }

      const retryable = response.status >= 500 || response.status === 429;
      lastError = new Error(`OneSignal error: HTTP ${response.status} ${JSON.stringify(response.data)}`);
      logger.warn('OneSignal request failed', {
        status: response.status,
        attempt,
        retryable,
      });

      if (!retryable || attempt === maxAttempts) {
        return { ok: false, error: lastError.message, data: response.data };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = err instanceof Error ? err : new Error(message);
      logger.warn('OneSignal request threw', { attempt, message });
      if (attempt === maxAttempts) {
        return { ok: false, error: message };
      }
    }

    await sleep(200 * 2 ** (attempt - 1));
  }

  return { ok: false, error: lastError?.message ?? 'Unknown error' };
}

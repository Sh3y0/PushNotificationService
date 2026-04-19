import { subscriptionRepository } from '../repositories/subscriptionRepository.js';
import { HttpError } from '../utils/httpError.js';

function toIsoString(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

export type SubscriberSummary = {
  id: string;
  playerId: string;
  segment: string;
  isSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
};

export const subscriptionService = {
  async subscribe(params: { playerId: string; segment: string }) {
    return subscriptionRepository.upsertSubscribe(params);
  },

  async unsubscribe(params: { playerId: string }) {
    const row = await subscriptionRepository.setUnsubscribed(params.playerId);
    if (!row) {
      throw new HttpError('Subscription not found', 404);
    }
    return row;
  },

  async getStatus(playerId: string) {
    const row = await subscriptionRepository.findByPlayerId(playerId);
    if (!row) {
      return { isSubscribed: false, segment: 'general' as const };
    }
    return {
      isSubscribed: Boolean(row.is_subscribed),
      segment: row.segment,
    };
  },

  async listSubscribers(): Promise<SubscriberSummary[]> {
    const rows = await subscriptionRepository.findAll();
    return rows.map((row) => ({
      id: row.id,
      playerId: row.player_id,
      segment: row.segment,
      isSubscribed: Boolean(row.is_subscribed),
      createdAt: toIsoString(row.created_at),
      updatedAt: toIsoString(row.updated_at),
    }));
  },
};

import { getPool } from '../config/database.js';

export type SubscriptionRow = {
  id: string;
  player_id: string;
  is_subscribed: boolean;
  segment: string;
  created_at: Date;
  updated_at: Date;
};

export const subscriptionRepository = {
  async upsertSubscribe(params: { playerId: string; segment: string }): Promise<SubscriptionRow> {
    const pool = getPool();
    const res = await pool.query<SubscriptionRow>(
      `
      INSERT INTO subscriptions (player_id, is_subscribed, segment, created_at, updated_at)
      VALUES ($1, true, COALESCE($2, 'general'), now(), now())
      ON CONFLICT (player_id)
      DO UPDATE SET
        is_subscribed = true,
        segment = COALESCE(EXCLUDED.segment, subscriptions.segment),
        updated_at = now()
      RETURNING id, player_id, is_subscribed, segment, created_at, updated_at
      `,
      [params.playerId, params.segment ?? 'general'],
    );
    return res.rows[0]!;
  },

  async setUnsubscribed(playerId: string): Promise<SubscriptionRow | null> {
    const pool = getPool();
    const res = await pool.query<SubscriptionRow>(
      `
      UPDATE subscriptions
      SET is_subscribed = false, updated_at = now()
      WHERE player_id = $1
      RETURNING id, player_id, is_subscribed, segment, created_at, updated_at
      `,
      [playerId],
    );
    return res.rows[0] ?? null;
  },

  async findByPlayerId(playerId: string): Promise<SubscriptionRow | null> {
    const pool = getPool();
    const res = await pool.query<SubscriptionRow>(
      `SELECT id, player_id, is_subscribed, segment, created_at, updated_at
       FROM subscriptions WHERE player_id = $1`,
      [playerId],
    );
    return res.rows[0] ?? null;
  },

  async findAll(): Promise<SubscriptionRow[]> {
    const pool = getPool();
    const res = await pool.query<SubscriptionRow>(
      `SELECT id, player_id, is_subscribed, segment, created_at, updated_at
       FROM subscriptions
       ORDER BY updated_at DESC`,
    );
    return res.rows;
  },
};

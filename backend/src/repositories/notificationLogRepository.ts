import { getPool } from '../config/database.js';

export type NotificationLogRow = {
  id: string;
  title: string;
  message: string;
  url: string;
  segment: string;
  status: string;
  created_at: Date;
};

export const notificationLogRepository = {
  async insert(params: {
    title: string;
    message: string;
    url: string;
    segment: string;
    status: string;
  }): Promise<NotificationLogRow> {
    const pool = getPool();
    const res = await pool.query<NotificationLogRow>(
      `
      INSERT INTO notifications_log (title, message, url, segment, status, created_at)
      VALUES ($1, $2, $3, $4, $5, now())
      RETURNING id, title, message, url, segment, status, created_at
      `,
      [params.title, params.message, params.url, params.segment, params.status],
    );
    return res.rows[0]!;
  },
};

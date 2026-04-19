import type { Request, Response, NextFunction } from 'express';
import { getPool } from '../config/database.js';

export const healthController = {
  async health(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (err) {
      next(err);
    }
  },
};

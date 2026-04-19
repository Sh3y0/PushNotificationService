import type { RequestHandler } from 'express';
import { env } from '../config/env.js';

export const apiKeyAuth: RequestHandler = (req, res, next) => {
  const key = req.header('x-api-key');
  if (!key || key !== env.API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

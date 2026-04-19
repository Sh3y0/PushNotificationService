import type { RequestHandler } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Logs one line per finished HTTP request (method, path, status, duration).
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logger.info('Request', {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      query: Object.keys(req.query).length ? req.query : undefined,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
};

import type { ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger.js';
import { HttpError } from '../utils/httpError.js';

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const resolvedStatus = Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
  const message =
    resolvedStatus === 500 ? 'Internal server error' : err instanceof Error ? err.message : 'Request error';

  if (resolvedStatus >= 500) {
    const stack = err instanceof Error ? err.stack : undefined;
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error('Unhandled error', { message: errMessage, stack });
  } else {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.warn('Request error', { message: errMessage, path: req.path });
  }

  res.status(resolvedStatus).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && resolvedStatus === 500 && err instanceof Error
      ? { detail: err.message }
      : {}),
  });
};

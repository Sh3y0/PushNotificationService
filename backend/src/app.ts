import express, { type Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { loadOpenApiSpec } from './config/openapi.js';
import { logger } from './utils/logger.js';
import { requestLogger } from './middlewares/requestLogger.js';

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '256kb' }));
  app.use(requestLogger);

  try {
    const openApiSpec = loadOpenApiSpec();
    // `serve` is an array of middlewares; spread so Express registers each (reliable with ESM + Express 4).
    app.use('/api-docs', ...swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true }));
  } catch (err) {
    logger.warn('OpenAPI spec not loaded; /api-docs disabled', {
      message: err instanceof Error ? err.message : String(err),
    });
  }

  app.use('/', apiRouter);

  app.use(errorHandler);

  return app;
}

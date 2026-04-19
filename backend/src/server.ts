import { createApp } from './app.js';
import { env } from './config/env.js';
import { initDatabase, closeDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  await initDatabase();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Push notification API listening on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down`);
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error('Fatal startup error', { message, stack });
  process.exit(1);
});

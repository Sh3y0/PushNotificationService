import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Client, Pool } = pg;

function clientConfig(database: string): pg.ClientConfig {
  const base: pg.ClientConfig = {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD || undefined,
    database,
  };

  if (env.DB_SSL) {
    base.ssl = env.DB_SSL_REJECT_UNAUTHORIZED ? { rejectUnauthorized: true } : { rejectUnauthorized: false };
  }

  return base;
}

const adminConfig = clientConfig('postgres');
const appDbConfig = clientConfig(env.DB_NAME);

let pool: pg.Pool | null = null;

export const getPool = (): pg.Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.');
  }
  return pool;
};

async function databaseExists(client: pg.Client, name: string): Promise<boolean> {
  const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
  return (res.rowCount ?? 0) > 0;
}

async function ensureDatabase(): Promise<void> {
  const client = new Client(adminConfig);
  await client.connect();
  try {
    const exists = await databaseExists(client, env.DB_NAME);
    if (!exists) {
      const safeName = env.DB_NAME.replace(/"/g, '""');
      await client.query(`CREATE DATABASE "${safeName}"`);
      logger.info(`Created database ${env.DB_NAME}`);
    }
  } finally {
    await client.end();
  }
}

async function ensureSchema(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id TEXT NOT NULL UNIQUE,
      is_subscribed BOOLEAN NOT NULL DEFAULT true,
      segment TEXT NOT NULL DEFAULT 'general',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS notifications_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      url TEXT NOT NULL,
      segment TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_segment ON subscriptions (segment);
  `);
}

export async function initDatabase(): Promise<void> {
  await ensureDatabase();
  pool = new Pool(appDbConfig);
  const client = await pool.connect();
  try {
    await ensureSchema(client);
    logger.info('Database schema verified');
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

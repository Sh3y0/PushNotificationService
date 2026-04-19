import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

function envTruthy(value: string | undefined): boolean {
  if (value === undefined || value === '') return false;
  const s = value.toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'require';
}

function envTruthyDefaultTrue(value: string | undefined): boolean {
  if (value === undefined || value === '') return true;
  const s = value.toLowerCase();
  return s !== 'false' && s !== '0' && s !== 'no';
}

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  ONESIGNAL_APP_ID: z.string().trim().min(1, 'ONESIGNAL_APP_ID is required'),
  ONESIGNAL_API_KEY: z.string().trim().min(1, 'ONESIGNAL_API_KEY is required'),
  /** OneSignal create-notification URL (current API default). */
  ONESIGNAL_API_URL: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'https://api.onesignal.com/notifications')),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().optional().default(''),
  DB_NAME: z.string().min(1),
  DB_SSL: z.string().optional().transform(envTruthy),
  DB_SSL_REJECT_UNAUTHORIZED: z.string().optional().transform(envTruthyDefaultTrue),
  API_KEY: z.string().min(1, 'API_KEY is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

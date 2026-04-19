import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  ONESIGNAL_APP_ID: z.string().min(1, 'ONESIGNAL_APP_ID is required'),
  ONESIGNAL_API_KEY: z.string().min(1, 'ONESIGNAL_API_KEY is required'),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().optional().default(''),
  DB_NAME: z.string().min(1),
  API_KEY: z.string().min(1, 'API_KEY is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

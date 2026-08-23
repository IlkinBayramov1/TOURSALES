import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root of back folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL təyin olunmalıdır'),
  JWT_SECRET: z.string().default('your-default-jwt-secret-key'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('[CRITICAL] Mühit dəyişənləri validasiya xətası:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
export default env;


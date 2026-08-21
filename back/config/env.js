import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root of back folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5005', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'your-default-jwt-secret-key',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

export default env;

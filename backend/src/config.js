import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

if (existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch (e) {
    // Fail silently if .env is missing or invalid
  }
}

export const config = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  openaiApiKey: process.env.OPENAI_API_KEY || ''
};

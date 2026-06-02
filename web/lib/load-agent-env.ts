import { existsSync } from 'fs';
import path from 'path';
import { config } from 'dotenv';

let loaded = false;

/** Load secrets from agent/.env (OpenAI + Supabase) for server-side ingest. */
export function loadAgentEnv(): void {
  if (loaded) return;

  const candidates = [
    path.resolve(process.cwd(), '../agent/.env'),
    path.resolve(process.cwd(), 'agent/.env'),
  ];

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      config({ path: envPath });
      for (const key of [
        'OPENAI_API_KEY',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
      ]) {
        const value = process.env[key];
        if (value) process.env[key] = value.trim();
      }
      loaded = true;
      return;
    }
  }
}

import type { schema } from '@preppal/db';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export interface Bindings {
  DB: D1Database;
  IMAGES: R2Bucket;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  ALERT_FROM_EMAIL: string;
  PUBLIC_SITE_URL: string;
  DEV_ADMIN_EMAIL?: string;
  RESEND_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

export interface AdminContext {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'staff' | 'rider';
}

export interface Variables {
  db: DrizzleD1Database<typeof schema>;
  admin: AdminContext;
}

export type AppEnv = { Bindings: Bindings; Variables: Variables };

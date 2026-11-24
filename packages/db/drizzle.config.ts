import { defineConfig } from 'drizzle-kit';

/**
 * Generates SQL migrations from src/schema.ts into ./migrations.
 * They are applied with wrangler (see apps/api package.json: db:migrate:*),
 * so this config never needs database credentials.
 */
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema.ts',
  out: './migrations',
});

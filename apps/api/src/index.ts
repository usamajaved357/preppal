import { schema } from '@preppal/db';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv } from './env';
import { onError } from './lib/errors';
import { requireAdmin } from './middleware/admin-auth';
import { adminCatalogRoutes } from './routes/admin/catalog';
import { adminInventoryRoutes } from './routes/admin/inventory';
import { adminOrderRoutes } from './routes/admin/orders';
import { adminSetupRoutes } from './routes/admin/setup';
import { catalogRoutes } from './routes/public/catalog';
import { imageRoutes } from './routes/public/images';
import { orderRoutes } from './routes/public/orders';

const admin = new Hono<AppEnv>()
  .use('*', requireAdmin())
  .route('/', adminCatalogRoutes)
  .route('/', adminInventoryRoutes)
  .route('/', adminOrderRoutes)
  .route('/', adminSetupRoutes);

export const app = new Hono<AppEnv>()
  .basePath('/api')
  .use('*', logger())
  .use('*', secureHeaders())
  .use('*', async (c, next) => {
    c.set('db', drizzle(c.env.DB, { schema }));
    await next();
  })
  .get('/health', (c) => c.json({ ok: true, env: c.env.ENVIRONMENT }))
  .route('/', catalogRoutes)
  .route('/', orderRoutes)
  .route('/', imageRoutes)
  .route('/admin', admin)
  .notFound((c) => c.json({ error: { code: 'not_found', message: 'Route not found' } }, 404))
  .onError(onError);

export type AppType = typeof app;

export default app;

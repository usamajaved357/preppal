import { cities, deliveryAreas } from '@preppal/db';
import { availableDeliveryDates, DEFAULT_SETTINGS, msUntilCutoff, type PublicSettingsDto } from '@preppal/shared';
import { and, asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../../env';
import { loadSettings } from '../../lib/settings';
import { validate } from '../../lib/validate';
import { getProduct, listCategories, listProducts, resolveCity } from '../../services/catalog';

const cityQuery = z.object({ city: z.string().default('sahiwal'), category: z.string().optional() });

export const catalogRoutes = new Hono<AppEnv>()
  .get('/settings', async (c) => {
    const db = c.get('db');
    const [s, activeCities] = await Promise.all([
      loadSettings(db),
      db.select({ name: cities.name }).from(cities).where(eq(cities.isActive, true)),
    ]);
    const body: PublicSettingsDto = {
      cutoffHour: s.cutoffHour,
      deliveryByLabel: s.deliveryByLabel,
      minOrderPkr: s.minOrderPkr,
      whatsappNumber: s.whatsappNumber,
      instagramHandle: s.instagramHandle,
      deliveryDates: availableDeliveryDates({ cutoffHour: s.cutoffHour, maxDaysAhead: s.maxDaysAhead }),
      msUntilCutoff: msUntilCutoff(s.cutoffHour),
      announcement: s.announcement,
      ordersPaused: s.ordersPaused,
      pauseMessage: s.pauseMessage || DEFAULT_SETTINGS.pauseMessage,
      cityNames: activeCities.map((x) => x.name),
    };
    c.header('Cache-Control', 'no-store');
    return c.json(body);
  })
  .get('/cities', async (c) => {
    const rows = await c
      .get('db')
      .select({ id: cities.id, name: cities.name, slug: cities.slug })
      .from(cities)
      .where(eq(cities.isActive, true));
    return c.json(rows);
  })
  .get('/cities/:slug/areas', async (c) => {
    const db = c.get('db');
    const city = await resolveCity(db, c.req.param('slug'));
    const rows = await db
      .select({
        id: deliveryAreas.id,
        name: deliveryAreas.name,
        deliveryFeePkr: deliveryAreas.deliveryFeePkr,
      })
      .from(deliveryAreas)
      .where(and(eq(deliveryAreas.cityId, city.id), eq(deliveryAreas.isActive, true)))
      .orderBy(asc(deliveryAreas.sortOrder), asc(deliveryAreas.name));
    return c.json({ city, areas: rows });
  })
  .get('/categories', async (c) => {
    c.header('Cache-Control', 'public, max-age=60');
    return c.json(await listCategories(c.get('db')));
  })
  .get('/products', validate('query', cityQuery), async (c) => {
    const { city: citySlug, category } = c.req.valid('query');
    const db = c.get('db');
    const city = await resolveCity(db, citySlug);
    return c.json(await listProducts(db, city.id, category));
  })
  .get('/products/:slug', validate('query', cityQuery), async (c) => {
    const db = c.get('db');
    const city = await resolveCity(db, c.req.valid('query').city);
    return c.json(await getProduct(db, city.id, c.req.param('slug')));
  });

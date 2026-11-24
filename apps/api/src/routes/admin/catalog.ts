import { categories, cities, inventory, products, productVariants } from '@preppal/db';
import { categoryInputSchema, productInputSchema, variantInputSchema } from '@preppal/shared';
import { asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../../env';
import { audit } from '../../lib/audit';
import { notFound } from '../../lib/errors';
import { newId, nowIso } from '../../lib/ids';
import { imageUrl } from '../../lib/images';
import { validate } from '../../lib/validate';

export const adminCatalogRoutes = new Hono<AppEnv>()
  // ── Categories ──
  .get('/categories', async (c) => {
    const rows = await c.get('db').select().from(categories).orderBy(asc(categories.sortOrder));
    return c.json(rows.map((r) => ({ ...r, imageUrl: imageUrl(r.imageKey) })));
  })
  .post('/categories', validate('json', categoryInputSchema), async (c) => {
    const id = newId('cat');
    await c
      .get('db')
      .insert(categories)
      .values({ id, ...c.req.valid('json') });
    await audit(c, 'category.create', 'category', id);
    return c.json({ id }, 201);
  })
  .put('/categories/:id', validate('json', categoryInputSchema), async (c) => {
    const id = c.req.param('id');
    await c.get('db').update(categories).set(c.req.valid('json')).where(eq(categories.id, id));
    await audit(c, 'category.update', 'category', id);
    return c.json({ ok: true });
  })

  // ── Products ──
  .get('/products', async (c) => {
    const db = c.get('db');
    const [rows, variants] = await Promise.all([
      db.select().from(products).orderBy(asc(products.sortOrder)),
      db.select().from(productVariants).orderBy(asc(productVariants.sortOrder)),
    ]);
    return c.json(
      rows.map((p) => ({
        ...p,
        imageUrls: p.imageKeys.map(imageUrl),
        variants: variants.filter((v) => v.productId === p.id),
      })),
    );
  })
  .get('/products/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!p) throw notFound('Product');
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.sortOrder));
    return c.json({ ...p, imageUrls: p.imageKeys.map(imageUrl), variants });
  })
  .post('/products', validate('json', productInputSchema), async (c) => {
    const id = newId('prd');
    await c
      .get('db')
      .insert(products)
      .values({ id, ...c.req.valid('json') });
    await audit(c, 'product.create', 'product', id);
    return c.json({ id }, 201);
  })
  .put('/products/:id', validate('json', productInputSchema), async (c) => {
    const id = c.req.param('id');
    await c
      .get('db')
      .update(products)
      .set({ ...c.req.valid('json'), updatedAt: nowIso() })
      .where(eq(products.id, id));
    await audit(c, 'product.update', 'product', id);
    return c.json({ ok: true });
  })

  // ── Variants ── (new variants are made available in every active city with no stock tracking)
  .post('/products/:id/variants', validate('json', variantInputSchema), async (c) => {
    const db = c.get('db');
    const productId = c.req.param('id');
    const id = newId('var');
    await db.insert(productVariants).values({ id, productId, ...c.req.valid('json') });
    const activeCities = await db.select({ id: cities.id }).from(cities).where(eq(cities.isActive, true));
    if (activeCities.length) {
      await db
        .insert(inventory)
        .values(activeCities.map((ct) => ({ variantId: id, cityId: ct.id, isAvailable: true })))
        .onConflictDoNothing();
    }
    await audit(c, 'variant.create', 'variant', id);
    return c.json({ id }, 201);
  })
  .put('/variants/:id', validate('json', variantInputSchema), async (c) => {
    const id = c.req.param('id');
    await c.get('db').update(productVariants).set(c.req.valid('json')).where(eq(productVariants.id, id));
    await audit(c, 'variant.update', 'variant', id, c.req.valid('json'));
    return c.json({ ok: true });
  });

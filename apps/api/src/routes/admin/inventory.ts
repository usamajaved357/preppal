import { inventory, products, productVariants } from '@preppal/db';
import { inventoryInputSchema } from '@preppal/shared';
import { and, asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../../env';
import { audit } from '../../lib/audit';
import { nowIso } from '../../lib/ids';
import { validate } from '../../lib/validate';

export const adminInventoryRoutes = new Hono<AppEnv>()
  .get(
    '/inventory',
    validate('query', z.object({ cityId: z.string().default('city_sahiwal') })),
    async (c) => {
      const { cityId } = c.req.valid('query');
      const rows = await c
        .get('db')
        .select({
          variantId: productVariants.id,
          productName: products.name,
          variantLabel: productVariants.label,
          pricePkr: productVariants.pricePkr,
          inv: inventory,
        })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .leftJoin(inventory, and(eq(inventory.variantId, productVariants.id), eq(inventory.cityId, cityId)))
        .orderBy(asc(products.sortOrder), asc(productVariants.sortOrder));
      return c.json(rows);
    },
  )
  .put('/inventory/:variantId/:cityId', validate('json', inventoryInputSchema), async (c) => {
    const { variantId, cityId } = c.req.param();
    const v = c.req.valid('json');
    await c
      .get('db')
      .insert(inventory)
      .values({ variantId, cityId, ...v, updatedAt: nowIso() })
      .onConflictDoUpdate({
        target: [inventory.variantId, inventory.cityId],
        set: { ...v, updatedAt: nowIso() },
      });
    await audit(c, 'inventory.update', 'variant', variantId, { cityId, ...v });
    return c.json({ ok: true });
  });

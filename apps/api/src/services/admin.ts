import {
  adminUsers,
  categories,
  cities,
  deliveryAreas,
  inventory,
  orders,
  products,
  productVariants,
  riders,
} from '@preppal/db';
import { and, count, eq, inArray, ne } from 'drizzle-orm';
import type { Variables } from '../env';
import { HttpError, notFound } from '../lib/errors';

type Db = Variables['db'];

const toMap = (rows: { key: string | null; n: number }[]) => new Map(rows.map((r) => [r.key, r.n]));

/** Usage counts shown in the admin so people know why something can't be deleted. */
export const productCountByCategory = async (db: Db) =>
  toMap(
    await db.select({ key: products.categoryId, n: count() }).from(products).groupBy(products.categoryId),
  );
export const orderCountByArea = async (db: Db) =>
  toMap(await db.select({ key: orders.areaId, n: count() }).from(orders).groupBy(orders.areaId));
export const orderCountByRider = async (db: Db) =>
  toMap(await db.select({ key: orders.riderId, n: count() }).from(orders).groupBy(orders.riderId));
export const areaCountByCity = async (db: Db) =>
  toMap(
    await db
      .select({ key: deliveryAreas.cityId, n: count() })
      .from(deliveryAreas)
      .groupBy(deliveryAreas.cityId),
  );

const inUse = (code: string, message: string, details: Record<string, number>) =>
  new HttpError(409, code, message, details);

/**
 * Deletes a category. If it still has products, `moveTo` (another category id) is required and the
 * products are moved there in the same batch.
 */
export async function deleteCategory(db: Db, id: string, moveTo?: string): Promise<{ moved: number }> {
  const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!cat) throw notFound('Category');
  const [{ n }] = (await db.select({ n: count() }).from(products).where(eq(products.categoryId, id))) as [
    { n: number },
  ];
  if (n > 0 && !moveTo) {
    throw inUse('category_in_use', `${cat.name} has ${n} product${n === 1 ? '' : 's'}. Move them first.`, {
      productCount: n,
    });
  }
  if (n > 0 && moveTo) {
    if (moveTo === id)
      throw new HttpError(400, 'bad_target', 'Pick a different category to move products to');
    const [target] = await db.select().from(categories).where(eq(categories.id, moveTo)).limit(1);
    if (!target) throw notFound('Target category');
    await db.batch([
      db.update(products).set({ categoryId: moveTo }).where(eq(products.categoryId, id)),
      db.delete(categories).where(eq(categories.id, id)),
    ]);
    return { moved: n };
  }
  await db.delete(categories).where(eq(categories.id, id));
  return { moved: 0 };
}

/**
 * Deletes a product with its sizes and inventory rows. Past orders keep their own name/price
 * snapshots (order_items has no FK to products), so history is unaffected.
 */
export async function deleteProduct(db: Db, id: string): Promise<void> {
  const [p] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
  if (!p) throw notFound('Product');
  const variantIds = (
    await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, id))
  ).map((v) => v.id);
  const dropProduct = db.delete(products).where(eq(products.id, id));
  const dropVariants = db.delete(productVariants).where(eq(productVariants.productId, id));
  if (variantIds.length) {
    await db.batch([
      db.delete(inventory).where(inArray(inventory.variantId, variantIds)),
      dropVariants,
      dropProduct,
    ]);
  } else {
    await db.batch([dropVariants, dropProduct]);
  }
}

export async function deleteVariant(db: Db, id: string): Promise<void> {
  const [v] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.id, id));
  if (!v) throw notFound('Size');
  await db.batch([
    db.delete(inventory).where(eq(inventory.variantId, id)),
    db.delete(productVariants).where(eq(productVariants.id, id)),
  ]);
}

/** Areas and riders that appear on orders can't be removed (orders keep the link) — turn them off instead. */
export async function deleteArea(db: Db, id: string): Promise<void> {
  const [{ n }] = (await db.select({ n: count() }).from(orders).where(eq(orders.areaId, id))) as [
    { n: number },
  ];
  if (n > 0) {
    throw inUse('area_in_use', `This area is on ${n} order${n === 1 ? '' : 's'}. Turn it off instead.`, {
      orderCount: n,
    });
  }
  await db.delete(deliveryAreas).where(eq(deliveryAreas.id, id));
}

export async function deleteRider(db: Db, id: string): Promise<void> {
  const [{ n }] = (await db.select({ n: count() }).from(orders).where(eq(orders.riderId, id))) as [
    { n: number },
  ];
  if (n > 0) {
    throw inUse('rider_in_use', `This rider is on ${n} order${n === 1 ? '' : 's'}. Turn them off instead.`, {
      orderCount: n,
    });
  }
  await db.delete(riders).where(eq(riders.id, id));
}

export async function deleteCity(db: Db, id: string): Promise<void> {
  const [[a], [o]] = await Promise.all([
    db.select({ n: count() }).from(deliveryAreas).where(eq(deliveryAreas.cityId, id)),
    db.select({ n: count() }).from(orders).where(eq(orders.cityId, id)),
  ]);
  if ((a?.n ?? 0) > 0 || (o?.n ?? 0) > 0) {
    throw inUse(
      'city_in_use',
      'Remove this city’s delivery areas first. Cities with orders can only be turned off.',
      {
        areaCount: a?.n ?? 0,
        orderCount: o?.n ?? 0,
      },
    );
  }
  await db.batch([
    db.delete(inventory).where(eq(inventory.cityId, id)),
    db.delete(cities).where(eq(cities.id, id)),
  ]);
}

/** Owner can remove admins, but never themselves or the last active owner. */
export async function deleteAdmin(db: Db, id: string, actorEmail: string): Promise<void> {
  const [target] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  if (!target) throw notFound('Admin');
  if (target.email === actorEmail)
    throw new HttpError(400, 'cannot_remove_self', "You can't remove yourself");
  if (target.role === 'owner') {
    const [{ n }] = (await db
      .select({ n: count() })
      .from(adminUsers)
      .where(and(eq(adminUsers.role, 'owner'), eq(adminUsers.isActive, true), ne(adminUsers.id, id)))) as [
      { n: number },
    ];
    if (n === 0) throw new HttpError(400, 'last_owner', 'Keep at least one active owner');
  }
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
}

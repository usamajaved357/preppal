import { categories, cities, inventory, products, productVariants } from '@preppal/db';
import type { CategoryDto, ProductCardDto, ProductDetailDto, VariantDto } from '@preppal/shared';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Variables } from '../env';
import { notFound } from '../lib/errors';
import { imageUrl } from '../lib/images';

type Db = Variables['db'];

export async function resolveCity(db: Db, slug: string) {
  const [city] = await db
    .select()
    .from(cities)
    .where(and(eq(cities.slug, slug), eq(cities.isActive, true)))
    .limit(1);
  if (!city) throw notFound('City');
  return city;
}

export async function listCategories(db: Db): Promise<CategoryDto[]> {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    imageUrl: imageUrl(r.imageKey),
  }));
}

/** Variants of the given products with city availability + effective price. */
async function variantsFor(db: Db, productIds: string[], cityId: string) {
  if (productIds.length === 0) return new Map<string, VariantDto[]>();
  const rows = await db
    .select({ v: productVariants, inv: inventory })
    .from(productVariants)
    .leftJoin(inventory, and(eq(inventory.variantId, productVariants.id), eq(inventory.cityId, cityId)))
    .where(and(inArray(productVariants.productId, productIds), eq(productVariants.isActive, true)))
    .orderBy(asc(productVariants.sortOrder));

  const map = new Map<string, VariantDto[]>();
  for (const { v, inv } of rows) {
    const price = inv?.priceOverridePkr ?? v.pricePkr;
    const available = !!inv && inv.isAvailable && price > 0 && (inv.stockQty == null || inv.stockQty > 0);
    const list = map.get(v.productId) ?? [];
    list.push({ id: v.id, label: v.label, unitNote: v.unitNote, pricePkr: price, available });
    map.set(v.productId, list);
  }
  return map;
}

function toCard(
  p: typeof products.$inferSelect,
  categorySlug: string,
  variants: VariantDto[],
): ProductCardDto {
  const prices = variants.filter((v) => v.pricePkr > 0).map((v) => v.pricePkr);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    badge: p.badge,
    imageUrl: imageUrl(p.imageKeys[0]),
    categorySlug,
    fromPricePkr: prices.length ? Math.min(...prices) : null,
    variants,
  };
}

export async function listProducts(db: Db, cityId: string, categorySlug?: string): Promise<ProductCardDto[]> {
  const where = [eq(products.status, 'active' as const), eq(categories.isActive, true)];
  if (categorySlug) where.push(eq(categories.slug, categorySlug));
  const rows = await db
    .select({ p: products, catSlug: categories.slug })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...where))
    .orderBy(asc(products.sortOrder));
  const variants = await variantsFor(
    db,
    rows.map((r) => r.p.id),
    cityId,
  );
  return rows.map((r) => toCard(r.p, r.catSlug, variants.get(r.p.id) ?? []));
}

export async function getProduct(db: Db, cityId: string, slug: string): Promise<ProductDetailDto> {
  const [row] = await db
    .select({ p: products, catSlug: categories.slug })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.slug, slug), eq(products.status, 'active')))
    .limit(1);
  if (!row) throw notFound('Product');
  const variants = (await variantsFor(db, [row.p.id], cityId)).get(row.p.id) ?? [];
  return {
    ...toCard(row.p, row.catSlug, variants),
    description: row.p.description,
    howToUse: row.p.howToUse,
    ingredients: row.p.ingredients,
    storage: row.p.storage,
    imageUrls: row.p.imageKeys.map((k) => imageUrl(k)).filter((u): u is string => !!u),
  };
}

/**
 * Preppal data model (Cloudflare D1 / SQLite).
 * Conventions:
 *  - ids: text UUIDs (crypto.randomUUID)
 *  - money: integer PKR
 *  - timestamps: ISO-8601 UTC strings; delivery_date: 'YYYY-MM-DD' in Asia/Karachi
 *  - everything city-specific lives in `inventory` / `delivery_areas` so new cities need no schema change
 * Keep docs/DATA_MODEL.md in sync when you change this file.
 */
import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const id = () => text('id').primaryKey();
const createdAt = () => text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);
const updatedAt = () => text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);
const bool = (name: string) => integer(name, { mode: 'boolean' });

// ───────────── Geography ─────────────

export const cities = sqliteTable('cities', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  isActive: bool('is_active').notNull().default(false),
  createdAt: createdAt(),
});

export const deliveryAreas = sqliteTable(
  'delivery_areas',
  {
    id: id(),
    cityId: text('city_id')
      .notNull()
      .references(() => cities.id),
    name: text('name').notNull(),
    deliveryFeePkr: integer('delivery_fee_pkr').notNull().default(0),
    isActive: bool('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('areas_city_idx').on(t.cityId)],
);

// ───────────── Catalog ─────────────

export const categories = sqliteTable('categories', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  imageKey: text('image_key').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: bool('is_active').notNull().default(true),
});

export const products = sqliteTable(
  'products',
  {
    id: id(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    shortDescription: text('short_description').notNull().default(''),
    description: text('description').notNull().default(''),
    howToUse: text('how_to_use').notNull().default(''),
    ingredients: text('ingredients').notNull().default(''),
    storage: text('storage').notNull().default(''),
    badge: text('badge'),
    /** JSON array of image keys. A key starting with "/" is a static asset; otherwise an R2 key. */
    imageKeys: text('image_keys', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
    status: text('status', { enum: ['draft', 'active', 'archived'] })
      .notNull()
      .default('draft'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('products_category_idx').on(t.categoryId), index('products_status_idx').on(t.status)],
);

export const productVariants = sqliteTable(
  'product_variants',
  {
    id: id(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    label: text('label').notNull(), // e.g. "250 g", "1 kg", "Pack of 6"
    sku: text('sku').notNull().unique(),
    pricePkr: integer('price_pkr').notNull(),
    unitNote: text('unit_note').notNull().default(''), // e.g. "per kg"
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: bool('is_active').notNull().default(true),
  },
  (t) => [index('variants_product_idx').on(t.productId)],
);

/** Availability, stock and daily caps per variant per city. A missing row = not sold in that city. */
export const inventory = sqliteTable(
  'inventory',
  {
    variantId: text('variant_id')
      .notNull()
      .references(() => productVariants.id),
    cityId: text('city_id')
      .notNull()
      .references(() => cities.id),
    isAvailable: bool('is_available').notNull().default(true),
    /** null = made to order, no stock tracking. */
    stockQty: integer('stock_qty'),
    /** null = no cap. Max qty sold per delivery date (e.g. "30 bundles a day"). */
    dailyLimit: integer('daily_limit'),
    priceOverridePkr: integer('price_override_pkr'),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.variantId, t.cityId] })],
);

// ───────────── Customers & orders ─────────────

export const customers = sqliteTable('customers', {
  id: id(),
  phone: text('phone').notNull().unique(), // normalised 03XXXXXXXXX
  name: text('name').notNull(),
  createdAt: createdAt(),
  lastOrderAt: text('last_order_at'),
});

export const riders = sqliteTable('riders', {
  id: id(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  isActive: bool('is_active').notNull().default(true),
});

export const orders = sqliteTable(
  'orders',
  {
    id: id(),
    number: text('number').notNull().unique(), // PP-000123
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    cityId: text('city_id')
      .notNull()
      .references(() => cities.id),
    areaId: text('area_id')
      .notNull()
      .references(() => deliveryAreas.id),
    /** Address snapshot — never join back to change history. */
    areaName: text('area_name').notNull(),
    addressLine1: text('address_line1').notNull(),
    landmark: text('landmark').notNull().default(''),
    notes: text('notes').notNull().default(''),
    deliveryDate: text('delivery_date').notNull(),
    status: text('status', {
      enum: [
        'pending',
        'confirmed',
        'preparing',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'failed_delivery',
      ],
    })
      .notNull()
      .default('pending'),
    subtotalPkr: integer('subtotal_pkr').notNull(),
    deliveryFeePkr: integer('delivery_fee_pkr').notNull(),
    totalPkr: integer('total_pkr').notNull(),
    paymentMethod: text('payment_method', { enum: ['cod'] })
      .notNull()
      .default('cod'),
    codCollected: bool('cod_collected').notNull().default(false),
    riderId: text('rider_id').references(() => riders.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('orders_delivery_date_idx').on(t.deliveryDate, t.status),
    index('orders_customer_idx').on(t.customerId),
    index('orders_phone_idx').on(t.customerPhone),
  ],
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: id(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id),
    productId: text('product_id').notNull(),
    variantId: text('variant_id').notNull(),
    /** Snapshots at time of order. */
    productName: text('product_name').notNull(),
    variantLabel: text('variant_label').notNull(),
    unitPricePkr: integer('unit_price_pkr').notNull(),
    qty: integer('qty').notNull(),
    lineTotalPkr: integer('line_total_pkr').notNull(),
    /** Denormalised for fast daily-limit counts and prep lists. */
    deliveryDate: text('delivery_date').notNull(),
  },
  (t) => [
    index('items_order_idx').on(t.orderId),
    index('items_variant_date_idx').on(t.variantId, t.deliveryDate),
  ],
);

export const orderStatusHistory = sqliteTable(
  'order_status_history',
  {
    id: id(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id),
    status: text('status').notNull(),
    note: text('note').notNull().default(''),
    byEmail: text('by_email'),
    createdAt: createdAt(),
  },
  (t) => [index('history_order_idx').on(t.orderId)],
);

// ───────────── Admin & config ─────────────

export const adminUsers = sqliteTable('admin_users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ['owner', 'staff', 'rider'] })
    .notNull()
    .default('staff'),
  isActive: bool('is_active').notNull().default(true),
  createdAt: createdAt(),
});

/** Key/value JSON settings (cutoff hour, WhatsApp number, alert emails…). */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
  updatedAt: updatedAt(),
});

/** Monotonic counters (order numbers). */
export const counters = sqliteTable('counters', {
  key: text('key').primaryKey(),
  value: integer('value').notNull().default(0),
});

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: id(),
    actorEmail: text('actor_email'),
    action: text('action').notNull(), // e.g. "product.update"
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    data: text('data', { mode: 'json' }),
    createdAt: createdAt(),
  },
  (t) => [index('audit_entity_idx').on(t.entity, t.entityId)],
);

export const notifySubscribers = sqliteTable(
  'notify_subscribers',
  {
    id: id(),
    phone: text('phone').notNull(),
    topic: text('topic').notNull(), // "deals" | product slug
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('notify_unique').on(t.phone, t.topic)],
);

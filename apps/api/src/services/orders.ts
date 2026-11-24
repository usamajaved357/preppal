import {
  cities,
  deliveryAreas,
  inventory,
  orderItems,
  orderStatusHistory,
  orders,
  products,
  productVariants,
} from '@preppal/db';
import {
  ACTIVE_ORDER_STATUSES,
  availableDeliveryDates,
  type createOrderSchema,
  formatPkr,
  type OrderCreatedDto,
} from '@preppal/shared';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { z } from 'zod';
import type { Bindings, Variables } from '../env';
import { badRequest, HttpError } from '../lib/errors';
import { formatOrderNumber, newId, nowIso } from '../lib/ids';
import { type NewOrderAlert, whatsappOrderUrl } from '../lib/notify';
import { loadSettings } from '../lib/settings';

type Db = Variables['db'];
type CreateOrder = z.output<typeof createOrderSchema>;

/**
 * Places a cash-on-delivery order.
 *
 * Guarantees:
 *  - delivery date respects the nightly cutoff (settings.cutoffHour, Asia/Karachi)
 *  - prices come from the DB (client prices are never trusted)
 *  - tracked stock never goes negative: conditional decrements in one D1 batch, compensated on failure
 *  - daily limits ("30 bundles a day") are checked against active orders for that date
 *
 * Known limit: daily-limit checks are read-then-write, so two simultaneous orders could
 * exceed a cap by a few units. Acceptable at current volume; see docs/DECISIONS.md (ADR-007).
 */
export async function createOrder(
  env: Bindings,
  db: Db,
  input: CreateOrder,
  now: Date = new Date(),
): Promise<{ created: OrderCreatedDto; alert: NewOrderAlert; alertEmails: string[] }> {
  const s = await loadSettings(db);

  const dates = availableDeliveryDates({ now, cutoffHour: s.cutoffHour, maxDaysAhead: s.maxDaysAhead });
  if (!dates.includes(input.deliveryDate)) {
    throw badRequest('delivery_date_unavailable', 'That delivery day is no longer available', { dates });
  }

  const [city] = await db
    .select()
    .from(cities)
    .where(and(eq(cities.id, input.address.cityId), eq(cities.isActive, true)))
    .limit(1);
  if (!city) throw badRequest('city_unavailable', 'We do not deliver to this city yet');

  const [area] = await db
    .select()
    .from(deliveryAreas)
    .where(
      and(
        eq(deliveryAreas.id, input.address.areaId),
        eq(deliveryAreas.cityId, city.id),
        eq(deliveryAreas.isActive, true),
      ),
    )
    .limit(1);
  if (!area) throw badRequest('area_unavailable', 'We do not deliver to this area yet');

  // Merge duplicate lines.
  const qtyByVariant = new Map<string, number>();
  for (const it of input.items)
    qtyByVariant.set(it.variantId, (qtyByVariant.get(it.variantId) ?? 0) + it.qty);
  const variantIds = [...qtyByVariant.keys()];

  const rows = await db
    .select({ v: productVariants, p: products, inv: inventory })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, and(eq(inventory.variantId, productVariants.id), eq(inventory.cityId, city.id)))
    .where(inArray(productVariants.id, variantIds));

  const lines = variantIds.map((variantId) => {
    const row = rows.find((r) => r.v.id === variantId);
    const qty = qtyByVariant.get(variantId) ?? 0;
    const price = row ? (row.inv?.priceOverridePkr ?? row.v.pricePkr) : 0;
    if (row?.p.status !== 'active' || !row.v.isActive || !row.inv || !row.inv.isAvailable || price <= 0) {
      throw new HttpError(409, 'item_unavailable', 'An item in your cart is no longer available', {
        variantId,
      });
    }
    if (row.inv.stockQty != null && row.inv.stockQty < qty) {
      throw new HttpError(
        409,
        'out_of_stock',
        `${row.p.name} (${row.v.label}) — only ${row.inv.stockQty} left`,
        {
          variantId,
          available: row.inv.stockQty,
        },
      );
    }
    return { row, qty, price, lineTotal: price * qty };
  });

  // Daily limits for the chosen delivery date.
  const limited = lines.filter((l) => l.row.inv?.dailyLimit != null);
  if (limited.length) {
    const sold = await db
      .select({ variantId: orderItems.variantId, qty: sql<number>`sum(${orderItems.qty})` })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(
          inArray(
            orderItems.variantId,
            limited.map((l) => l.row.v.id),
          ),
          eq(orderItems.deliveryDate, input.deliveryDate),
          inArray(orders.status, [...ACTIVE_ORDER_STATUSES]),
        ),
      )
      .groupBy(orderItems.variantId);
    for (const l of limited) {
      const already = Number(sold.find((x) => x.variantId === l.row.v.id)?.qty ?? 0);
      const cap = l.row.inv?.dailyLimit ?? 0;
      if (already + l.qty > cap) {
        throw new HttpError(409, 'daily_limit_reached', `${l.row.p.name} is limited to ${cap} per day`, {
          variantId: l.row.v.id,
          remaining: Math.max(0, cap - already),
        });
      }
    }
  }

  const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
  if (subtotal < s.minOrderPkr) {
    throw badRequest('below_minimum', `Minimum order is ${formatPkr(s.minOrderPkr)}`);
  }
  const fee = area.deliveryFeePkr;
  const total = subtotal + fee;

  // Reserve tracked stock atomically.
  const tracked = lines.filter((l) => l.row.inv?.stockQty != null);
  const reserved: typeof tracked = [];
  if (tracked.length) {
    const results = await env.DB.batch(
      tracked.map((l) =>
        env.DB.prepare(
          'UPDATE inventory SET stock_qty = stock_qty - ?1 WHERE variant_id = ?2 AND city_id = ?3 AND stock_qty >= ?1',
        ).bind(l.qty, l.row.v.id, city.id),
      ),
    );
    results.forEach((r, i) => {
      const line = tracked[i];
      if (line && r.meta.changes > 0) reserved.push(line);
    });
    if (reserved.length !== tracked.length) {
      await releaseStock(env, city.id, reserved);
      throw new HttpError(409, 'out_of_stock', 'Some items just sold out. Please review your cart.');
    }
  }

  try {
    const counter = await env.DB.prepare(
      "INSERT INTO counters (key, value) VALUES ('order_number', 1) ON CONFLICT(key) DO UPDATE SET value = value + 1 RETURNING value",
    ).first<{ value: number }>();
    const number = formatOrderNumber(counter?.value ?? Date.now() % 1_000_000);
    const at = nowIso();

    const customer = await env.DB.prepare(
      `INSERT INTO customers (id, phone, name, last_order_at) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(phone) DO UPDATE SET name = excluded.name, last_order_at = excluded.last_order_at
       RETURNING id`,
    )
      .bind(newId('cus'), input.customer.phone, input.customer.name, at)
      .first<{ id: string }>();
    if (!customer) throw new Error('customer upsert failed');

    const orderId = newId('ord');
    await db.batch([
      db.insert(orders).values({
        id: orderId,
        number,
        customerId: customer.id,
        customerName: input.customer.name,
        customerPhone: input.customer.phone,
        cityId: city.id,
        areaId: area.id,
        areaName: area.name,
        addressLine1: input.address.line1,
        landmark: input.address.landmark,
        notes: input.notes,
        deliveryDate: input.deliveryDate,
        subtotalPkr: subtotal,
        deliveryFeePkr: fee,
        totalPkr: total,
        createdAt: at,
        updatedAt: at,
      }),
      db.insert(orderItems).values(
        lines.map((l) => ({
          id: newId('itm'),
          orderId,
          productId: l.row.p.id,
          variantId: l.row.v.id,
          productName: l.row.p.name,
          variantLabel: l.row.v.label,
          unitPricePkr: l.price,
          qty: l.qty,
          lineTotalPkr: l.lineTotal,
          deliveryDate: input.deliveryDate,
        })),
      ),
      db.insert(orderStatusHistory).values({ id: newId('hst'), orderId, status: 'pending', createdAt: at }),
    ]);

    const alert: NewOrderAlert = {
      number,
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      areaName: area.name,
      address: [input.address.line1, input.address.landmark].filter(Boolean).join(', '),
      deliveryDate: input.deliveryDate,
      totalPkr: total,
      items: lines.map((l) => ({ name: l.row.p.name, label: l.row.v.label, qty: l.qty })),
    };

    return {
      created: {
        orderNumber: number,
        totalPkr: total,
        deliveryDate: input.deliveryDate,
        whatsappUrl: whatsappOrderUrl(s.whatsappNumber, alert),
      },
      alert,
      alertEmails: s.alertEmails,
    };
  } catch (err) {
    await releaseStock(env, city.id, reserved);
    throw err;
  }
}

async function releaseStock(
  env: Bindings,
  cityId: string,
  lines: { row: { v: { id: string } }; qty: number }[],
) {
  if (!lines.length) return;
  await env.DB.batch(
    lines.map((l) =>
      env.DB.prepare(
        'UPDATE inventory SET stock_qty = stock_qty + ?1 WHERE variant_id = ?2 AND city_id = ?3 AND stock_qty IS NOT NULL',
      ).bind(l.qty, l.row.v.id, cityId),
    ),
  );
}

/** Returns tracked stock to inventory when an order is cancelled. */
export async function restockOrder(env: Bindings, db: Db, orderId: string, cityId: string) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  if (!items.length) return;
  await env.DB.batch(
    items.map((i) =>
      env.DB.prepare(
        'UPDATE inventory SET stock_qty = stock_qty + ?1 WHERE variant_id = ?2 AND city_id = ?3 AND stock_qty IS NOT NULL',
      ).bind(i.qty, i.variantId, cityId),
    ),
  );
}

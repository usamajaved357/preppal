import { orderItems, orderStatusHistory, orders, riders } from '@preppal/db';
import {
  ACTIVE_ORDER_STATUSES,
  canTransition,
  ORDER_STATUSES,
  orderStatusUpdateSchema,
} from '@preppal/shared';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../../env';
import { audit } from '../../lib/audit';
import { HttpError, notFound } from '../../lib/errors';
import { newId, nowIso } from '../../lib/ids';
import { validate } from '../../lib/validate';
import { restockOrder } from '../../services/orders';

const listQuery = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: z.enum(ORDER_STATUSES).optional(),
});

export const adminOrderRoutes = new Hono<AppEnv>()
  .get('/orders', validate('query', listQuery), async (c) => {
    const { date, status } = c.req.valid('query');
    const where = [];
    if (date) where.push(eq(orders.deliveryDate, date));
    if (status) where.push(eq(orders.status, status));
    const db = c.get('db');
    const rows = await db
      .select()
      .from(orders)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(200);
    const items = rows.length
      ? await db
          .select()
          .from(orderItems)
          .where(
            inArray(
              orderItems.orderId,
              rows.map((r) => r.id),
            ),
          )
      : [];
    return c.json(rows.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) })));
  })
  .get('/orders/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) throw notFound('Order');
    const [items, history] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, id)),
      db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, id))
        .orderBy(asc(orderStatusHistory.createdAt)),
    ]);
    return c.json({ ...order, items, history });
  })
  .patch('/orders/:id/status', validate('json', orderStatusUpdateSchema), async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    const { status, note } = c.req.valid('json');
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) throw notFound('Order');
    if (!canTransition(order.status, status)) {
      throw new HttpError(409, 'invalid_transition', `Cannot move from ${order.status} to ${status}`);
    }
    const at = nowIso();
    await db.batch([
      db.update(orders).set({ status, updatedAt: at }).where(eq(orders.id, id)),
      db.insert(orderStatusHistory).values({
        id: newId('hst'),
        orderId: id,
        status,
        note,
        byEmail: c.get('admin').email,
        createdAt: at,
      }),
    ]);
    if (status === 'cancelled') await restockOrder(c.env, db, id, order.cityId);
    await audit(c, 'order.status', 'order', id, { from: order.status, to: status });
    return c.json({ ok: true });
  })
  .patch('/orders/:id/rider', validate('json', z.object({ riderId: z.string().nullable() })), async (c) => {
    const id = c.req.param('id');
    await c
      .get('db')
      .update(orders)
      .set({ riderId: c.req.valid('json').riderId, updatedAt: nowIso() })
      .where(eq(orders.id, id));
    await audit(c, 'order.rider', 'order', id, c.req.valid('json'));
    return c.json({ ok: true });
  })
  .patch('/orders/:id/cod', validate('json', z.object({ collected: z.boolean() })), async (c) => {
    const id = c.req.param('id');
    await c
      .get('db')
      .update(orders)
      .set({ codCollected: c.req.valid('json').collected, updatedAt: nowIso() })
      .where(eq(orders.id, id));
    await audit(c, 'order.cod', 'order', id, c.req.valid('json'));
    return c.json({ ok: true });
  })
  /** What to prepare for a delivery date: total qty per variant across active orders. */
  .get(
    '/prep-list',
    validate('query', z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })),
    async (c) => {
      const rows = await c
        .get('db')
        .select({
          productName: orderItems.productName,
          variantLabel: orderItems.variantLabel,
          qty: sql<number>`sum(${orderItems.qty})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(
          and(
            eq(orderItems.deliveryDate, c.req.valid('query').date),
            inArray(orders.status, [...ACTIVE_ORDER_STATUSES]),
          ),
        )
        .groupBy(orderItems.productName, orderItems.variantLabel)
        .orderBy(asc(orderItems.productName));
      return c.json(rows);
    },
  )
  .get('/riders', async (c) => c.json(await c.get('db').select().from(riders)));

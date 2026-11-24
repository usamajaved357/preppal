import { notifySubscribers, orderItems, orderStatusHistory, orders } from '@preppal/db';
import { createOrderSchema, type OrderTrackDto, phoneSchema, trackOrderSchema } from '@preppal/shared';
import { and, asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../../env';
import { notFound } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { sendNewOrderAlerts } from '../../lib/notify';
import { validate } from '../../lib/validate';
import { createOrder } from '../../services/orders';

export const orderRoutes = new Hono<AppEnv>()
  .post('/orders', validate('json', createOrderSchema), async (c) => {
    const { created, alert, alertEmails } = await createOrder(c.env, c.get('db'), c.req.valid('json'));
    c.executionCtx.waitUntil(sendNewOrderAlerts(c.env, alertEmails, alert));
    return c.json(created, 201);
  })
  .get('/orders/track', validate('query', trackOrderSchema), async (c) => {
    const { number, phone } = c.req.valid('query');
    const db = c.get('db');
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.number, number.toUpperCase()), eq(orders.customerPhone, phone)))
      .limit(1);
    if (!order) throw notFound('Order');
    const [items, history] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
      db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, order.id))
        .orderBy(asc(orderStatusHistory.createdAt)),
    ]);
    const body: OrderTrackDto = {
      orderNumber: order.number,
      status: order.status,
      deliveryDate: order.deliveryDate,
      totalPkr: order.totalPkr,
      items: items.map((i) => ({
        name: i.productName,
        variantLabel: i.variantLabel,
        qty: i.qty,
        lineTotalPkr: i.lineTotalPkr,
      })),
      history: history.map((h) => ({ status: h.status as OrderTrackDto['status'], at: h.createdAt })),
    };
    return c.json(body);
  })
  .post(
    '/notify',
    validate('json', z.object({ phone: phoneSchema, topic: z.string().min(2).max(80) })),
    async (c) => {
      const { phone, topic } = c.req.valid('json');
      await c
        .get('db')
        .insert(notifySubscribers)
        .values({ id: newId('sub'), phone, topic })
        .onConflictDoNothing();
      return c.json({ ok: true });
    },
  );

import { adminUsers, cities, deliveryAreas, riders } from '@preppal/db';
import {
  adminUserInputSchema,
  areaInputSchema,
  cityInputSchema,
  riderInputSchema,
  settingsSchema,
} from '@preppal/shared';
import { asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../../env';
import { audit } from '../../lib/audit';
import { HttpError } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { loadSettings, saveSettings } from '../../lib/settings';
import { validate } from '../../lib/validate';
import {
  areaCountByCity,
  deleteAdmin,
  deleteArea,
  deleteCity,
  deleteRider,
  orderCountByArea,
} from '../../services/admin';

const ownerOnly = (role: string) => {
  if (role !== 'owner') throw new HttpError(403, 'forbidden', 'Only the owner can do this');
};

/** Cities, delivery areas, riders, admin users, settings, image uploads. */
export const adminSetupRoutes = new Hono<AppEnv>()
  .get('/me', (c) => c.json(c.get('admin')))

  // ── Cities & areas ──
  .get('/cities', async (c) => {
    const db = c.get('db');
    const [rows, counts] = await Promise.all([db.select().from(cities), areaCountByCity(db)]);
    return c.json(rows.map((r) => ({ ...r, areaCount: counts.get(r.id) ?? 0 })));
  })
  .post('/cities', validate('json', cityInputSchema), async (c) => {
    ownerOnly(c.get('admin').role);
    const id = newId('city');
    await c
      .get('db')
      .insert(cities)
      .values({ id, ...c.req.valid('json') });
    await audit(c, 'city.create', 'city', id);
    return c.json({ id }, 201);
  })
  .put('/cities/:id', validate('json', cityInputSchema), async (c) => {
    ownerOnly(c.get('admin').role);
    await c
      .get('db')
      .update(cities)
      .set(c.req.valid('json'))
      .where(eq(cities.id, c.req.param('id')));
    await audit(c, 'city.update', 'city', c.req.param('id'));
    return c.json({ ok: true });
  })
  .delete('/cities/:id', async (c) => {
    ownerOnly(c.get('admin').role);
    await deleteCity(c.get('db'), c.req.param('id'));
    await audit(c, 'city.delete', 'city', c.req.param('id'));
    return c.json({ ok: true });
  })
  .get('/areas', async (c) => {
    const db = c.get('db');
    const [rows, counts] = await Promise.all([
      db.select().from(deliveryAreas).orderBy(asc(deliveryAreas.sortOrder)),
      orderCountByArea(db),
    ]);
    return c.json(rows.map((r) => ({ ...r, orderCount: counts.get(r.id) ?? 0 })));
  })
  .post('/areas', validate('json', areaInputSchema), async (c) => {
    const id = newId('area');
    await c
      .get('db')
      .insert(deliveryAreas)
      .values({ id, ...c.req.valid('json') });
    await audit(c, 'area.create', 'area', id);
    return c.json({ id }, 201);
  })
  .put('/areas/:id', validate('json', areaInputSchema), async (c) => {
    await c
      .get('db')
      .update(deliveryAreas)
      .set(c.req.valid('json'))
      .where(eq(deliveryAreas.id, c.req.param('id')));
    await audit(c, 'area.update', 'area', c.req.param('id'));
    return c.json({ ok: true });
  })
  .delete('/areas/:id', async (c) => {
    await deleteArea(c.get('db'), c.req.param('id'));
    await audit(c, 'area.delete', 'area', c.req.param('id'));
    return c.json({ ok: true });
  })

  // ── Riders ──
  .post('/riders', validate('json', riderInputSchema), async (c) => {
    const id = newId('rdr');
    await c
      .get('db')
      .insert(riders)
      .values({ id, ...c.req.valid('json') });
    await audit(c, 'rider.create', 'rider', id);
    return c.json({ id }, 201);
  })
  .put('/riders/:id', validate('json', riderInputSchema), async (c) => {
    await c
      .get('db')
      .update(riders)
      .set(c.req.valid('json'))
      .where(eq(riders.id, c.req.param('id')));
    await audit(c, 'rider.update', 'rider', c.req.param('id'));
    return c.json({ ok: true });
  })
  .delete('/riders/:id', async (c) => {
    await deleteRider(c.get('db'), c.req.param('id'));
    await audit(c, 'rider.delete', 'rider', c.req.param('id'));
    return c.json({ ok: true });
  })

  // ── Admin users (owner only) ──
  .get('/admins', async (c) => {
    ownerOnly(c.get('admin').role);
    return c.json(await c.get('db').select().from(adminUsers));
  })
  .post('/admins', validate('json', adminUserInputSchema), async (c) => {
    ownerOnly(c.get('admin').role);
    const id = newId('adm');
    await c
      .get('db')
      .insert(adminUsers)
      .values({ id, ...c.req.valid('json') });
    await audit(c, 'admin.create', 'admin', id, { email: c.req.valid('json').email });
    return c.json({ id }, 201);
  })
  .put('/admins/:id', validate('json', adminUserInputSchema), async (c) => {
    ownerOnly(c.get('admin').role);
    await c
      .get('db')
      .update(adminUsers)
      .set(c.req.valid('json'))
      .where(eq(adminUsers.id, c.req.param('id')));
    await audit(c, 'admin.update', 'admin', c.req.param('id'));
    return c.json({ ok: true });
  })
  .delete('/admins/:id', async (c) => {
    ownerOnly(c.get('admin').role);
    await deleteAdmin(c.get('db'), c.req.param('id'), c.get('admin').email);
    await audit(c, 'admin.delete', 'admin', c.req.param('id'));
    return c.json({ ok: true });
  })

  // ── Settings ──
  .get('/settings', async (c) => c.json(await loadSettings(c.get('db'))))
  .put('/settings', validate('json', settingsSchema), async (c) => {
    ownerOnly(c.get('admin').role);
    await saveSettings(c.get('db'), c.req.valid('json'));
    await audit(c, 'settings.update', 'settings', null, c.req.valid('json'));
    return c.json({ ok: true });
  })

  // ── Image upload (browser resizes to WebP first; we only store) ──
  .post('/uploads', async (c) => {
    const form = await c.req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new HttpError(400, 'no_file', 'Attach a file in the "file" field');
    if (!file.type.startsWith('image/')) throw new HttpError(400, 'bad_type', 'Images only');
    if (file.size > 3 * 1024 * 1024) throw new HttpError(400, 'too_large', 'Max 3 MB — resize before upload');
    const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
    const key = `products/${crypto.randomUUID()}.${ext}`;
    await c.env.IMAGES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    await audit(c, 'image.upload', 'image', key);
    return c.json({ key, url: `/api/img/${key}` }, 201);
  });

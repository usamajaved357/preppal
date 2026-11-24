import { Hono } from 'hono';
import type { AppEnv } from '../../env';
import { notFound } from '../../lib/errors';

/** Streams uploaded images from R2. Long-lived cache: keys are immutable (new upload = new key). */
export const imageRoutes = new Hono<AppEnv>().get('/img/*', async (c) => {
  const key = c.req.path.replace(/^\/api\/img\//, '');
  const obj = await c.env.IMAGES.get(key);
  if (!obj) throw notFound('Image');
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
});

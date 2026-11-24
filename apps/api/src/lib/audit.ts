import { auditLog } from '@preppal/db';
import type { Context } from 'hono';
import type { AppEnv } from '../env';
import { newId } from './ids';

/** Records an admin action. Never throws. */
export async function audit(
  c: Context<AppEnv>,
  action: string,
  entity: string,
  entityId: string | null,
  data?: unknown,
) {
  try {
    await c
      .get('db')
      .insert(auditLog)
      .values({
        id: newId('aud'),
        actorEmail: c.get('admin')?.email ?? null,
        action,
        entity,
        entityId,
        data: data ?? null,
      });
  } catch (e) {
    console.error('audit failed', e);
  }
}

import { settings } from '@preppal/db';
import { DEFAULT_SETTINGS, type Settings, settingsSchema } from '@preppal/shared';
import type { Variables } from '../env';

/** Reads all settings rows and merges them over defaults. Invalid stored values fall back to defaults. */
export async function loadSettings(db: Variables['db']): Promise<Settings> {
  const rows = await db.select().from(settings);
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const merged = { ...DEFAULT_SETTINGS, alertEmails: [], ...stored };
  const parsed = settingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : { ...DEFAULT_SETTINGS, alertEmails: [] };
}

export async function saveSettings(db: Variables['db'], value: Settings): Promise<void> {
  const now = new Date().toISOString();
  const [first, ...rest] = Object.entries(value).map(([key, v]) =>
    db
      .insert(settings)
      .values({ key, value: v, updatedAt: now })
      .onConflictDoUpdate({ target: settings.key, set: { value: v, updatedAt: now } }),
  );
  if (first) await db.batch([first, ...rest]);
}

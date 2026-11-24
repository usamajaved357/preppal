import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './constants';
import { categoryDeleteQuerySchema, settingsSchema } from './schemas';

describe('settingsSchema', () => {
  it('accepts settings saved before the storefront controls existed', () => {
    const old = {
      cutoffHour: 23,
      deliveryByLabel: '5 PM',
      maxDaysAhead: 2,
      minOrderPkr: 0,
      whatsappNumber: '923285228505',
      instagramHandle: 'preppal.swl',
      alertEmails: [],
    };
    const parsed = settingsSchema.parse(old);
    expect(parsed.ordersPaused).toBe(false);
    expect(parsed.announcement).toBe('');
  });

  it('round-trips the defaults', () => {
    expect(settingsSchema.parse({ ...DEFAULT_SETTINGS, alertEmails: [] }).pauseMessage).toBe(
      DEFAULT_SETTINGS.pauseMessage,
    );
  });

  it('caps the announcement length', () => {
    const r = settingsSchema.safeParse({ ...DEFAULT_SETTINGS, announcement: 'x'.repeat(161) });
    expect(r.success).toBe(false);
  });
});

describe('categoryDeleteQuerySchema', () => {
  it('makes moveTo optional', () => {
    expect(categoryDeleteQuerySchema.parse({})).toEqual({});
    expect(categoryDeleteQuerySchema.parse({ moveTo: 'cat_x' }).moveTo).toBe('cat_x');
  });
});

import { describe, expect, it } from 'vitest';
import { canTransition } from './order-status';
import { addDays, availableDeliveryDates, businessNow } from './time';

describe('time', () => {
  it('converts to Asia/Karachi (UTC+5)', () => {
    // 2026-11-23 18:30 UTC = 2026-11-23 23:30 PKT
    expect(businessNow(new Date('2026-11-23T18:30:00Z'))).toMatchObject({ date: '2026-11-23', hour: 23 });
  });

  it('adds days across month ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });

  it('before cutoff → tomorrow is earliest', () => {
    // 2026-11-23 10:00 PKT
    const dates = availableDeliveryDates({
      now: new Date('2026-11-23T05:00:00Z'),
      cutoffHour: 23,
      maxDaysAhead: 2,
    });
    expect(dates).toEqual(['2026-11-24', '2026-11-25']);
  });

  it('after cutoff → day after tomorrow is earliest', () => {
    // 2026-11-23 23:30 PKT
    const dates = availableDeliveryDates({
      now: new Date('2026-11-23T18:30:00Z'),
      cutoffHour: 23,
      maxDaysAhead: 1,
    });
    expect(dates).toEqual(['2026-11-25']);
  });
});

describe('order status machine', () => {
  it('allows the happy path and blocks skips', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
    expect(canTransition('pending', 'delivered')).toBe(false);
    expect(canTransition('delivered', 'cancelled')).toBe(false);
  });
});

import { BUSINESS_TZ } from './constants';

/** Returns { date: 'YYYY-MM-DD', hour } for `now` in the business timezone. */
export function businessNow(now: Date = new Date()): { date: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

/** Adds whole days to a YYYY-MM-DD string (calendar maths, timezone-free). */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Delivery dates a customer can pick right now.
 * Before the cutoff hour → tomorrow is the earliest; at/after cutoff → day after tomorrow.
 */
export function availableDeliveryDates(opts: {
  now?: Date;
  cutoffHour: number;
  maxDaysAhead: number;
}): string[] {
  const { date, hour } = businessNow(opts.now);
  const earliest = addDays(date, hour < opts.cutoffHour ? 1 : 2);
  return Array.from({ length: Math.max(1, opts.maxDaysAhead) }, (_, i) => addDays(earliest, i));
}

/** Milliseconds until today's cutoff in the business TZ (0 if already passed). */
export function msUntilCutoff(cutoffHour: number, now: Date = new Date()): number {
  const { hour, minute } = businessNow(now);
  const secondsNow = hour * 3600 + minute * 60 + now.getUTCSeconds();
  const secondsCut = cutoffHour * 3600;
  return Math.max(0, (secondsCut - secondsNow) * 1000);
}

export function formatDeliveryDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

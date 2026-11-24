import { formatDeliveryDate, formatPkr } from '@preppal/shared';
import type { Bindings } from '../env';

export interface NewOrderAlert {
  number: string;
  customerName: string;
  customerPhone: string;
  areaName: string;
  address: string;
  deliveryDate: string;
  totalPkr: number;
  items: { name: string; label: string; qty: number }[];
}

function text(o: NewOrderAlert): string {
  const lines = o.items.map((i) => `• ${i.name} (${i.label}) × ${i.qty}`).join('\n');
  return [
    `New order ${o.number}`,
    `${o.customerName} · ${o.customerPhone}`,
    `${o.areaName} — ${o.address}`,
    `Deliver: ${formatDeliveryDate(o.deliveryDate)}`,
    lines,
    `Total (COD): ${formatPkr(o.totalPkr)}`,
  ].join('\n');
}

/**
 * Fire-and-forget alerts for a new order. Each channel is optional:
 *  - Telegram: free, instant (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)
 *  - Email via Resend: free tier 100/day (RESEND_API_KEY + settings.alertEmails); needs a verified domain
 * Failures are logged, never thrown — an alert must not fail an order.
 */
export async function sendNewOrderAlerts(
  env: Bindings,
  alertEmails: string[],
  o: NewOrderAlert,
): Promise<void> {
  const body = text(o);
  const jobs: Promise<unknown>[] = [];

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: body }),
      }),
    );
  }

  if (env.RESEND_API_KEY && alertEmails.length > 0) {
    jobs.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: env.ALERT_FROM_EMAIL,
          to: alertEmails,
          subject: `New order ${o.number} · ${formatPkr(o.totalPkr)}`,
          text: body,
        }),
      }),
    );
  }

  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === 'rejected') console.error('alert failed', r.reason);
}

export function whatsappOrderUrl(
  whatsappNumber: string,
  o: Pick<NewOrderAlert, 'number' | 'items' | 'totalPkr'>,
) {
  const msg = `Assalam o Alaikum! I just placed order ${o.number} on the Preppal website:\n${o.items
    .map((i) => `• ${i.name} (${i.label}) × ${i.qty}`)
    .join('\n')}\nTotal: ${formatPkr(o.totalPkr)} (cash on delivery)`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
}

import { formatPkr, ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from '@preppal/shared';
import { IconChevronRight, IconOrders, IconWhatsApp } from '../../components/icons';
import { Avatar, Badge, Button, EmptyState, Skeleton } from '../../components/ui';
import type { AdminOrder } from '../../lib/api';
import { whatsappLink } from '../../lib/site';
import { ACTION_LABEL, isNegative, STATUS_TONE, useOrderActions, whatsappText } from './status';

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Karachi' });

export function OrderList({
  orders,
  loading,
  filtered,
  onOpen,
}: {
  orders: AdminOrder[];
  loading: boolean;
  filtered: boolean;
  onOpen: (o: AdminOrder) => void;
}) {
  const { move, status } = useOrderActions();

  if (loading)
    return (
      <div className="flex flex-col gap-3 p-5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  if (orders.length === 0)
    return (
      <EmptyState icon={<IconOrders />} title={filtered ? 'No matching orders' : 'No orders yet'}>
        {filtered
          ? 'Try another tab or clear the search.'
          : 'New orders for this delivery day appear here on their own.'}
      </EmptyState>
    );

  return (
    <ul className="divide-y divide-line border-t border-line">
      {orders.map((o) => {
        const next = ORDER_TRANSITIONS[o.status].find((s) => !isNegative(s));
        const units = o.items.reduce((a, i) => a + i.qty, 0);
        return (
          <li key={o.id} className="group flex items-center gap-3 pr-4 transition hover:bg-subtle">
            <button
              type="button"
              onClick={() => onOpen(o)}
              className="flex min-w-0 flex-1 items-center gap-3.5 py-3.5 pl-5 text-left"
            >
              <Avatar name={o.customerName} className="hidden sm:grid" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[15px] font-bold text-ink">{o.customerName}</span>
                  <span className="rounded-md bg-subtle px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted ring-1 ring-line">
                    {o.number}
                  </span>
                  {o.notes && <Badge tone="clay">Note</Badge>}
                </div>
                <div className="mt-0.5 truncate text-[13px] text-muted">
                  {time(o.createdAt)} · {o.areaName} · {o.addressLine1}
                </div>
                <div className="mt-0.5 truncate text-[13px] text-ink-soft">
                  <span className="font-semibold">
                    {units} item{units === 1 ? '' : 's'}
                  </span>{' '}
                  · {o.items.map((i) => `${i.productName} ${i.variantLabel} ×${i.qty}`).join(', ')}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge tone={STATUS_TONE[o.status]} dot>
                  {ORDER_STATUS_LABEL[o.status]}
                </Badge>
                <div className="text-right text-[15px] font-bold text-ink tabular-nums">
                  {formatPkr(o.totalPkr)}
                  <span
                    className={`ml-1.5 text-xs font-semibold ${o.codCollected ? 'text-forest' : 'text-faint'}`}
                  >
                    {o.codCollected ? 'Paid' : 'COD'}
                  </span>
                </div>
              </div>
            </button>
            <div className="flex shrink-0 items-center gap-1" data-print-hide>
              {next && (
                <div className="hidden sm:block">
                  <Button
                    size="sm"
                    className="w-[122px]"
                    disabled={status.isPending}
                    onClick={() => move(o, next)}
                  >
                    {ACTION_LABEL[next]}
                  </Button>
                </div>
              )}
              <a
                href={whatsappLink(o.customerPhone, whatsappText(o))}
                target="_blank"
                rel="noreferrer"
                aria-label={`WhatsApp ${o.customerName}`}
                title="Message on WhatsApp"
                className="grid h-8 w-8 place-items-center rounded-full text-forest transition hover:bg-sage-soft"
              >
                <IconWhatsApp width={18} height={18} />
              </a>
              <IconChevronRight className="hidden text-line-strong transition group-hover:text-muted md:block" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

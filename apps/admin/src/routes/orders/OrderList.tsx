import { formatPkr, ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from '@preppal/shared';
import { useQuery } from '@tanstack/react-query';
import { IconOrders, IconTruck, IconWhatsApp } from '../../components/icons';
import { Avatar, Badge, Button, EmptyState, Skeleton } from '../../components/ui';
import { type AdminOrder, type AdminRider, get } from '../../lib/api';
import { whatsappLink } from '../../lib/site';
import { ACTION_LABEL, isNegative, STATUS_TONE, useOrderActions, whatsappText } from './status';

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Karachi' });

/** Wide layout columns (board ≥ 48rem): customer · items · status · total · action. */
const COLS = '@3xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_9.5rem_6.5rem_11.5rem]';

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
  const riders = useQuery({ queryKey: ['riders'], queryFn: () => get<AdminRider[]>('/admin/riders') });
  const riderName = (id: string | null) => riders.data?.find((r) => r.id === id)?.name;

  if (loading)
    return (
      <div className="flex flex-col gap-3 p-5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20" />
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
    <div className="@container border-t border-line">
      <div
        className={`hidden gap-5 border-b border-line bg-subtle px-5 py-2.5 text-[11px] font-bold tracking-[0.08em] text-faint uppercase @3xl:grid ${COLS}`}
      >
        <span>Customer</span>
        <span>Items</span>
        <span>Status</span>
        <span className="text-right">Total</span>
        <span className="sr-only">Next step</span>
      </div>
      <ul className="divide-y divide-line">
        {orders.map((o) => (
          <OrderRow key={o.id} o={o} rider={riderName(o.riderId)} onOpen={() => onOpen(o)} />
        ))}
      </ul>
    </div>
  );
}

function OrderRow({ o, rider, onOpen }: { o: AdminOrder; rider?: string; onOpen: () => void }) {
  const { move, status } = useOrderActions();
  const next = ORDER_TRANSITIONS[o.status].find((s) => !isNegative(s));
  const units = o.items.reduce((a, i) => a + i.qty, 0);
  const shown = o.items.slice(0, 2);
  const closed = o.status === 'delivered' || o.status === 'cancelled';

  const statusBadge = (
    <Badge tone={STATUS_TONE[o.status]} dot>
      {ORDER_STATUS_LABEL[o.status]}
    </Badge>
  );
  const payment = (
    <span
      className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-bold tracking-wide ${
        o.codCollected ? 'bg-sage-soft text-forest' : 'bg-stone-soft text-muted'
      }`}
    >
      {o.codCollected ? 'PAID' : 'COD'}
    </span>
  );

  return (
    <li className={`group relative transition hover:bg-subtle/80 ${closed ? 'opacity-75' : ''}`}>
      {/* Whole row opens the drawer; buttons sit above this layer. */}
      <button type="button" onClick={onOpen} aria-label={`Open order ${o.number}`} className="absolute inset-0 z-0" />

      <div className={`grid grid-cols-1 gap-x-5 gap-y-3 px-5 py-4 @3xl:items-center ${COLS}`}>
        {/* Customer */}
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={o.customerName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="truncate text-[15px] font-bold text-ink">{o.customerName}</span>
                {o.notes && (
                  <span title={o.notes}>
                    <Badge tone="clay">Note</Badge>
                  </span>
                )}
              </div>
              <span className="@3xl:hidden">{statusBadge}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              <span className="font-mono font-semibold text-ink-soft">{o.number}</span>
              <span className="text-faint">·</span>
              <span>{time(o.createdAt)}</span>
            </div>
            <div className="mt-0.5 truncate text-[13px] text-muted" title={`${o.areaName} · ${o.addressLine1}`}>
              {o.areaName} · {o.addressLine1}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="min-w-0 @md:pl-[52px] @3xl:pl-0">
          <div className="text-[11px] font-bold tracking-[0.08em] text-faint uppercase @3xl:hidden">
            {units} item{units === 1 ? '' : 's'}
          </div>
          <ul className="flex flex-col gap-0.5 text-[13px]">
            {shown.map((i) => (
              <li key={i.id} className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate font-medium text-ink">{i.productName}</span>
                <span className="shrink-0 text-muted">
                  {i.variantLabel} × {i.qty}
                </span>
              </li>
            ))}
            {o.items.length > shown.length && (
              <li className="text-xs font-semibold text-forest">+{o.items.length - shown.length} more</li>
            )}
          </ul>
        </div>

        {/* Status (wide only — narrow shows it beside the name) */}
        <div className="hidden min-w-0 flex-col items-start gap-1 @3xl:flex">
          {statusBadge}
          <span className={`flex items-center gap-1 text-xs ${rider ? 'text-muted' : 'text-faint'}`}>
            <IconTruck width={13} height={13} />
            <span className="truncate">{rider ?? 'No rider yet'}</span>
          </span>
        </div>

        {/* Total + actions: one footer row when narrow, two columns when wide */}
        <div className="flex items-center justify-between gap-3 border-t border-dashed border-line pt-3 @md:pl-[52px] @3xl:contents">
          <div className="flex items-center gap-2 @3xl:flex-col @3xl:items-end @3xl:gap-1">
            <span className="text-[15px] font-bold whitespace-nowrap text-ink tabular-nums">{formatPkr(o.totalPkr)}</span>
            {payment}
          </div>
          <div className="relative z-10 flex min-w-0 items-center justify-end gap-2">
            {next ? (
              <Button
                size="sm"
                className="h-9 @3xl:min-w-[124px]"
                disabled={status.isPending}
                onClick={() => move(o, next)}
              >
                {ACTION_LABEL[next]}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" className="h-9 min-w-[124px]" onClick={onOpen}>
                View details
              </Button>
            )}
            <a
              href={whatsappLink(o.customerPhone, whatsappText(o))}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp ${o.customerName}`}
              title="Message on WhatsApp"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-forest shadow-card transition hover:border-forest/40 hover:bg-sage-soft"
            >
              <IconWhatsApp width={17} height={17} />
            </a>
          </div>
        </div>
      </div>
    </li>
  );
}

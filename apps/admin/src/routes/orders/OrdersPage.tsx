import {
  addDays,
  businessNow,
  formatDeliveryDate,
  ORDER_STATUS_LABEL,
  ORDER_STATUSES,
  type OrderStatus,
  type PublicSettingsDto,
} from '@preppal/shared';
import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { IconCash, IconCheck, IconClock, IconOrders, IconPrinter, IconSearch } from '../../components/icons';
import { Button, ErrorNote, Input, PageHeader } from '../../components/ui';
import { type AdminOrder, get } from '../../lib/api';
import { formatAmount } from '../../lib/site';
import { OrderDrawer } from './OrderDrawer';
import { OrderList } from './OrderList';
import { PrepList, printSection } from './PrepList';

type Filter = OrderStatus | 'all' | 'open';

export function OrdersPage() {
  const settings = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => get<PublicSettingsDto>('/settings'),
  });
  const today = businessNow().date;
  const [date, setDate] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    if (!date && settings.data?.deliveryDates[0]) setDate(settings.data.deliveryDates[0]);
  }, [settings.data, date]);

  const orders = useQuery({
    queryKey: ['orders', date],
    queryFn: () => get<AdminOrder[]>(`/admin/orders?date=${date}`),
    enabled: !!date,
    refetchInterval: 30_000,
  });

  const all = orders.data ?? [];
  const count = (s: OrderStatus) => all.filter((o) => o.status === s).length;
  const live = all.filter((o) => o.status !== 'cancelled');
  const expected = live.reduce((a, o) => a + o.totalPkr, 0);
  const collected = live.filter((o) => o.codCollected).reduce((a, o) => a + o.totalPkr, 0);
  const delivered = count('delivered');

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((o) => {
      if (filter === 'open' && ['delivered', 'cancelled'].includes(o.status)) return false;
      if (filter !== 'all' && filter !== 'open' && o.status !== filter) return false;
      if (!q) return true;
      return [o.number, o.customerName, o.customerPhone, o.areaName, o.addressLine1].some((f) =>
        f.toLowerCase().includes(q),
      );
    });
  }, [all, filter, search]);

  const dayChips = useMemo(() => {
    const dates = [today, ...(settings.data?.deliveryDates ?? [])];
    return [...new Set(dates)].map((d) => ({
      value: d,
      label:
        d === today ? 'Today' : d === addDays(today, 1) ? 'Tomorrow' : formatDeliveryDate(d).split(' ')[0],
      sub: formatDeliveryDate(d).split(' ').slice(1).join(' '),
    }));
  }, [settings.data, today]);

  const openOrder = all.find((o) => o.id === openId) ?? null;

  return (
    <>
      <PageHeader
        kicker={
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest" />
            Live · updates every 30 s
          </span>
        }
        title="Orders"
        subtitle={date ? `Deliveries for ${formatDeliveryDate(date)}` : 'Loading delivery days…'}
        actions={
          <>
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-card ring-1 ring-line">
              {dayChips.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={date === d.value}
                  onClick={() => setDate(d.value)}
                  className={`flex shrink-0 flex-col items-start rounded-lg px-3 py-1.5 text-left whitespace-nowrap transition ${
                    date === d.value ? 'bg-forest text-white' : 'text-ink hover:bg-sand'
                  }`}
                >
                  <span className="text-[13px] leading-tight font-semibold">{d.label}</span>
                  <span className={`text-[11px] ${date === d.value ? 'text-sage' : 'text-muted'}`}>
                    {d.sub}
                  </span>
                </button>
              ))}
              <Input
                type="date"
                aria-label="Pick another delivery day"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="h-11 w-[42px] shrink-0 cursor-pointer border-0 px-2 text-sm text-transparent hover:bg-sand focus:ring-0 sm:w-[150px] sm:text-ink"
              />
            </div>
            <Button variant="secondary" onClick={() => printSection('orders')}>
              <IconPrinter width={17} height={17} /> Print
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4" data-print-hide>
        <Kpi icon={<IconOrders />} label="Orders" value={String(live.length)}>
          {count('cancelled') > 0 ? `${count('cancelled')} cancelled` : 'for this day'}
        </Kpi>
        <Kpi
          icon={<IconClock />}
          label="To confirm"
          value={String(count('pending'))}
          highlight={count('pending') > 0}
          onClick={count('pending') ? () => setFilter('pending') : undefined}
        >
          {count('pending') > 0 ? 'Tap to review' : 'All caught up'}
        </Kpi>
        <Kpi icon={<IconCash />} label="Cash to collect" value={formatAmount(expected - collected)}>
          <Progress value={collected} max={expected} />
          {formatAmount(collected)} of {formatAmount(expected)} collected
        </Kpi>
        <Kpi icon={<IconCheck />} label="Delivered" value={`${delivered}/${live.length}`}>
          <Progress value={delivered} max={live.length} />
          {live.length - delivered > 0 ? `${live.length - delivered} still to go` : 'Day complete'}
        </Kpi>
      </div>

      <ErrorNote error={orders.error} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section
          data-print-section="orders"
          className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-card"
        >
          <div className="flex flex-col gap-3 border-b border-line p-3 sm:p-4" data-print-hide>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
              <Input
                type="search"
                placeholder="Search name, phone, order # or area"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
              <FilterTab active={filter === 'all'} onClick={() => setFilter('all')} n={all.length}>
                All
              </FilterTab>
              <FilterTab
                active={filter === 'open'}
                onClick={() => setFilter('open')}
                n={all.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length}
              >
                Open
              </FilterTab>
              {ORDER_STATUSES.filter((s) => count(s) > 0 || s === 'pending').map((s) => (
                <FilterTab key={s} active={filter === s} onClick={() => setFilter(s)} n={count(s)}>
                  {ORDER_STATUS_LABEL[s]}
                </FilterTab>
              ))}
            </div>
          </div>
          <OrderList
            orders={list}
            loading={orders.isLoading || !date}
            filtered={all.length > 0}
            onOpen={(o) => setOpenId(o.id)}
          />
        </section>

        <PrepList date={date} />
      </div>

      {openOrder && <OrderDrawer order={openOrder} onClose={() => setOpenId(null)} />}
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  children,
  highlight,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  children?: ReactNode;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg ${highlight ? 'bg-amber-soft text-amber-ink' : 'bg-sage-soft text-forest'}`}
        >
          {icon}
        </span>
      </div>
      <div
        className={`mt-1 font-display text-[26px] leading-tight font-bold tabular-nums ${highlight ? 'text-amber-ink' : 'text-forest'}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted">{children}</div>
    </>
  );
  const cls = `rounded-2xl border bg-white p-4 text-left shadow-card transition ${highlight ? 'border-amber-ink/25' : 'border-line'}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} hover:-translate-y-0.5 hover:shadow-pop`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-sand">
      <div className="h-full rounded-full bg-forest transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function FilterTab({
  active,
  n,
  children,
  onClick,
}: {
  active: boolean;
  n: number;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition ${
        active ? 'bg-forest text-white' : 'bg-canvas text-ink hover:bg-sand'
      }`}
    >
      {children}
      <span
        className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] tabular-nums ${active ? 'bg-white/20' : 'bg-white text-muted'}`}
      >
        {n}
      </span>
    </button>
  );
}

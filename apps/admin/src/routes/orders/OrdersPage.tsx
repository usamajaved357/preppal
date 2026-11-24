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
import { useEffect, useMemo, useState } from 'react';
import { IconCash, IconCheck, IconClock, IconOrders, IconPause, IconPrinter } from '../../components/icons';
import { Button, Card, ErrorNote, Input, SearchInput, Segmented, StatStrip } from '../../components/ui';
import { type AdminOrder, get } from '../../lib/api';
import { useMe } from '../../lib/me';
import { formatAmount } from '../../lib/site';
import { OrderDrawer } from './OrderDrawer';
import { OrderList } from './OrderList';
import { PrepList, printSection } from './PrepList';

type Filter = OrderStatus | 'all' | 'open';

const greeting = () => {
  const h = businessNow().hour;
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export function OrdersPage() {
  const me = useMe();
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
  const pending = count('pending');
  const open = all.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;

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
      label: d === today ? 'Today' : d === addDays(today, 1) ? 'Tomorrow' : formatDeliveryDate(d),
    }));
  }, [settings.data, today]);

  const openOrder = all.find((o) => o.id === openId) ?? null;
  const firstName = me.data?.name.split(' ')[0] ?? '';

  return (
    <>
      {/* Greeting hero */}
      <section
        className="hero-wash relative mb-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-card"
        data-print-hide
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-forest via-sage to-terra" />
        <div className="flex flex-wrap items-end justify-between gap-5 px-6 pt-6 pb-5">
          <div>
            <div className="text-xs font-bold tracking-[0.12em] text-muted uppercase">
              {new Date().toLocaleDateString('en-PK', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'Asia/Karachi',
              })}
            </div>
            <h1 className="mt-1 text-[28px] leading-tight font-bold text-ink">
              {greeting()}
              {firstName && `, ${firstName}`}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {pending > 0 ? (
                <>
                  <strong className="text-ink">
                    {pending} order{pending === 1 ? '' : 's'} need{pending === 1 ? 's' : ''} confirming.
                  </strong>{' '}
                  {open - pending > 0
                    ? `${open - pending} more in progress.`
                    : 'Everything else is on track.'}
                </>
              ) : (
                <>
                  <strong className="text-ink">All caught up.</strong>{' '}
                  {date ? `Showing deliveries for ${formatDeliveryDate(date)}.` : ''}
                </>
              )}
              {settings.data?.ordersPaused && (
                <span className="ml-2 inline-flex items-center gap-1 font-semibold text-amber-ink">
                  <IconPause width={14} height={14} /> New orders are paused
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented value={date} onChange={setDate} options={dayChips} />
            <div className="w-[150px]">
              <Input
                type="date"
                aria-label="Pick another delivery day"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="h-9 rounded-full text-sm"
              />
            </div>
            <Button variant="secondary" size="sm" className="h-9" onClick={() => printSection('orders')}>
              <IconPrinter width={16} height={16} /> Print
            </Button>
          </div>
        </div>
      </section>

      <StatStrip
        className="mb-5"
        stats={[
          {
            icon: <IconOrders width={18} height={18} />,
            tone: 'sky',
            label: 'Orders',
            value: live.length,
            sub: count('cancelled') ? `${count('cancelled')} cancelled` : 'For this delivery day',
          },
          {
            icon: <IconClock width={18} height={18} />,
            tone: 'amber',
            label: 'To confirm',
            value: pending,
            highlight: pending > 0,
            sub: pending ? 'Tap to review' : 'All caught up',
            onClick: pending ? () => setFilter('pending') : undefined,
          },
          {
            icon: <IconCash width={18} height={18} />,
            tone: 'green',
            label: 'Cash to collect',
            value: formatAmount(expected - collected),
            sub: `${formatAmount(collected)} of ${formatAmount(expected)} collected`,
          },
          {
            icon: <IconCheck width={18} height={18} />,
            tone: 'plum',
            label: 'Delivered',
            value: `${delivered}/${live.length}`,
            sub: live.length - delivered > 0 ? `${live.length - delivered} still to go` : 'Day complete',
          },
        ]}
      />

      <ErrorNote error={orders.error} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div data-print-section="orders" className="min-w-0">
          <Card
            icon={<IconOrders width={18} height={18} />}
            tone="sky"
            title="Delivery board"
            description="Click an order for details, rider and payment. Refreshes every 30 seconds."
            bodyClassName="pt-4"
            className="min-w-0 overflow-hidden"
          >
            <div className="flex flex-col gap-3 px-5 pb-4 2xl:flex-row 2xl:items-center" data-print-hide>
              <Segmented<Filter>
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All', count: all.length },
                  { value: 'open', label: 'Open', count: open },
                  ...ORDER_STATUSES.filter((s) => count(s) > 0 || s === 'pending').map((s) => ({
                    value: s,
                    label: ORDER_STATUS_LABEL[s],
                    count: count(s),
                  })),
                ]}
              />
              <SearchInput
                placeholder="Search name, phone or order #"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="2xl:ml-auto 2xl:w-64"
              />
            </div>
            <OrderList
              orders={list}
              loading={orders.isLoading || !date}
              filtered={all.length > 0}
              onOpen={(o) => setOpenId(o.id)}
            />
          </Card>
        </div>

        <PrepList date={date} />
      </div>

      {openOrder && <OrderDrawer order={openOrder} onClose={() => setOpenId(null)} />}
    </>
  );
}

import {
  formatDeliveryDate,
  formatPkr,
  ORDER_STATUS_LABEL,
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  type OrderStatus,
  type PublicSettingsDto,
} from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button, Card, ErrorNote, Input, PageHeader } from '../components/ui';
import { type AdminOrder, get, send } from '../lib/api';

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: 'bg-[#FEF3C7] text-[#78350F]',
  confirmed: 'bg-[#DBEAFE] text-[#1E3A8A]',
  preparing: 'bg-[#EDE9FE] text-[#4C1D95]',
  out_for_delivery: 'bg-[#FFEDD5] text-[#7C2D12]',
  delivered: 'bg-sage-soft text-forest',
  cancelled: 'bg-[#F3F4F6] text-[#374151]',
  failed_delivery: 'bg-[#FEE2E2] text-[#7F1D1D]',
};

export function OrdersPage() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => get<PublicSettingsDto>('/settings'),
  });
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  useEffect(() => {
    if (!date && settings.data?.deliveryDates[0]) setDate(settings.data.deliveryDates[0]);
  }, [settings.data, date]);

  const orders = useQuery({
    queryKey: ['orders', date],
    queryFn: () => get<AdminOrder[]>(`/admin/orders?date=${date}`),
    enabled: !!date,
    refetchInterval: 30_000,
  });
  const prep = useQuery({
    queryKey: ['prep', date],
    queryFn: () =>
      get<{ productName: string; variantLabel: string; qty: number }[]>(`/admin/prep-list?date=${date}`),
    enabled: !!date,
  });
  const move = useMutation({
    mutationFn: (v: { id: string; status: OrderStatus }) =>
      send('PATCH', `/admin/orders/${v.id}/status`, { status: v.status }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orders'] }).then(() => qc.invalidateQueries({ queryKey: ['prep'] })),
  });
  const cod = useMutation({
    mutationFn: (v: { id: string; collected: boolean }) =>
      send('PATCH', `/admin/orders/${v.id}/cod`, { collected: v.collected }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  const all = orders.data ?? [];
  const list = status ? all.filter((o) => o.status === status) : all;
  const count = (s: OrderStatus) => all.filter((o) => o.status === s).length;
  const cash = all.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + o.totalPkr, 0);

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={date ? `Delivery on ${formatDeliveryDate(date)} · refreshes every 30 s` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold" htmlFor="date">
              Delivery day
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
            <Button variant="ghost" onClick={() => window.print()}>
              Print
            </Button>
          </div>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders" value={String(all.length)} />
        <Stat label="Awaiting confirm" value={String(count('pending'))} tone="text-[#B45309]" />
        <Stat label="COD to collect" value={formatPkr(cash)} />
        <Stat label="Delivered" value={String(count('delivered'))} />
      </div>
      <ErrorNote error={orders.error ?? move.error} />
      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-[999_1_620px] overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
            <Tab active={status === ''} onClick={() => setStatus('')}>
              All · {all.length}
            </Tab>
            {ORDER_STATUSES.map((s) => (
              <Tab key={s} active={status === s} onClick={() => setStatus(s)}>
                {ORDER_STATUS_LABEL[s]} · {count(s)}
              </Tab>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">COD</th>
                  <th className="p-3">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="border-t border-[#F1ECE2] align-top">
                    <td className="p-3 font-semibold text-forest">
                      {o.number}
                      <div className="text-xs font-normal text-muted">
                        {new Date(o.createdAt).toLocaleTimeString('en-PK', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="p-3">
                      {o.customerName}
                      <div className="text-xs text-muted">{o.customerPhone}</div>
                    </td>
                    <td className="p-3">
                      {o.areaName}
                      <div className="text-xs text-muted">
                        {o.addressLine1}
                        {o.landmark ? ` · ${o.landmark}` : ''}
                      </div>
                      {o.notes && <div className="text-xs italic text-terra">“{o.notes}”</div>}
                    </td>
                    <td className="p-3 text-muted">
                      {o.items.map((i) => (
                        <div key={i.id}>
                          {i.productName} ({i.variantLabel}) × {i.qty}
                        </div>
                      ))}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatPkr(o.totalPkr)}
                      <label className="mt-1 flex items-center gap-1.5 text-xs font-normal text-muted">
                        <input
                          type="checkbox"
                          checked={o.codCollected}
                          onChange={(e) => cod.mutate({ id: o.id, collected: e.target.checked })}
                        />{' '}
                        collected
                      </label>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[o.status]}`}
                      >
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {ORDER_TRANSITIONS[o.status].map((next) => (
                          <Button
                            key={next}
                            variant={
                              next === 'cancelled' || next === 'failed_delivery' ? 'danger' : 'primary'
                            }
                            className="h-8 px-2.5 text-xs"
                            disabled={move.isPending}
                            onClick={() => {
                              if (
                                next === 'cancelled' &&
                                !confirm(`Cancel ${o.number}? Stock will be returned.`)
                              )
                                return;
                              move.mutate({ id: o.id, status: next });
                            }}
                          >
                            {ORDER_STATUS_LABEL[next]}
                          </Button>
                        ))}
                        <a
                          className="inline-flex h-8 items-center rounded-[10px] border border-[#D7D0C1] px-2.5 text-xs font-semibold"
                          href={`https://wa.me/92${o.customerPhone.slice(1)}?text=${encodeURIComponent(`Assalam o Alaikum ${o.customerName}! Your Preppal order ${o.number} is confirmed for ${formatDeliveryDate(o.deliveryDate)}. Total ${formatPkr(o.totalPkr)} (cash on delivery).`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      {orders.isLoading ? 'Loading…' : 'No orders for this day yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex-[1_1_280px]">
          <Card title="Prep list">
            <p className="-mt-2 text-xs text-muted">
              Total quantity to prepare for {date ? formatDeliveryDate(date) : '…'}
            </p>
            {(prep.data ?? []).map((r) => (
              <div
                key={`${r.productName}-${r.variantLabel}`}
                className="flex justify-between rounded-lg bg-cream px-3 py-2.5 text-sm"
              >
                <span>
                  {r.productName} <span className="text-muted">({r.variantLabel})</span>
                </span>
                <strong className="text-forest">× {r.qty}</strong>
              </div>
            ))}
            {prep.data?.length === 0 && <p className="text-sm text-muted">Nothing to prep yet.</p>}
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, tone = 'text-forest' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className={`font-display text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function Tab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-lg px-3 text-[13px] font-semibold ${active ? 'bg-forest text-white' : 'bg-[#F7F4EC] text-ink'}`}
    >
      {children}
    </button>
  );
}

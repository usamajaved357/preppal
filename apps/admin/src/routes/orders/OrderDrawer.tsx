import {
  formatDeliveryDate,
  formatPkr,
  ORDER_STATUS_LABEL,
  ORDER_TRANSITIONS,
  type OrderStatus,
} from '@preppal/shared';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { IconPhone, IconPin, IconWhatsApp } from '../../components/icons';
import { Drawer } from '../../components/overlays';
import { Badge, Button, buttonCls, Select, Toggle } from '../../components/ui';
import { type AdminOrder, type AdminOrderDetail, type AdminRider, get } from '../../lib/api';
import { formatPhone, whatsappLink } from '../../lib/site';
import { ACTION_LABEL, isNegative, STATUS_TONE, useOrderActions, whatsappText } from './status';

const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-PK', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Karachi',
  });

export function OrderDrawer({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const { move, status, cod, rider } = useOrderActions();
  const detail = useQuery({
    queryKey: ['order', order.id, order.status],
    queryFn: () => get<AdminOrderDetail>(`/admin/orders/${order.id}`),
  });
  const riders = useQuery({ queryKey: ['riders'], queryFn: () => get<AdminRider[]>('/admin/riders') });
  const transitions = ORDER_TRANSITIONS[order.status];
  const forward = transitions.filter((s) => !isNegative(s));
  const negative = transitions.filter(isNegative);

  return (
    <Drawer
      onClose={onClose}
      header={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-ink">{order.number}</h2>
            <Badge tone={STATUS_TONE[order.status]} dot>
              {ORDER_STATUS_LABEL[order.status]}
            </Badge>
          </div>
          <p className="mt-0.5 text-[13px] text-muted">
            Placed {stamp(order.createdAt)} · Delivery {formatDeliveryDate(order.deliveryDate)}
          </p>
        </>
      }
      footer={
        transitions.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {negative.map((s) => (
                <Button key={s} variant="danger" disabled={status.isPending} onClick={() => move(order, s)}>
                  {ACTION_LABEL[s]}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {forward.map((s: OrderStatus) => (
                <Button key={s} disabled={status.isPending} onClick={() => move(order, s)}>
                  {ACTION_LABEL[s]}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted">This order is closed — no further steps.</p>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <Section title="Customer">
          <div className="text-base font-semibold text-ink">{order.customerName}</div>
          <div className="text-sm text-muted">{formatPhone(order.customerPhone)}</div>
          <div className="mt-3 flex gap-2">
            <a href={`tel:${order.customerPhone}`} className={buttonCls('secondary', 'sm')}>
              <IconPhone width={15} height={15} /> Call
            </a>
            <a
              href={whatsappLink(order.customerPhone, whatsappText(order))}
              target="_blank"
              rel="noreferrer"
              className={buttonCls('secondary', 'sm')}
            >
              <IconWhatsApp width={15} height={15} /> WhatsApp
            </a>
          </div>
        </Section>

        <Section title="Deliver to">
          <div className="flex gap-2.5">
            <IconPin className="mt-0.5 shrink-0 text-forest" />
            <div className="text-sm">
              <div className="font-semibold text-ink">{order.areaName}</div>
              <div className="text-muted">{order.addressLine1}</div>
              {order.landmark && <div className="text-muted">Landmark: {order.landmark}</div>}
            </div>
          </div>
          {order.notes && (
            <div className="mt-3 rounded-xl border border-terra/20 bg-terra-soft px-3 py-2 text-sm text-terra-ink">
              <span className="font-semibold">Customer note:</span> {order.notes}
            </div>
          )}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[13px] font-semibold text-ink">Rider</span>
            <Select
              aria-label="Assign rider"
              value={order.riderId ?? ''}
              disabled={rider.isPending}
              onChange={(e) => rider.mutate({ id: order.id, riderId: e.target.value || null })}
              compact
              className="flex-1"
            >
              <option value="">Not assigned</option>
              {riders.data
                ?.filter((r) => r.isActive || r.id === order.riderId)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {formatPhone(r.phone)}
                  </option>
                ))}
            </Select>
          </div>
        </Section>

        <Section title={`Items (${order.items.reduce((a, i) => a + i.qty, 0)})`}>
          <ul className="divide-y divide-line text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="font-semibold text-ink">{i.productName}</span>
                  <span className="text-muted">
                    {' '}
                    · {i.variantLabel} · {i.qty} × {formatPkr(i.unitPricePkr)}
                  </span>
                </span>
                <span className="font-semibold tabular-nums">{formatPkr(i.lineTotalPkr)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
            <Row label="Subtotal" value={formatPkr(order.subtotalPkr)} />
            <Row label="Delivery" value={order.deliveryFeePkr ? formatPkr(order.deliveryFeePkr) : 'Free'} />
            <div className="flex justify-between pt-1 text-base font-bold text-forest">
              <dt>Total (cash on delivery)</dt>
              <dd className="tabular-nums">{formatPkr(order.totalPkr)}</dd>
            </div>
          </dl>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-canvas px-3.5 py-3">
            <div>
              <div className="text-sm font-semibold text-ink">Cash collected</div>
              <div className="text-xs text-muted">Turn on once the rider hands over the cash</div>
            </div>
            <Toggle
              label="Cash collected"
              checked={order.codCollected}
              disabled={cod.isPending}
              onChange={(v) => cod.mutate({ id: order.id, collected: v })}
            />
          </div>
        </Section>

        <Section title="Timeline">
          <ol className="relative ml-1.5 border-l-2 border-line">
            {(detail.data?.history ?? []).map((h, idx, arr) => (
              <li key={h.id} className="relative pb-3 pl-5 last:pb-0">
                <span
                  className={`absolute top-1 -left-[7px] h-3 w-3 rounded-full ring-3 ring-white ${idx === arr.length - 1 ? 'bg-forest' : 'bg-line-strong'}`}
                />
                <div className="text-sm font-semibold text-ink">
                  {ORDER_STATUS_LABEL[h.status as OrderStatus] ?? h.status}
                </div>
                <div className="text-xs text-muted">
                  {stamp(h.createdAt)}
                  {h.byEmail ? ` · ${h.byEmail}` : ' · customer'}
                  {h.note ? ` · ${h.note}` : ''}
                </div>
              </li>
            ))}
            {detail.isLoading && <li className="pl-5 text-sm text-muted">Loading…</li>}
          </ol>
        </Section>
      </div>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <h3 className="mb-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

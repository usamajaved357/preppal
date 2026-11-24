import { formatDeliveryDate, formatPkr, ORDER_STATUS_LABEL, type OrderStatus } from '@preppal/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFeedback } from '../../components/overlays';
import type { Tone } from '../../components/ui';
import { type AdminOrder, send } from '../../lib/api';

export const STATUS_TONE: Record<OrderStatus, Tone> = {
  pending: 'amber',
  confirmed: 'sky',
  preparing: 'plum',
  out_for_delivery: 'clay',
  delivered: 'green',
  cancelled: 'gray',
  failed_delivery: 'red',
};

/** Verb shown on the button that moves an order INTO this status. */
export const ACTION_LABEL: Record<OrderStatus, string> = {
  pending: 'Reopen',
  confirmed: 'Confirm',
  preparing: 'Start prep',
  out_for_delivery: 'Send out',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
  failed_delivery: 'Delivery failed',
};

export const isNegative = (s: OrderStatus) => s === 'cancelled' || s === 'failed_delivery';

/** Ready-made WhatsApp messages per stage. */
export function whatsappText(o: AdminOrder): string {
  const day = formatDeliveryDate(o.deliveryDate);
  const total = formatPkr(o.totalPkr);
  switch (o.status) {
    case 'out_for_delivery':
      return `Assalam o Alaikum ${o.customerName}! Your Preppal order ${o.number} is on its way. Please keep ${total} ready (cash on delivery).`;
    case 'delivered':
      return `Thank you ${o.customerName}! We hope you enjoy your Preppal order ${o.number}. We'd love your feedback.`;
    default:
      return `Assalam o Alaikum ${o.customerName}! Your Preppal order ${o.number} is confirmed for ${day}. Total ${total} (cash on delivery).`;
  }
}

/** Status / COD / rider mutations with confirmation + toasts. Shared by the list and the drawer. */
export function useOrderActions() {
  const qc = useQueryClient();
  const { toast, confirm } = useFeedback();
  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ['orders'] });
    await qc.invalidateQueries({ queryKey: ['order'] });
    await qc.invalidateQueries({ queryKey: ['prep'] });
  };
  const onError = (e: Error) => toast(e.message, 'error');

  const status = useMutation({
    mutationFn: (v: { order: AdminOrder; to: OrderStatus }) =>
      send('PATCH', `/admin/orders/${v.order.id}/status`, { status: v.to }),
    onSuccess: (_r, v) => {
      toast(`${v.order.number} is now ${ORDER_STATUS_LABEL[v.to].toLowerCase()}`);
      return refresh();
    },
    onError,
  });
  const cod = useMutation({
    mutationFn: (v: { id: string; collected: boolean }) =>
      send('PATCH', `/admin/orders/${v.id}/cod`, { collected: v.collected }),
    onSuccess: (_r, v) => {
      toast(v.collected ? 'Cash marked as collected' : 'Cash marked as not collected');
      return refresh();
    },
    onError,
  });
  const rider = useMutation({
    mutationFn: (v: { id: string; riderId: string | null }) =>
      send('PATCH', `/admin/orders/${v.id}/rider`, { riderId: v.riderId }),
    onSuccess: () => {
      toast('Rider updated');
      return refresh();
    },
    onError,
  });

  const move = async (order: AdminOrder, to: OrderStatus) => {
    if (to === 'cancelled') {
      const ok = await confirm({
        title: `Cancel ${order.number}?`,
        body: `${order.customerName}'s order will be cancelled and its stock returned. This can't be undone.`,
        confirmLabel: 'Cancel order',
        danger: true,
      });
      if (!ok) return;
    }
    status.mutate({ order, to });
  };

  return { move, status, cod, rider };
}

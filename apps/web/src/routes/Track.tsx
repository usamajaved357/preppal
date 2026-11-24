import { formatDeliveryDate, formatPkr, ORDER_STATUS_LABEL, type OrderStatus } from '@preppal/shared';
import { useMutation } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { ApiError, api } from '../lib/api';

const FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

export function TrackPage() {
  const search = useSearch({ from: '/track' });
  const [number, setNumber] = useState(search.number ?? '');
  const [phone, setPhone] = useState('');
  const track = useMutation({ mutationFn: () => api.track(number, phone) });
  const o = track.data;
  const reached = o ? FLOW.indexOf(o.status) : -1;

  return (
    <div className="mx-auto max-w-lg px-6 py-14">
      <h1 className="mb-2 text-4xl font-semibold">Track your order</h1>
      <p className="mb-6 text-muted">Enter your order number and the phone number you ordered with.</p>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          track.mutate();
        }}
      >
        <input
          required
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="PP-000123"
          className="h-[52px] rounded-[14px] border-[1.5px] border-[#DDD6C7] bg-white px-4"
          aria-label="Order number"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="03xx xxxxxxx"
          inputMode="tel"
          className="h-[52px] rounded-[14px] border-[1.5px] border-[#DDD6C7] bg-white px-4"
          aria-label="Phone number"
        />
        <button type="submit" className="h-[52px] rounded-full bg-forest font-bold text-white">
          {track.isPending ? 'Checking…' : 'Track order'}
        </button>
      </form>
      {track.error && (
        <p role="alert" className="mt-4 text-terra">
          {track.error instanceof ApiError && track.error.status === 404
            ? 'No order found with those details.'
            : track.error.message}
        </p>
      )}
      {o && (
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
          <div className="flex justify-between">
            <span className="font-semibold">{o.orderNumber}</span>
            <span className="text-muted">{formatDeliveryDate(o.deliveryDate)}</span>
          </div>
          {o.status === 'cancelled' || o.status === 'failed_delivery' ? (
            <p className="font-semibold text-terra">{ORDER_STATUS_LABEL[o.status]}</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {FLOW.map((s, i) => (
                <li key={s} className={`flex items-center gap-3 ${i <= reached ? '' : 'text-muted'}`}>
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-xs ${i <= reached ? 'bg-forest text-white' : 'border-2 border-[#DDD6C7]'}`}
                  >
                    {i <= reached ? '✓' : ''}
                  </span>
                  {ORDER_STATUS_LABEL[s]}
                </li>
              ))}
            </ol>
          )}
          <ul className="border-t border-line pt-3 text-sm text-muted">
            {o.items.map((i) => (
              <li key={`${i.name}-${i.variantLabel}`}>
                {i.name} ({i.variantLabel}) × {i.qty}
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-semibold">
            <span>Total (cash)</span>
            <span>{formatPkr(o.totalPkr)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

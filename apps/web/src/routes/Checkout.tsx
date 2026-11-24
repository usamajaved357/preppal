import { formatDeliveryDate, formatPkr } from '@preppal/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { type FormEvent, useEffect, useState } from 'react';
import { ApiError, api, q } from '../lib/api';
import { IconChevronDown } from '../components/icons';
import { cartSubtotal, useCart } from '../lib/cart';

const input =
  'h-[52px] w-full rounded-[14px] border-[1.5px] border-[#DDD6C7] bg-cream px-4 text-base outline-none focus:border-forest';
const card = 'flex flex-col gap-4 rounded-[22px] border border-line bg-white p-6';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, clear } = useCart();
  const settings = useQuery(q.settings());
  const areas = useQuery(q.areas());

  const [form, setForm] = useState({ name: '', phone: '', areaId: '', line1: '', landmark: '', notes: '' });
  const [date, setDate] = useState('');
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (!date && settings.data?.deliveryDates[0]) setDate(settings.data.deliveryDates[0]);
  }, [settings.data, date]);
  useEffect(() => {
    const only = areas.data?.areas[0];
    if (!form.areaId && areas.data?.areas.length === 1 && only) setForm((f) => ({ ...f, areaId: only.id }));
  }, [areas.data, form.areaId]);

  const area = areas.data?.areas.find((a) => a.id === form.areaId);
  const subtotal = cartSubtotal(lines);
  const fee = area?.deliveryFeePkr ?? 0;

  const place = useMutation({
    mutationFn: () =>
      api.createOrder({
        customer: { name: form.name, phone: form.phone },
        address: {
          cityId: areas.data?.city.id ?? '',
          areaId: form.areaId,
          line1: form.line1,
          landmark: form.landmark,
        },
        deliveryDate: date,
        notes: form.notes,
        items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
      }),
    onSuccess: (order) => {
      sessionStorage.setItem(`order:${order.orderNumber}`, JSON.stringify(order));
      clear();
      navigate({ to: '/order/$number', params: { number: order.orderNumber } });
    },
  });

  if (lines.length === 0 && !place.isSuccess) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="mb-4">Your cart is empty.</p>
        <Link to="/" className="font-semibold text-forest">
          Back to menu
        </Link>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    place.mutate();
  };
  const err = place.error instanceof ApiError ? place.error : null;
  const paused = !!settings.data?.ordersPaused;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-[44px] font-semibold">Almost there</h1>
      <p className="mb-7 text-muted">Tell us where to bring it. You pay cash when it arrives.</p>
      {paused && (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-terra/25 bg-[#FBEAE3] px-5 py-4 text-[#7A2E12]"
        >
          <strong className="block font-semibold">Ordering is paused right now</strong>
          {settings.data?.pauseMessage}
        </div>
      )}
      <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <section className={card}>
            <h2 className="text-[22px] font-semibold">Your details</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Full name
                <input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={set('name')}
                  className={input}
                  autoComplete="name"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                WhatsApp number
                <input
                  required
                  value={form.phone}
                  onChange={set('phone')}
                  className={input}
                  inputMode="tel"
                  placeholder="03xx xxxxxxx"
                  autoComplete="tel"
                />
              </label>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-[22px] font-semibold">Delivery address</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                City
                <input value={areas.data?.city.name ?? 'Sahiwal'} readOnly className={`${input} bg-sand`} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Area
                <span className="relative">
                <select
                  required
                  value={form.areaId}
                  onChange={set('areaId')}
                  className={`${input} w-full cursor-pointer appearance-none !rounded-full !pr-11 !pl-4`}
                >
                  <option value="">Choose your area</option>
                  {areas.data?.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {a.deliveryFeePkr ? ` — ${formatPkr(a.deliveryFeePkr)} delivery` : ' — free delivery'}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted" />
                </span>
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              House / street
              <input
                required
                minLength={3}
                value={form.line1}
                onChange={set('line1')}
                className={input}
                placeholder="House no., street, block"
                autoComplete="street-address"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Nearest landmark <span className="font-normal text-muted">Helps the rider find you</span>
              <input
                value={form.landmark}
                onChange={set('landmark')}
                className={input}
                placeholder="Near masjid, chowk or shop"
              />
            </label>
          </section>

          <section className={card}>
            <h2 className="text-[22px] font-semibold">Delivery day</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {settings.data?.deliveryDates.map((d, i) => (
                <label
                  key={d}
                  className={`flex cursor-pointer flex-col gap-0.5 rounded-2xl p-4 ${d === date ? 'border-2 border-forest bg-sage-soft' : 'border-[1.5px] border-[#DDD6C7]'}`}
                >
                  <input
                    type="radio"
                    name="date"
                    className="sr-only"
                    checked={d === date}
                    onChange={() => setDate(d)}
                  />
                  <span className="font-display text-lg font-bold">{i === 0 ? 'Earliest' : 'Later'}</span>
                  <span className="text-sm text-muted">
                    {formatDeliveryDate(d)} · by {settings.data?.deliveryByLabel}
                  </span>
                </label>
              ))}
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Note for the kitchen <span className="font-normal text-muted">Optional</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={set('notes')}
                className={`${input} h-auto py-3`}
                placeholder="Less spicy, call before coming…"
              />
            </label>
          </section>

          <section className={card}>
            <h2 className="text-[22px] font-semibold">Payment</h2>
            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-forest bg-sage-soft p-4">
              <span className="font-bold">Cash on delivery</span>
              <span className="text-sm text-muted">Pay the rider when your order arrives</span>
            </div>
          </section>
        </div>

        <aside className="flex flex-[1_1_340px] flex-col gap-4 rounded-[22px] border border-line bg-white p-6 lg:sticky lg:top-28">
          <h2 className="text-[22px] font-semibold">Your basket</h2>
          {lines.map((l) => (
            <div key={l.variantId} className="flex items-center gap-3.5">
              {l.imageUrl && (
                <img src={l.imageUrl} alt="" className="h-16 w-16 rounded-[14px] object-cover" />
              )}
              <div className="flex-1">
                <div className="font-semibold">{l.name}</div>
                <div className="text-[13px] text-muted">
                  {l.label} × {l.qty}
                </div>
              </div>
              <span className="font-semibold">{formatPkr(l.qty * l.pricePkr)}</span>
            </div>
          ))}
          <div className="flex flex-col gap-2.5 border-t border-dashed border-[#DDD6C7] pt-3.5">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatPkr(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Delivery</span>
              <span>{area ? (fee ? formatPkr(fee) : 'Free') : '—'}</span>
            </div>
            <div className="flex items-baseline justify-between pt-1.5">
              <span className="font-semibold">Pay on delivery</span>
              <span className="font-display text-[26px] font-bold text-forest">
                {formatPkr(subtotal + fee)}
              </span>
            </div>
          </div>
          {err && (
            <p role="alert" className="rounded-xl bg-[#FBEAE3] p-3 text-sm text-[#7A2E12]">
              {err.message}
            </p>
          )}
          <button
            type="submit"
            disabled={place.isPending || paused}
            className="h-[58px] rounded-full bg-forest text-[17px] font-bold text-white disabled:opacity-60"
          >
            {paused ? 'Ordering paused' : place.isPending ? 'Placing order…' : 'Place order'}
          </button>
          <p className="rounded-[14px] bg-[#F7EFE4] p-3.5 text-sm leading-relaxed text-[#5A3A14]">
            We take orders a night ahead because we only sell fresh. We'll confirm on WhatsApp.
          </p>
        </aside>
      </form>
    </div>
  );
}

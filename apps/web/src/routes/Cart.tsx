import { formatPkr } from '@preppal/shared';
import { Link } from '@tanstack/react-router';
import { IconBag, IconTruck } from '../components/icons';
import { cartSubtotal, useCart } from '../lib/cart';
import { useStoreInfo } from '../lib/store-info';

export function CartPage() {
  const { lines, setQty, remove } = useCart();
  const info = useStoreInfo();
  const subtotal = cartSubtotal(lines);
  const short = Math.max(0, info.minOrder - subtotal);
  const progress = info.minOrder > 0 ? Math.min(100, Math.round((subtotal / info.minOrder) * 100)) : 100;
  const blocked = info.paused || short > 0;

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl animate-rise flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="grid h-20 w-20 animate-float place-items-center rounded-full bg-sage-soft text-forest">
          <IconBag width={34} height={34} />
        </span>
        <h1 className="text-4xl font-semibold">Your cart is empty</h1>
        <p className="text-muted">Pick your prep from tomorrow's menu — order by {info.cutoff} tonight.</p>
        <Link
          to="/"
          hash="menu"
          className="rounded-full bg-forest px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-forest-deep"
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-[44px] font-semibold">Your cart</h1>
      <p className="mb-7 text-muted">
        {lines.reduce((a, l) => a + l.qty, 0)} items · delivered tomorrow by {info.by}
      </p>

      <div className="flex flex-wrap items-start gap-6">
        <ul className="min-w-0 flex-[999_1_560px] divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-white">
          {lines.map((l, i) => (
            <li
              key={l.variantId}
              style={{ animationDelay: `${i * 60}ms` }}
              className="flex animate-rise flex-wrap items-center gap-4 p-4 sm:flex-nowrap"
            >
              {l.imageUrl && (
                <img src={l.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <Link
                  to="/p/$slug"
                  params={{ slug: l.productSlug }}
                  className="font-semibold hover:text-forest"
                >
                  {l.name}
                </Link>
                <div className="text-sm text-muted">
                  {l.label} · {formatPkr(l.pricePkr)} each
                </div>
                <button
                  type="button"
                  onClick={() => remove(l.variantId)}
                  className="mt-1 text-[13px] text-muted underline underline-offset-2 hover:text-terra"
                >
                  Remove
                </button>
              </div>
              <div className="flex h-11 items-center rounded-full border border-[#DDD6C7] bg-cream">
                <button
                  type="button"
                  aria-label={`Decrease ${l.name}`}
                  className="h-full w-10 rounded-l-full text-lg text-forest transition hover:bg-sage-soft active:scale-90"
                  onClick={() => setQty(l.variantId, l.qty - 1)}
                >
                  −
                </button>
                <span key={l.qty} className="min-w-7 animate-pop text-center font-semibold tabular-nums">
                  {l.qty}
                </span>
                <button
                  type="button"
                  aria-label={`Increase ${l.name}`}
                  className="h-full w-10 rounded-r-full text-lg text-forest transition hover:bg-sage-soft active:scale-90"
                  onClick={() => setQty(l.variantId, l.qty + 1)}
                >
                  +
                </button>
              </div>
              <span className="w-24 text-right font-semibold tabular-nums">
                {formatPkr(l.qty * l.pricePkr)}
              </span>
            </li>
          ))}
        </ul>

        <aside className="flex flex-[1_1_320px] flex-col gap-4 rounded-[22px] border border-line bg-white p-6 lg:sticky lg:top-6">
          <h2 className="text-[22px] font-semibold">Summary</h2>
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <strong className="font-display text-2xl tabular-nums">{formatPkr(subtotal)}</strong>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted">
            <IconTruck width={16} height={16} className="text-forest" /> Delivery fee depends on your area —
            shown at checkout.
          </p>

          {info.minOrder > 0 && (
            <div className="rounded-2xl bg-cream p-3.5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-semibold">Minimum order {formatPkr(info.minOrder)}</span>
                <span className={short ? 'text-terra' : 'text-forest'}>
                  {short ? `${formatPkr(short)} to go` : 'Reached ✓'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-forest transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {info.paused && (
            <p className="rounded-2xl bg-[#FBEAE3] p-3.5 text-sm text-[#7A2E12]">
              <strong className="block">Ordering is paused right now</strong>
              {info.pauseMessage}
            </p>
          )}

          {blocked ? (
            <span className="grid h-14 place-items-center rounded-full bg-forest/50 font-bold text-white">
              {info.paused ? 'Ordering paused' : `Add ${formatPkr(short)} more`}
            </span>
          ) : (
            <Link
              to="/checkout"
              className="grid h-14 place-items-center rounded-full bg-forest font-bold text-white shadow-[0_12px_28px_-12px_rgba(31,77,58,.7)] transition hover:-translate-y-0.5 hover:bg-forest-deep"
            >
              Checkout — cash on delivery
            </Link>
          )}
          <Link to="/" hash="menu" className="text-center text-sm font-semibold text-forest hover:underline">
            ← Keep shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

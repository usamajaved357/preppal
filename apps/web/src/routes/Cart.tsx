import { formatPkr } from '@preppal/shared';
import { Link } from '@tanstack/react-router';
import { cartSubtotal, useCart } from '../lib/cart';

export function CartPage() {
  const { lines, setQty, remove } = useCart();
  const subtotal = cartSubtotal(lines);

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold">Your cart is empty</h1>
        <p className="text-muted">Pick your prep from tomorrow's menu.</p>
        <Link to="/" hash="menu" className="rounded-full bg-forest px-6 py-3 font-semibold text-white">
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-4xl font-semibold">Your cart</h1>
      <ul className="divide-y divide-line rounded-3xl border border-line bg-white">
        {lines.map((l) => (
          <li key={l.variantId} className="flex flex-wrap items-center gap-4 p-4">
            {l.imageUrl && <img src={l.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />}
            <div className="min-w-0 flex-1">
              <Link to="/p/$slug" params={{ slug: l.productSlug }} className="font-semibold">
                {l.name}
              </Link>
              <div className="text-sm text-muted">
                {l.label} · {formatPkr(l.pricePkr)}
              </div>
            </div>
            <div className="flex h-11 items-center rounded-full border border-[#DDD6C7]">
              <button
                type="button"
                aria-label={`Decrease ${l.name}`}
                className="h-full w-10 text-forest"
                onClick={() => setQty(l.variantId, l.qty - 1)}
              >
                −
              </button>
              <span className="min-w-6 text-center font-semibold">{l.qty}</span>
              <button
                type="button"
                aria-label={`Increase ${l.name}`}
                className="h-full w-10 text-forest"
                onClick={() => setQty(l.variantId, l.qty + 1)}
              >
                +
              </button>
            </div>
            <span className="w-24 text-right font-semibold">{formatPkr(l.qty * l.pricePkr)}</span>
            <button
              type="button"
              onClick={() => remove(l.variantId)}
              className="text-sm text-muted underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <span className="text-lg">
          Subtotal <strong className="ml-2 font-display text-2xl">{formatPkr(subtotal)}</strong>{' '}
          <span className="text-sm text-muted">+ delivery</span>
        </span>
        <Link to="/checkout" className="rounded-full bg-forest px-8 py-4 font-bold text-white">
          Checkout — cash on delivery
        </Link>
      </div>
    </div>
  );
}

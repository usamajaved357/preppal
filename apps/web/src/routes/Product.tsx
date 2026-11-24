import { formatPkr } from '@preppal/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { IconCash, IconTruck } from '../components/icons';
import { q } from '../lib/api';
import { useCart } from '../lib/cart';
import { badgeClass } from '../lib/site';
import { useStoreInfo } from '../lib/store-info';
import { useToast } from '../lib/toast';

export function ProductPage() {
  const { slug } = useParams({ from: '/p/$slug' });
  const { data: p, isLoading, isError } = useQuery(q.product(slug));
  const add = useCart((s) => s.add);
  const showToast = useToast((t) => t.show);
  const info = useStoreInfo();
  const [variantId, setVariantId] = useState<string>();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [image, setImage] = useState(0);

  useEffect(() => {
    if (p && !variantId) setVariantId(p.variants.find((v) => v.available)?.id);
  }, [p, variantId]);

  if (isLoading) return <div className="mx-auto max-w-7xl px-6 py-16 text-muted">Loading…</div>;
  if (isError || !p)
    return (
      <div className="mx-auto max-w-7xl px-6 py-16">
        Product not found.{' '}
        <Link to="/" className="text-forest underline">
          Back to menu
        </Link>
      </div>
    );

  const variant = p.variants.find((v) => v.id === variantId);
  const images = p.imageUrls.length ? p.imageUrls : p.imageUrl ? [p.imageUrl] : [];

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-6">
      <nav aria-label="Breadcrumb" className="mb-5 flex gap-2 text-sm text-muted">
        <Link to="/">Menu</Link>
        <span aria-hidden>›</span>
        <span>{p.name}</span>
      </nav>
      <div className="flex flex-wrap items-start gap-12">
        <div className="flex flex-[1_1_520px] flex-col gap-3">
          <div className="group h-[460px] overflow-hidden rounded-3xl bg-sand shadow-[0_24px_48px_-24px_rgba(22,58,44,.35)] md:h-[520px]">
            {images[image] && (
              <img
                key={images[image]}
                src={images[image]}
                alt={p.name}
                className="h-full w-full animate-rise object-cover transition duration-[1200ms] ease-out group-hover:scale-105"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImage(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`h-24 overflow-hidden rounded-2xl ring-offset-2 ring-offset-cream transition hover:-translate-y-0.5 ${i === image ? 'ring-2 ring-forest' : 'opacity-80 hover:opacity-100'}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hero-stagger flex flex-[1_1_400px] flex-col gap-5">
          {p.badge && (
            <span
              className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(p.badge)}`}
            >
              {p.badge}
            </span>
          )}
          <h1 className="text-4xl font-semibold leading-tight md:text-[46px]">{p.name}</h1>
          <p className="text-[16.5px] leading-relaxed text-muted">{p.description || p.shortDescription}</p>

          <div className="flex items-baseline gap-2.5 border-y border-line py-3.5">
            <span className="font-display text-[34px] font-bold">
              {variant ? formatPkr(variant.pricePkr) : 'Coming soon'}
            </span>
            {variant && (
              <span className="text-sm text-muted">{variant.unitNote || `for ${variant.label}`}</span>
            )}
          </div>

          {p.variants.length > 1 && (
            <fieldset>
              <legend className="mb-2.5 text-[15px] font-semibold">Pack size</legend>
              <div className="flex flex-wrap gap-2.5">
                {p.variants.map((v) => (
                  <label
                    key={v.id}
                    className={`flex h-12 cursor-pointer items-center gap-2 rounded-full border px-5 font-semibold transition active:scale-95 ${
                      v.id === variantId ? 'border-2 border-forest bg-sage-soft' : 'border-[#DDD6C7] bg-white'
                    } ${v.available ? '' : 'cursor-not-allowed opacity-50'}`}
                  >
                    <input
                      type="radio"
                      name="variant"
                      className="accent-forest"
                      disabled={!v.available}
                      checked={v.id === variantId}
                      onChange={() => setVariantId(v.id)}
                    />
                    {v.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-[54px] items-center rounded-full border border-[#DDD6C7] bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="h-full w-12 text-xl text-forest"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                −
              </button>
              <span className="min-w-7 text-center font-bold">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="h-full w-12 text-xl text-forest"
                onClick={() => setQty(Math.min(50, qty + 1))}
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={!variant?.available}
              onClick={() => {
                if (!variant) return;
                add(
                  {
                    variantId: variant.id,
                    productSlug: p.slug,
                    name: p.name,
                    label: variant.label,
                    pricePkr: variant.pricePkr,
                    imageUrl: p.imageUrl,
                  },
                  qty,
                );
                setAdded(true);
                showToast(`${qty} × ${p.name} added`);
              }}
              className="h-[54px] flex-[1_1_220px] rounded-full bg-forest font-bold text-white shadow-[0_12px_28px_-12px_rgba(31,77,58,.7)] transition hover:-translate-y-0.5 hover:bg-forest-deep active:scale-[.98] disabled:opacity-50"
            >
              {added ? <span className="inline-block animate-pop">Added ✓ — add more</span> : 'Add to cart'}
            </button>
          </div>
          {added && (
            <Link to="/cart" className="font-semibold text-forest">
              Go to cart →
            </Link>
          )}

          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-4 text-[14.5px]">
            <div className="flex items-center gap-2.5">
              <IconTruck className="text-forest" />{' '}
              <span>
                <strong>Delivered tomorrow by {info.by}</strong> — order before {info.cutoff} tonight
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconCash className="text-forest" />{' '}
              <span>
                <strong>Cash on delivery</strong> — delivering in {info.city}
              </span>
            </div>
          </div>

          <div>
            {[
              ['How to use', p.howToUse],
              ['Ingredients', p.ingredients],
              ['Storage & shelf life', p.storage],
            ]
              .filter(([, v]) => v)
              .map(([k, v], i) => (
                <details key={k} open={i === 0} className="border-b border-line py-4">
                  <summary className="cursor-pointer font-semibold">{k}</summary>
                  <p className="mt-2.5 whitespace-pre-line leading-relaxed text-muted">{v}</p>
                </details>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

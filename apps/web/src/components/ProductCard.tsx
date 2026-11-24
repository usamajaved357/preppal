import { formatPkr, type ProductCardDto } from '@preppal/shared';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useCart } from '../lib/cart';
import { badgeClass } from '../lib/site';
import { useStoreInfo } from '../lib/store-info';
import { useToast } from '../lib/toast';
import { IconCheck, IconTruck } from './icons';

export function ProductCard({ p }: { p: ProductCardDto }) {
  const add = useCart((s) => s.add);
  const showToast = useToast((t) => t.show);
  const { by } = useStoreInfo();
  const [added, setAdded] = useState(false);
  const first = p.variants.find((v) => v.available);
  const unit = first?.unitNote ? `/ ${first.unitNote.replace(/^per /, '')}` : first ? `· ${first.label}` : '';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-white transition duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_24px_48px_-16px_rgba(22,58,44,.28)]">
      <Link
        to="/p/$slug"
        params={{ slug: p.slug }}
        className="relative block h-[216px] overflow-hidden bg-sand"
      >
        {p.imageUrl && (
          <img
            src={p.imageUrl}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.07]"
          />
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        <span className="pointer-events-none absolute right-3.5 bottom-3.5 translate-y-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-forest opacity-0 shadow transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View details →
        </span>
        {p.badge && (
          <span
            className={`absolute left-3.5 top-3.5 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(p.badge)}`}
          >
            {p.badge}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 px-[18px] pb-[18px] pt-4">
        <h3 className="text-xl font-semibold leading-tight">
          <Link to="/p/$slug" params={{ slug: p.slug }}>
            {p.name}
          </Link>
        </h3>
        <span className="text-sm text-muted">{p.shortDescription}</span>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[19px] font-bold">
            {first ? (
              formatPkr(first.pricePkr)
            ) : (
              <span className="text-[15px] font-semibold text-muted">Coming soon</span>
            )}{' '}
            <span className="text-[13px] font-medium text-muted">{unit}</span>
          </span>
          <button
            type="button"
            disabled={!first}
            onClick={() => {
              if (!first) return;
              add({
                variantId: first.id,
                productSlug: p.slug,
                name: p.name,
                label: first.label,
                pricePkr: first.pricePkr,
                imageUrl: p.imageUrl,
              });
              showToast(`${p.name} added`);
              setAdded(true);
              setTimeout(() => setAdded(false), 1400);
            }}
            className={`inline-flex h-[42px] items-center gap-1.5 rounded-full border-[1.5px] px-[18px] text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-transparent ${
              added
                ? 'border-forest bg-forest text-white'
                : 'border-forest text-forest hover:bg-forest hover:text-white'
            }`}
            aria-label={`Add ${p.name} to cart`}
          >
            {added ? (
              <span key="ok" className="inline-flex animate-pop items-center gap-1">
                <IconCheck width={15} height={15} /> Added
              </span>
            ) : first ? (
              'Add'
            ) : (
              'Soon'
            )}
          </button>
        </div>
        <span className="mt-3 flex items-center gap-1.5 border-t border-[#F1ECE2] pt-3 text-[13px] text-muted">
          <IconTruck width={15} height={15} className="text-forest" /> Delivered tomorrow by {by}
        </span>
      </div>
    </article>
  );
}

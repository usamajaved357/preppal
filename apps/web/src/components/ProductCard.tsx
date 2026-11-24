import { formatPkr, type ProductCardDto } from '@preppal/shared';
import { Link } from '@tanstack/react-router';
import { useCart } from '../lib/cart';
import { badgeClass } from '../lib/site';
import { IconTruck } from './icons';

export function ProductCard({ p }: { p: ProductCardDto }) {
  const add = useCart((s) => s.add);
  const first = p.variants.find((v) => v.available);
  const unit = first?.unitNote ? `/ ${first.unitNote.replace(/^per /, '')}` : first ? `· ${first.label}` : '';

  return (
    <article className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(22,58,44,.12)]">
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
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
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
            {first ? formatPkr(first.pricePkr) : 'Coming soon'}{' '}
            <span className="text-[13px] font-medium text-muted">{unit}</span>
          </span>
          <button
            type="button"
            disabled={!first}
            onClick={() =>
              first &&
              add({
                variantId: first.id,
                productSlug: p.slug,
                name: p.name,
                label: first.label,
                pricePkr: first.pricePkr,
                imageUrl: p.imageUrl,
              })
            }
            className="h-[42px] rounded-full border-[1.5px] border-forest px-[18px] text-sm font-semibold text-forest transition hover:bg-forest hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-transparent"
            aria-label={`Add ${p.name} to cart`}
          >
            Add
          </button>
        </div>
        <span className="mt-3 flex items-center gap-1.5 border-t border-[#F1ECE2] pt-3 text-[13px] text-muted">
          <IconTruck width={15} height={15} className="text-forest" /> Delivered tomorrow by 5 PM
        </span>
      </div>
    </article>
  );
}

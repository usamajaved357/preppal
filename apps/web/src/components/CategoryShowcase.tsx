import type { CategoryDto } from '@preppal/shared';
import { useStoreInfo } from '../lib/store-info';
import { IconCheck, IconWhatsApp } from './icons';
import { Reveal } from './Reveal';

const MD_SPAN: Record<number, string> = { 1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3' };

/**
 * Bento grid of category photo cards. The first category (admin sort order) is the big featured tile.
 * A WhatsApp card fills any leftover cells so the grid always ends flush, whatever the category count.
 */
export function CategoryShowcase({
  categories,
  counts,
  active,
  onPick,
}: {
  categories: CategoryDto[];
  counts: Map<string, number>;
  active: string;
  onPick: (slug: string) => void;
}) {
  const { whatsapp } = useStoreInfo();
  const n = categories.length;
  if (n === 0) return null;
  // Featured tile takes 4 cells on md (2×2) and 2 cells on mobile (full row).
  const fillMd = (4 - ((4 + n - 1) % 4)) % 4;
  const fillSm = (n - 1) % 2;

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 md:auto-rows-[230px] md:grid-cols-4 md:gap-4">
      {categories.map((c, i) => (
        <Reveal
          key={c.id}
          delay={i * 60}
          from={i === 0 ? 'scale' : 'up'}
          className={i === 0 ? 'col-span-2 md:row-span-2' : ''}
        >
          <CategoryCard
            c={c}
            featured={i === 0}
            count={counts.get(c.slug) ?? 0}
            selected={active === c.slug}
            onPick={() => onPick(c.slug)}
          />
        </Reveal>
      ))}
      {(fillMd > 0 || fillSm > 0) && (
        <Reveal
          delay={n * 60}
          className={`${fillSm ? 'flex' : 'hidden'} ${fillMd ? `md:flex ${MD_SPAN[fillMd] ?? ''}` : 'md:hidden'}`}
        >
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Assalam o Alaikum! Do you have…')}`}
            target="_blank"
            rel="noreferrer"
            className="group relative flex h-full min-h-[200px] w-full flex-col justify-between overflow-hidden rounded-[26px] bg-forest-deep p-6 text-white"
          >
            <span className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-sage/15 transition duration-700 group-hover:scale-150" />
            <span className="relative grid h-12 w-12 place-items-center rounded-full bg-[#25D366] transition group-hover:rotate-12">
              <IconWhatsApp width={22} height={22} />
            </span>
            <span className="relative">
              <span className="block font-display text-[22px] leading-tight font-semibold">
                Can't find it?
              </span>
              <span className="mt-1 block text-sm text-[#D7E2D6]">
                We prep to order — ask us on WhatsApp{' '}
                <span className="inline-block transition group-hover:translate-x-1">→</span>
              </span>
            </span>
          </a>
        </Reveal>
      )}
    </div>
  );
}

function CategoryCard({
  c,
  featured,
  count,
  selected,
  onPick,
}: {
  c: CategoryDto;
  featured: boolean;
  count: number;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={`group relative block h-full w-full overflow-hidden rounded-[26px] bg-sand text-left shadow-[0_10px_30px_-14px_rgba(22,58,44,.35)] ring-offset-4 ring-offset-cream transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-16px_rgba(22,58,44,.45)] ${
        featured ? 'aspect-[16/11] md:aspect-auto' : 'aspect-[4/5] md:aspect-auto'
      } ${selected ? 'ring-3 ring-forest' : ''}`}
    >
      {c.imageUrl && (
        <img
          src={c.imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-[900ms] ease-out group-hover:scale-110"
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition duration-500 group-hover:from-forest-deep/85" />

      <span className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
        {featured && (
          <span className="rounded-full bg-sage px-2.5 py-1 text-[11px] font-bold tracking-[1px] text-forest-deep uppercase">
            Most loved
          </span>
        )}
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-forest backdrop-blur">
          {count ? `${count} item${count === 1 ? '' : 's'}` : 'Coming soon'}
        </span>
      </span>
      {selected && (
        <span className="absolute top-3.5 right-3.5 flex animate-pop items-center gap-1 rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-white">
          <IconCheck width={13} height={13} /> Showing
        </span>
      )}

      <span
        className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 ${featured ? 'p-6 md:p-8' : 'p-4 md:p-5'}`}
      >
        <span className="min-w-0 text-white">
          <span
            className={`block font-display leading-tight font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,.35)] ${
              featured ? 'text-[30px] md:text-[42px]' : 'text-[17px] md:text-[22px]'
            }`}
          >
            {c.name}
          </span>
          <span
            className={`mt-0.5 block text-white/85 ${featured ? 'text-[15px] md:text-base' : 'text-[13px]'}`}
          >
            {c.description}
          </span>
          {featured && (
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-cream-btn px-5 py-2.5 text-sm font-bold text-forest-deep transition group-hover:bg-white">
              Shop {c.name.toLowerCase()} <span className="transition group-hover:translate-x-1">→</span>
            </span>
          )}
        </span>
        {!featured && (
          <span className="grid h-9 w-9 shrink-0 translate-y-1 place-items-center rounded-full bg-white text-forest opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            →
          </span>
        )}
      </span>
    </button>
  );
}

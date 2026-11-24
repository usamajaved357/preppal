import { formatPkr } from '@preppal/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { IconAlert, IconBox, IconImage, IconPlus, IconSearch } from '../../components/icons';
import {
  Badge,
  buttonCls,
  EmptyState,
  ErrorNote,
  Input,
  PageHeader,
  Segmented,
  Skeleton,
} from '../../components/ui';
import { type AdminCategory, type AdminProduct, get } from '../../lib/api';

export const STATUS_META = {
  active: { label: 'Live', tone: 'green' },
  draft: { label: 'Draft', tone: 'amber' },
  archived: { label: 'Archived', tone: 'gray' },
} as const;

type StatusFilter = 'all' | AdminProduct['status'] | 'unpriced';
const needsPrice = (p: AdminProduct) =>
  p.variants.length === 0 || p.variants.some((v) => v.isActive && v.pricePkr <= 0);

export function ProductsPage() {
  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => get<AdminProduct[]>('/admin/products'),
  });
  const cats = useQuery({
    queryKey: ['categories'],
    queryFn: () => get<AdminCategory[]>('/admin/categories'),
  });
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const all = products.data ?? [];
  const catName = (id: string) => cats.data?.find((c) => c.id === id)?.name ?? '';
  const unpriced = all.filter(needsPrice).length;
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(
      (p) =>
        (status === 'all' || (status === 'unpriced' ? needsPrice(p) : p.status === status)) &&
        (!category || p.categoryId === category) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [all, status, category, search]);
  const usedCats = (cats.data ?? []).filter((c) => all.some((p) => p.categoryId === c.id));

  return (
    <>
      <PageHeader
        kicker="Catalog"
        title="Products"
        subtitle={`${all.length} products · ${all.filter((p) => p.status === 'active').length} live on the storefront`}
        actions={
          <Link to="/products/$id" params={{ id: 'new' }} className={buttonCls()}>
            <IconPlus width={17} height={17} /> New product
          </Link>
        }
      />
      <ErrorNote error={products.error} />

      {unpriced > 0 && status !== 'unpriced' && (
        <button
          type="button"
          onClick={() => setStatus('unpriced')}
          className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-amber-ink/20 bg-amber-soft px-4 py-3 text-left text-sm text-amber-ink transition hover:border-amber-ink/40"
        >
          <IconAlert className="shrink-0" />
          <span className="flex-1">
            <strong>{unpriced} products</strong> have sizes without a price. Customers can't order those sizes
            until you set one.
          </span>
          <span className="font-semibold underline underline-offset-2">Show them</span>
        </button>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Segmented<StatusFilter>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Live' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' },
            { value: 'unpriced', label: `Needs price · ${unpriced}` },
          ]}
        />
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 cursor-pointer rounded-[10px] border border-line-strong bg-white px-3 text-sm font-semibold text-ink lg:ml-auto"
        >
          <option value="">All categories</option>
          {usedCats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {products.isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white">
          <EmptyState icon={<IconBox />} title={all.length ? 'No products match' : 'No products yet'}>
            {all.length ? 'Try a different filter or search.' : 'Add your first product to start selling.'}
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {list.map((p) => (
            <ProductTile key={p.id} p={p} category={catName(p.categoryId)} />
          ))}
        </div>
      )}
    </>
  );
}

function ProductTile({ p, category }: { p: AdminProduct; category: string }) {
  const meta = STATUS_META[p.status];
  const missing = p.variants.filter((v) => v.isActive && v.pricePkr <= 0).length;
  return (
    <Link
      to="/products/$id"
      params={{ id: p.id }}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:border-forest/30 hover:shadow-pop ${p.status === 'archived' ? 'opacity-70' : ''}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {p.imageUrls[0] ? (
          <img
            src={p.imageUrls[0]}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted/50">
            <IconImage width={36} height={36} />
          </div>
        )}
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          {p.badge ? (
            <span className="rounded-full bg-terra px-2.5 py-1 text-[11px] font-bold text-white shadow-card">
              {p.badge}
            </span>
          ) : (
            <span />
          )}
          <span className="rounded-full bg-white/95 shadow-card">
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-gold">{category}</div>
          <div className="font-display text-[17px] leading-snug font-semibold text-ink">{p.name}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {p.variants.map((v) => (
            <span
              key={v.id}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                !v.isActive
                  ? 'bg-stone-soft text-muted line-through'
                  : v.pricePkr > 0
                    ? 'bg-canvas text-ink'
                    : 'bg-amber-soft text-amber-ink'
              }`}
            >
              {v.label} · {v.pricePkr > 0 ? formatPkr(v.pricePkr) : 'no price'}
            </span>
          ))}
          {p.variants.length === 0 && <span className="text-xs text-muted">No sizes yet</span>}
        </div>
        {missing > 0 && (
          <div className="mt-auto flex items-center gap-1.5 pt-1 text-xs font-semibold text-amber-ink">
            <IconAlert width={14} height={14} />
            {missing === 1 ? '1 size needs a price' : `${missing} sizes need a price`}
          </div>
        )}
      </div>
    </Link>
  );
}

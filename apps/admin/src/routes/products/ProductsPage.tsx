import { formatPkr } from '@preppal/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
  IconAlert,
  IconBox,
  IconCheck,
  IconCopy,
  IconEdit,
  IconImage,
  IconPlus,
  IconTag,
  IconTrash,
} from '../../components/icons';
import { RowMenu } from '../../components/overlays';
import {
  Badge,
  ButtonIcon,
  buttonCls,
  Card,
  EmptyState,
  ErrorNote,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  Skeleton,
  StatStrip,
} from '../../components/ui';
import { type AdminCategory, type AdminProduct, get } from '../../lib/api';
import { useProductActions } from './actions';

export const STATUS_META = {
  active: { label: 'Live', tone: 'green' },
  draft: { label: 'Draft', tone: 'amber' },
  archived: { label: 'Archived', tone: 'gray' },
} as const;

type StatusFilter = 'all' | AdminProduct['status'] | 'unpriced';
export const needsPrice = (p: AdminProduct) =>
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
  const catName = (id: string) => cats.data?.find((c) => c.id === id)?.name ?? 'No category';
  const unpriced = all.filter(needsPrice).length;
  const by = (s: AdminProduct['status']) => all.filter((p) => p.status === s).length;
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(
      (p) =>
        (status === 'all' || (status === 'unpriced' ? needsPrice(p) : p.status === status)) &&
        (!category || p.categoryId === category) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [all, status, category, search]);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Everything on the menu. Draft products stay hidden until you set them live."
        actions={
          <Link to="/products/$id" params={{ id: 'new' }} className={buttonCls()}>
            <ButtonIcon>
              <IconPlus width={14} height={14} />
            </ButtonIcon>
            New product
          </Link>
        }
      />
      <ErrorNote error={products.error} />

      <StatStrip
        className="mb-5"
        stats={[
          {
            icon: <IconBox width={18} height={18} />,
            tone: 'sky',
            label: 'Products',
            value: all.length,
            sub: `${by('archived')} archived`,
          },
          {
            icon: <IconCheck width={18} height={18} />,
            tone: 'green',
            label: 'Live',
            value: by('active'),
            sub: 'Visible on the storefront',
          },
          {
            icon: <IconAlert width={18} height={18} />,
            tone: 'amber',
            label: 'Need a price',
            value: unpriced,
            highlight: unpriced > 0,
            sub: unpriced ? 'Tap to show them' : 'Every size is priced',
            onClick: unpriced ? () => setStatus('unpriced') : undefined,
          },
          {
            icon: <IconTag width={18} height={18} />,
            tone: 'plum',
            label: 'Categories',
            value: cats.data?.length ?? '—',
            sub: (
              <Link to="/categories" className="font-semibold text-forest hover:underline">
                Manage categories
              </Link>
            ),
          },
        ]}
      />

      <Card bodyClassName="p-0">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <Segmented<StatusFilter>
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All', count: all.length },
              { value: 'active', label: 'Live', count: by('active') },
              { value: 'draft', label: 'Draft', count: by('draft') },
              { value: 'archived', label: 'Archived', count: by('archived') },
              { value: 'unpriced', label: 'Needs price', count: unpriced },
            ]}
          />
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
            <div className="sm:w-48">
              <Select
                aria-label="Filter by category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {cats.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <SearchInput
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-64"
            />
          </div>
        </div>

        {products.isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<IconBox />}
            title={all.length ? 'No products match' : 'No products yet'}
            action={
              !all.length && (
                <Link to="/products/$id" params={{ id: 'new' }} className={buttonCls()}>
                  Add your first product
                </Link>
              )
            }
          >
            {all.length ? 'Try another tab, category or search.' : 'Add a product to start selling.'}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4 p-4">
            {list.map((p) => (
              <ProductTile key={p.id} p={p} category={catName(p.categoryId)} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function ProductTile({ p, category }: { p: AdminProduct; category: string }) {
  const navigate = useNavigate();
  const { askDelete, duplicate, setStatus } = useProductActions();
  const meta = STATUS_META[p.status];
  const missing = p.variants.filter((v) => v.isActive && v.pricePkr <= 0).length;
  const prices = p.variants.filter((v) => v.isActive && v.pricePkr > 0).map((v) => v.pricePkr);

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-pop ${p.status === 'archived' ? 'opacity-70' : ''}`}
    >
      <Link
        to="/products/$id"
        params={{ id: p.id }}
        className="absolute inset-0 z-0"
        aria-label={`Edit ${p.name}`}
      />
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {p.imageUrls[0] ? (
          <img
            src={p.imageUrls[0]}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-faint">
            <IconImage width={34} height={34} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          {p.badge ? (
            <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
              {p.badge}
            </span>
          ) : (
            <span />
          )}
          <span className="rounded-full bg-white shadow-card">
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted">{category}</div>
            <div className="truncate text-[15px] font-bold text-ink">{p.name}</div>
          </div>
          <div className="relative z-10 -mr-1">
            <RowMenu
              items={[
                {
                  label: 'Edit',
                  icon: <IconEdit width={16} height={16} />,
                  onSelect: () => navigate({ to: '/products/$id', params: { id: p.id } }),
                },
                p.status === 'active'
                  ? {
                      label: 'Hide (set to draft)',
                      icon: <IconBox width={16} height={16} />,
                      onSelect: () => setStatus.mutate({ p, status: 'draft' }),
                    }
                  : {
                      label: 'Make live',
                      icon: <IconCheck width={16} height={16} />,
                      onSelect: () => setStatus.mutate({ p, status: 'active' }),
                    },
                {
                  label: 'Duplicate',
                  icon: <IconCopy width={16} height={16} />,
                  onSelect: () => duplicate.mutate(p),
                },
                {
                  label: 'Delete',
                  icon: <IconTrash width={16} height={16} />,
                  danger: true,
                  onSelect: () => askDelete(p),
                },
              ]}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-bold text-forest">
            {prices.length
              ? prices.length > 1
                ? `from ${formatPkr(Math.min(...prices))}`
                : formatPkr(prices[0])
              : '—'}
          </span>
          <span className="text-xs text-muted">
            {p.variants.length} size{p.variants.length === 1 ? '' : 's'}
          </span>
        </div>
        {missing > 0 && (
          <div className="mt-auto flex items-center gap-1.5 rounded-xl bg-amber-soft px-2.5 py-1.5 text-xs font-semibold text-amber-ink">
            <IconAlert width={14} height={14} />
            {missing === 1 ? '1 size needs a price' : `${missing} sizes need a price`}
          </div>
        )}
      </div>
    </div>
  );
}

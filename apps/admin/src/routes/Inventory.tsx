import { formatPkr } from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useMemo, useState } from 'react';
import { IconAlert, IconCheck, IconImage, IconPause, IconStack } from '../components/icons';
import { SaveBar, useFeedback } from '../components/overlays';
import {
  Badge,
  Card,
  EmptyState,
  ErrorNote,
  Input,
  PageHeader,
  PrefixInput,
  SearchInput,
  Segmented,
  Select,
  Skeleton,
  StatStrip,
  Toggle,
} from '../components/ui';
import { type AdminProduct, get, send } from '../lib/api';

interface InvRow {
  variantId: string;
  productName: string;
  variantLabel: string;
  pricePkr: number;
  inv: {
    isAvailable: boolean;
    stockQty: number | null;
    dailyLimit: number | null;
    priceOverridePkr: number | null;
  } | null;
}
interface Draft {
  isAvailable: boolean;
  stockQty: string;
  dailyLimit: string;
  priceOverridePkr: string;
}
type Filter = 'all' | 'on' | 'off' | 'low';

const toDraft = (r: InvRow): Draft => ({
  isAvailable: r.inv?.isAvailable ?? false,
  stockQty: r.inv?.stockQty?.toString() ?? '',
  dailyLimit: r.inv?.dailyLimit?.toString() ?? '',
  priceOverridePkr: r.inv?.priceOverridePkr?.toString() ?? '',
});
const num = (s: string) => (s.trim() === '' ? null : Math.max(0, Math.floor(Number(s))));
const digits = (s: string) => s.replace(/\D/g, '');
const isLow = (d: Draft) => d.stockQty !== '' && Number(d.stockQty) <= 5;

export function InventoryPage() {
  const qc = useQueryClient();
  const { toast } = useFeedback();
  const cities = useQuery({
    queryKey: ['cities'],
    queryFn: () => get<{ id: string; name: string }[]>('/admin/cities'),
  });
  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => get<AdminProduct[]>('/admin/products'),
  });
  const [cityId, setCityId] = useState('city_sahiwal');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState<Record<string, Draft>>({});
  const rows = useQuery({
    queryKey: ['inventory', cityId],
    queryFn: () => get<InvRow[]>(`/admin/inventory?cityId=${cityId}`),
  });

  const draftOf = (r: InvRow) => edits[r.variantId] ?? toDraft(r);
  const changed = Object.keys(edits).length;
  const imageFor = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const p of products.data ?? []) for (const v of p.variants) m.set(v.id, p.imageUrls[0] ?? null);
    return m;
  }, [products.data]);

  const all = rows.data ?? [];
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = new Map<string, InvRow[]>();
    for (const r of all) {
      const d = edits[r.variantId] ?? toDraft(r);
      if (filter === 'on' && !d.isAvailable) continue;
      if (filter === 'off' && d.isAvailable) continue;
      if (filter === 'low' && !isLow(d)) continue;
      if (q && !r.productName.toLowerCase().includes(q)) continue;
      out.set(r.productName, [...(out.get(r.productName) ?? []), r]);
    }
    return [...out.entries()];
  }, [all, edits, filter, search]);

  const setDraft = (r: InvRow, patch: Partial<Draft>) => {
    const next = { ...draftOf(r), ...patch };
    setEdits((e) => {
      const copy = { ...e };
      if (JSON.stringify(next) === JSON.stringify(toDraft(r))) delete copy[r.variantId];
      else copy[r.variantId] = next;
      return copy;
    });
  };

  const save = useMutation({
    mutationFn: () =>
      Promise.all(
        Object.entries(edits).map(([variantId, d]) =>
          send('PUT', `/admin/inventory/${variantId}/${cityId}`, {
            isAvailable: d.isAvailable,
            stockQty: num(d.stockQty),
            dailyLimit: num(d.dailyLimit) || null,
            priceOverridePkr: num(d.priceOverridePkr) || null,
          }),
        ),
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['inventory', cityId] });
      toast(`${changed} item${changed === 1 ? '' : 's'} updated`);
      setEdits({});
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const onSale = all.filter((r) => draftOf(r).isAvailable).length;
  const low = all.filter((r) => isLow(draftOf(r))).length;
  const multiCity = (cities.data?.length ?? 0) > 1;

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Switch sizes on or off, track stock, and cap how many can be ordered per delivery day."
        actions={
          multiCity && (
            <div className="w-48">
              <Select
                aria-label="City"
                value={cityId}
                onChange={(e) => {
                  setEdits({});
                  setCityId(e.target.value);
                }}
                className="rounded-full"
              >
                {cities.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )
        }
      />
      <ErrorNote error={rows.error} />

      <StatStrip
        className="mb-5"
        stats={[
          {
            icon: <IconStack width={18} height={18} />,
            tone: 'sky',
            label: 'Sizes',
            value: all.length,
            sub: 'Across all products',
          },
          {
            icon: <IconCheck width={18} height={18} />,
            tone: 'green',
            label: 'On sale',
            value: onSale,
            sub: 'Customers can order these',
          },
          {
            icon: <IconPause width={18} height={18} />,
            tone: 'gray',
            label: 'Switched off',
            value: all.length - onSale,
            sub: 'Hidden at checkout',
          },
          {
            icon: <IconAlert width={18} height={18} />,
            tone: 'amber',
            label: 'Low or sold out',
            value: low,
            highlight: low > 0,
            sub: low ? 'Tap to show them' : 'Stock looks fine',
            onClick: low ? () => setFilter('low') : undefined,
          },
        ]}
      />

      <Card
        icon={<IconStack width={18} height={18} />}
        tone="sky"
        title="Stock by product"
        description="Empty stock = made to order. Daily limit caps units per delivery day. City price overrides the base price here only."
        bodyClassName="pt-4"
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-3 px-5 pb-4 md:flex-row md:items-center">
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: all.length },
              { value: 'on', label: 'On sale', count: onSale },
              { value: 'off', label: 'Off', count: all.length - onSale },
              { value: 'low', label: 'Low stock', count: low },
            ]}
          />
          <SearchInput
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:ml-auto md:w-64"
          />
        </div>
        <div className="hidden grid-cols-[minmax(0,1.4fr)_90px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-y border-line bg-subtle px-5 py-2.5 text-[11px] font-bold tracking-[0.08em] text-faint uppercase lg:grid">
          <span>Size</span>
          <span>On sale</span>
          <span>Stock</span>
          <span>Daily limit</span>
          <span>City price</span>
        </div>
        {rows.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState icon={<IconStack />} title="Nothing here">
            No sizes match this filter.
          </EmptyState>
        ) : (
          groups.map(([product, variants]) => (
            <section key={product} className="border-b border-line last:border-b-0">
              <div className="flex items-center gap-3 px-5 pt-3.5 pb-1">
                <Thumb src={imageFor.get(variants[0]?.variantId ?? '') ?? null} />
                <h3 className="text-[15px] font-bold text-ink">{product}</h3>
              </div>
              {variants.map((r) => {
                const d = draftOf(r);
                const dirty = !!edits[r.variantId];
                return (
                  <div
                    key={r.variantId}
                    className={`grid grid-cols-2 items-center gap-x-4 gap-y-2 px-5 py-3 transition lg:grid-cols-[minmax(0,1.4fr)_90px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] ${dirty ? 'bg-sage-soft/50' : ''} ${d.isAvailable ? '' : 'text-muted'}`}
                  >
                    <div className="flex flex-wrap items-center gap-2 lg:pl-11">
                      <span className="text-sm font-semibold">{r.variantLabel}</span>
                      <span className="text-xs text-muted">
                        {r.pricePkr > 0 ? formatPkr(r.pricePkr) : 'no price'}
                      </span>
                      {d.stockQty === '0' && <Badge tone="red">Sold out</Badge>}
                      {isLow(d) && d.stockQty !== '0' && <Badge tone="amber">Low</Badge>}
                    </div>
                    <div className="justify-self-end lg:justify-self-start">
                      <Toggle
                        label={`${product} ${r.variantLabel} on sale`}
                        checked={d.isAvailable}
                        onChange={(v) => setDraft(r, { isAvailable: v })}
                      />
                    </div>
                    <MobileLabel label="Stock">
                      <Input
                        aria-label="Stock"
                        inputMode="numeric"
                        placeholder="Made to order"
                        value={d.stockQty}
                        onChange={(e) => setDraft(r, { stockQty: digits(e.target.value) })}
                        className="h-9 text-sm"
                      />
                    </MobileLabel>
                    <MobileLabel label="Daily limit">
                      <Input
                        aria-label="Daily limit"
                        inputMode="numeric"
                        placeholder="No limit"
                        value={d.dailyLimit}
                        onChange={(e) => setDraft(r, { dailyLimit: digits(e.target.value) })}
                        className="h-9 text-sm"
                      />
                    </MobileLabel>
                    <MobileLabel label="City price" className="col-span-2 lg:col-span-1">
                      <PrefixInput
                        prefix="Rs"
                        aria-label="City price"
                        inputMode="numeric"
                        placeholder={r.pricePkr > 0 ? String(r.pricePkr) : 'Base'}
                        value={d.priceOverridePkr}
                        onChange={(e) => setDraft(r, { priceOverridePkr: digits(e.target.value) })}
                        className="[&_input]:h-9 [&_input]:text-sm"
                      />
                    </MobileLabel>
                  </div>
                );
              })}
            </section>
          ))
        )}
      </Card>

      <SaveBar
        show={changed > 0}
        saving={save.isPending}
        label={`${changed} size${changed === 1 ? '' : 's'} changed`}
        saveLabel="Save all"
        onSave={() => save.mutate()}
        onDiscard={() => setEdits({})}
      />
    </>
  );
}

/** Column label that only shows on small screens (desktop has a header row). */
function MobileLabel({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-semibold text-muted lg:hidden">{label}</span>
      {children}
    </div>
  );
}

function Thumb({ src }: { src: string | null }) {
  return src ? (
    <img src={src} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-line" />
  ) : (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-sand text-muted/60">
      <IconImage width={16} height={16} />
    </span>
  );
}

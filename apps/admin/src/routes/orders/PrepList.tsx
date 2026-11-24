import { formatDeliveryDate } from '@preppal/shared';
import { useQuery } from '@tanstack/react-query';
import { IconChef, IconPrinter } from '../../components/icons';
import { EmptyState, IconButton, Skeleton } from '../../components/ui';
import { get } from '../../lib/api';

interface PrepRow {
  productName: string;
  variantLabel: string;
  qty: number;
}

/** Print only one section of the page (see @media print in styles.css). */
export function printSection(section: 'orders' | 'prep') {
  const html = document.documentElement;
  if (section === 'prep') html.dataset.print = 'prep';
  const reset = () => {
    delete html.dataset.print;
    window.removeEventListener('afterprint', reset);
  };
  window.addEventListener('afterprint', reset);
  window.print();
}

export function PrepList({ date }: { date: string }) {
  const prep = useQuery({
    queryKey: ['prep', date],
    queryFn: () => get<PrepRow[]>(`/admin/prep-list?date=${date}`),
    enabled: !!date,
    refetchInterval: 30_000,
  });
  const rows = prep.data ?? [];
  const groups = rows.reduce<Record<string, PrepRow[]>>((acc, r) => {
    acc[r.productName] ??= [];
    acc[r.productName]?.push(r);
    return acc;
  }, {});
  const totalUnits = rows.reduce((a, r) => a + r.qty, 0);

  return (
    <section
      data-print-section="prep"
      className="overflow-hidden rounded-2xl border border-line bg-white shadow-card lg:sticky lg:top-6"
    >
      <header className="flex items-start justify-between gap-3 bg-forest px-5 py-4 text-white">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-sage">Kitchen</div>
          <h2 className="text-xl font-semibold">Prep list</h2>
          <p className="text-[13px] text-nav-text">
            {date ? formatDeliveryDate(date) : '…'} · {totalUnits} unit{totalUnits === 1 ? '' : 's'}
          </p>
        </div>
        <IconButton
          label="Print prep list"
          onClick={() => printSection('prep')}
          className="text-white hover:bg-white/10 hover:text-white"
          data-print-hide
        >
          <IconPrinter />
        </IconButton>
      </header>
      {prep.isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<IconChef />} title="Nothing to prep">
          Quantities add up here as orders come in. Cancelled orders are left out.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {Object.entries(groups).map(([product, variants]) => (
            <li key={product} className="px-5 py-3">
              <div className="mb-1.5 text-sm font-semibold text-ink">{product}</div>
              {variants.map((v) => (
                <div key={v.variantLabel} className="flex items-center justify-between py-0.5 text-sm">
                  <span className="text-muted">{v.variantLabel}</span>
                  <span className="grid h-7 min-w-10 place-items-center rounded-lg bg-sage-soft px-2 font-bold text-forest tabular-nums">
                    ×{v.qty}
                  </span>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

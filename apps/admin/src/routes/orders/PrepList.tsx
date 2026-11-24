import { formatDeliveryDate } from '@preppal/shared';
import { useQuery } from '@tanstack/react-query';
import { IconChef, IconPrinter } from '../../components/icons';
import { Card, EmptyState, IconButton, Skeleton } from '../../components/ui';
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
    <div data-print-section="prep" className="2xl:sticky 2xl:top-6">
      <Card
        icon={<IconChef width={18} height={18} />}
        tone="clay"
        title="Prep list"
        description={`${date ? formatDeliveryDate(date) : '…'} · ${totalUnits} unit${totalUnits === 1 ? '' : 's'} to make`}
        actions={
          <IconButton label="Print prep list" onClick={() => printSection('prep')} data-print-hide>
            <IconPrinter width={17} height={17} />
          </IconButton>
        }
        bodyClassName="px-2 pt-3 pb-2"
      >
        <div>
          {prep.isLoading ? (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState icon={<IconChef />} title="Nothing to prep">
              Quantities add up here as orders come in. Cancelled orders are left out.
            </EmptyState>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-1">
              {Object.entries(groups).map(([product, variants]) => (
                <li key={product} className="rounded-2xl px-3 py-2.5 transition hover:bg-subtle">
                  <div className="text-sm font-bold text-ink">{product}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {variants.map((v) => (
                      <span
                        key={v.variantLabel}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-0.5 pr-1 pl-2.5 text-xs font-medium text-muted"
                      >
                        {v.variantLabel}
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
                          ×{v.qty}
                        </span>
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

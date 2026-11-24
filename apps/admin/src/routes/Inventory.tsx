import { formatPkr } from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, ErrorNote, Input, PageHeader, Select } from '../components/ui';
import { get, send } from '../lib/api';

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

export function InventoryPage() {
  const cities = useQuery({
    queryKey: ['cities'],
    queryFn: () => get<{ id: string; name: string }[]>('/admin/cities'),
  });
  const [cityId, setCityId] = useState('city_sahiwal');
  const rows = useQuery({
    queryKey: ['inventory', cityId],
    queryFn: () => get<InvRow[]>(`/admin/inventory?cityId=${cityId}`),
  });

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Empty stock = made to order. Daily limit caps how many can be ordered per delivery day."
        actions={
          <Select value={cityId} onChange={(e) => setCityId(e.target.value)} className="w-48">
            {cities.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        }
      />
      <ErrorNote error={rows.error} />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Base price</th>
              <th className="p-3">On sale</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Daily limit</th>
              <th className="p-3">City price</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.data?.map((r) => (
              <Row key={r.variantId} r={r} cityId={cityId} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const num = (s: string) => (s.trim() === '' ? null : Math.max(0, Math.floor(Number(s))));

function Row({ r, cityId }: { r: InvRow; cityId: string }) {
  const qc = useQueryClient();
  const [v, setV] = useState({
    isAvailable: r.inv?.isAvailable ?? false,
    stockQty: r.inv?.stockQty?.toString() ?? '',
    dailyLimit: r.inv?.dailyLimit?.toString() ?? '',
    priceOverridePkr: r.inv?.priceOverridePkr?.toString() ?? '',
  });
  const save = useMutation({
    mutationFn: () =>
      send('PUT', `/admin/inventory/${r.variantId}/${cityId}`, {
        isAvailable: v.isAvailable,
        stockQty: num(v.stockQty),
        dailyLimit: num(v.dailyLimit) || null,
        priceOverridePkr: num(v.priceOverridePkr) || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory', cityId] }),
  });
  return (
    <tr className="border-t border-[#F1ECE2]">
      <td className="p-3 font-semibold">
        {r.productName} <span className="font-normal text-muted">({r.variantLabel})</span>
      </td>
      <td className="p-3">{formatPkr(r.pricePkr)}</td>
      <td className="p-3">
        <input
          type="checkbox"
          checked={v.isAvailable}
          onChange={(e) => setV({ ...v, isAvailable: e.target.checked })}
          aria-label="On sale"
        />
      </td>
      <td className="p-3">
        <Input
          className="w-28"
          placeholder="Made to order"
          value={v.stockQty}
          onChange={(e) => setV({ ...v, stockQty: e.target.value })}
        />
      </td>
      <td className="p-3">
        <Input
          className="w-24"
          placeholder="No limit"
          value={v.dailyLimit}
          onChange={(e) => setV({ ...v, dailyLimit: e.target.value })}
        />
      </td>
      <td className="p-3">
        <Input
          className="w-24"
          placeholder="Base"
          value={v.priceOverridePkr}
          onChange={(e) => setV({ ...v, priceOverridePkr: e.target.value })}
        />
      </td>
      <td className="p-3 text-right">
        <Button className="h-8" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isSuccess ? 'Saved ✓' : 'Save'}
        </Button>
        {save.error && <div className="text-xs text-terra">{(save.error as Error).message}</div>}
      </td>
    </tr>
  );
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { IconPlus } from '../../components/icons';
import { useFeedback } from '../../components/overlays';
import { Badge, Button, Card, Input, PrefixInput, Toggle } from '../../components/ui';
import { type AdminVariant, send } from '../../lib/api';

const EMPTY = { label: '', sku: '', pricePkr: 0, unitNote: '' };

export function VariantsCard({
  productId,
  variants,
  skuHint,
}: {
  productId: string;
  variants: AdminVariant[];
  skuHint: string;
}) {
  const qc = useQueryClient();
  const { toast } = useFeedback();
  const [adding, setAdding] = useState(variants.length === 0);
  const [draft, setDraft] = useState(EMPTY);
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['product', productId] }),
      qc.invalidateQueries({ queryKey: ['products'] }),
      qc.invalidateQueries({ queryKey: ['inventory'] }),
    ]);
  const add = useMutation({
    mutationFn: () =>
      send('POST', `/admin/products/${productId}/variants`, {
        ...draft,
        sortOrder: variants.length + 1,
        isActive: true,
      }),
    onSuccess: async () => {
      toast(`Size “${draft.label}” added`);
      setDraft(EMPTY);
      setAdding(false);
      await refresh();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });
  const update = useMutation({
    mutationFn: ({ id, productId: _p, ...body }: AdminVariant) => send('PUT', `/admin/variants/${id}`, body),
    onSuccess: async (_r, v) => {
      toast(`${v.label} saved`);
      await refresh();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  return (
    <Card
      title="Sizes & prices"
      description="Each size is a separate option customers can pick. Stock per city is set under Inventory."
      actions={
        !adding && (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <IconPlus width={15} height={15} /> Add size
          </Button>
        )
      }
      bodyClassName="p-0"
    >
      <div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr_120px] gap-3 border-b border-line bg-canvas/60 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted md:grid">
        <span>Size</span>
        <span>Price</span>
        <span>SKU</span>
        <span>Unit note</span>
        <span>On sale</span>
      </div>
      <ul className="divide-y divide-line">
        {variants.map((v) => (
          <VariantRow key={`${v.id}-${v.pricePkr}-${v.isActive}`} v={v} onSave={(nv) => update.mutate(nv)} />
        ))}
      </ul>
      {adding && (
        <div className="border-t border-line bg-sage-soft/40 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_1fr_120px] md:items-center">
            <Input
              aria-label="Size"
              placeholder="e.g. 250 g"
              value={draft.label}
              autoFocus
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
            <PrefixInput
              prefix="Rs"
              aria-label="Price"
              type="number"
              min={0}
              value={draft.pricePkr || ''}
              placeholder="0"
              onChange={(e) => setDraft({ ...draft, pricePkr: Number(e.target.value) })}
            />
            <Input
              aria-label="SKU"
              placeholder={skuHint}
              value={draft.sku}
              onChange={(e) => setDraft({ ...draft, sku: e.target.value.toUpperCase() })}
            />
            <Input
              aria-label="Unit note"
              placeholder="e.g. per kg"
              value={draft.unitNote}
              onChange={(e) => setDraft({ ...draft, unitNote: e.target.value })}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => add.mutate()}
                disabled={!draft.label || draft.sku.length < 2 || add.isPending}
                className="flex-1"
              >
                Add
              </Button>
            </div>
          </div>
          {variants.length > 0 && (
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="mt-2 text-xs font-semibold text-muted hover:text-ink"
            >
              Cancel
            </button>
          )}
        </div>
      )}
      {variants.length === 0 && !adding && <p className="px-5 py-6 text-sm text-muted">No sizes yet.</p>}
    </Card>
  );
}

function VariantRow({ v, onSave }: { v: AdminVariant; onSave: (v: AdminVariant) => void }) {
  const [row, setRow] = useState(v);
  const dirty = JSON.stringify(row) !== JSON.stringify(v);
  return (
    <li className={`px-5 py-3 ${dirty ? 'bg-sage-soft/40' : ''}`}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[1.1fr_1fr_1fr_1fr_120px] md:items-center">
        <div className="col-span-2 flex items-center gap-2 md:col-span-1">
          <Input
            aria-label="Size"
            value={row.label}
            onChange={(e) => setRow({ ...row, label: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <PrefixInput
            prefix="Rs"
            aria-label={`Price for ${v.label}`}
            type="number"
            min={0}
            value={row.pricePkr || ''}
            placeholder="Set price"
            onChange={(e) => setRow({ ...row, pricePkr: Number(e.target.value) })}
            className={row.pricePkr <= 0 ? '[&_input]:border-amber-ink/40 [&_input]:bg-amber-soft/50' : ''}
          />
        </div>
        <Input aria-label="SKU" value={row.sku} onChange={(e) => setRow({ ...row, sku: e.target.value })} />
        <Input
          aria-label="Unit note"
          placeholder="—"
          value={row.unitNote}
          onChange={(e) => setRow({ ...row, unitNote: e.target.value })}
        />
        <div className="col-span-2 flex items-center gap-2 md:col-span-1">
          <Toggle
            label={`${v.label} on sale`}
            checked={row.isActive}
            onChange={(isActive) => setRow({ ...row, isActive })}
          />
          {dirty ? (
            <Button size="sm" onClick={() => onSave(row)}>
              Save
            </Button>
          ) : (
            row.pricePkr <= 0 && row.isActive && <Badge tone="amber">No price</Badge>
          )}
        </div>
      </div>
    </li>
  );
}

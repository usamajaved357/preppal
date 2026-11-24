import { PRODUCT_BADGES } from '@preppal/shared';
import { IconImage } from '../../components/icons';
import { Card, Field, Input, Select } from '../../components/ui';
import type { AdminCategory } from '../../lib/api';
import { type Form, slugify } from './ProductEditPage';

const STATUS_CHOICES = [
  { value: 'active', title: 'Live', body: 'Visible and orderable on the storefront' },
  { value: 'draft', title: 'Draft', body: 'Hidden while you finish setting it up' },
  { value: 'archived', title: 'Archived', body: 'No longer sold; kept for old orders' },
] as const;

/** Right column of the product editor: visibility, organisation, live preview. */
export function ProductSidebar({
  form,
  set,
  categories,
  priceLabel,
}: {
  form: Form;
  set: <K extends keyof Form>(k: K, v: Form[K]) => void;
  categories: AdminCategory[];
  priceLabel: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Card title="Visibility" bodyClassName="flex flex-col gap-2 p-4">
        {STATUS_CHOICES.map((s) => (
          <label
            key={s.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
              form.status === s.value
                ? 'border-forest bg-sage-soft/60 ring-1 ring-forest'
                : 'border-line hover:border-line-strong'
            }`}
          >
            <input
              type="radio"
              name="status"
              checked={form.status === s.value}
              onChange={() => set('status', s.value)}
              className="mt-1 accent-forest"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">{s.title}</span>
              <span className="block text-xs text-muted">{s.body}</span>
            </span>
          </label>
        ))}
      </Card>

      <Card title="Organise" bodyClassName="flex flex-col gap-4 p-4">
        <Field label="Category">
          <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            <option value="">Choose a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isActive ? '' : ' (hidden)'}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Badge" hint="Small label on the photo">
          <Select
            value={form.badge ?? ''}
            onChange={(e) => set('badge', (e.target.value || null) as Form['badge'])}
          >
            <option value="">No badge</option>
            {PRODUCT_BADGES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <Field label="Web address" hint={`/p/${form.slug || '…'}`}>
            <Input value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} />
          </Field>
          <Field label="Order" hint="Lower first">
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>

      <Card title="Preview" bodyClassName="p-4">
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="relative aspect-[4/3] bg-sand">
            {form.photos[0] ? (
              <img src={form.photos[0].url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted/50">
                <IconImage width={32} height={32} />
              </div>
            )}
            {form.badge && (
              <span className="absolute top-2 left-2 rounded-full bg-terra px-2 py-0.5 text-[11px] font-bold text-white">
                {form.badge}
              </span>
            )}
          </div>
          <div className="p-3">
            <div className="font-display font-semibold text-ink">{form.name || 'Product name'}</div>
            <div className="truncate text-xs text-muted">{form.shortDescription || 'Short description'}</div>
            <div className="mt-2 text-sm font-bold text-forest">{priceLabel}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

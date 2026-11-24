import { PRODUCT_BADGES } from '@preppal/shared';
import { useState } from 'react';
import { IconCheck, IconImage, IconPlus, IconSettings, IconSun } from '../../components/icons';
import { Card, Field, Input, OptionCard, Select } from '../../components/ui';
import type { AdminCategory } from '../../lib/api';
import { CategoryModal, newCategoryDraft } from '../categories/CategoryModal';
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
  const [newCat, setNewCat] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <Card
        icon={<IconSun width={18} height={18} />}
        tone="green"
        title="Visibility"
        bodyClassName="flex flex-col gap-2 p-4"
      >
        {STATUS_CHOICES.map((s) => (
          <OptionCard
            key={s.value}
            selected={form.status === s.value}
            title={s.title}
            body={s.body}
            onSelect={() => set('status', s.value)}
          />
        ))}
      </Card>

      <Card
        icon={<IconSettings width={18} height={18} />}
        tone="sky"
        title="Organise"
        bodyClassName="flex flex-col gap-4 p-4"
      >
        <Field label="Category" group>
          <div className="flex gap-2">
            <Select
              aria-label="Category"
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
            >
              <option value="">Choose a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isActive ? '' : ' (hidden)'}
                </option>
              ))}
            </Select>
            <button
              type="button"
              title="New category"
              aria-label="New category"
              onClick={() => setNewCat(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line-strong text-ink transition hover:bg-subtle"
            >
              <IconPlus width={16} height={16} />
            </button>
          </div>
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
        <div className="grid grid-cols-[1fr_88px] gap-3">
          <Field label="Web address" hint={`/p/${form.slug || '…'}`}>
            <Input value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} />
          </Field>
          <Field label="Position" hint="Lower first">
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>

      <Card
        icon={<IconCheck width={18} height={18} />}
        tone="plum"
        title="Storefront preview"
        bodyClassName="p-4"
      >
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          <div className="relative aspect-[4/3] bg-sand">
            {form.photos[0] ? (
              <img src={form.photos[0].url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-faint">
                <IconImage width={32} height={32} />
              </div>
            )}
            {form.badge && (
              <span className="absolute top-2 left-2 rounded-full bg-forest px-2.5 py-0.5 text-[11px] font-bold text-white">
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

      {newCat && (
        <CategoryModal
          initial={newCategoryDraft((categories.at(-1)?.sortOrder ?? 0) + 1)}
          onClose={() => setNewCat(false)}
          onSaved={(id) => set('categoryId', id)}
        />
      )}
    </div>
  );
}

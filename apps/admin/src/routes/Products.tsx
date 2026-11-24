import { formatPkr, PRODUCT_BADGES } from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button, Card, ErrorNote, Field, Input, inputCls, PageHeader, Select } from '../components/ui';
import { type AdminCategory, type AdminProduct, type AdminVariant, get, send } from '../lib/api';
import { toWebp } from '../lib/image';

export function ProductsPage() {
  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => get<AdminProduct[]>('/admin/products'),
  });
  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Prices of 0 are hidden from customers until set."
        actions={
          <Link
            to="/products/$id"
            params={{ id: 'new' }}
            className="inline-flex h-10 items-center rounded-[10px] bg-forest px-4 text-sm font-semibold text-white"
          >
            + New product
          </Link>
        }
      />
      <ErrorNote error={products.error} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {(products.data ?? []).map((p) => (
          <Link
            key={p.id}
            to="/products/$id"
            params={{ id: p.id }}
            className="overflow-hidden rounded-2xl border border-line bg-white hover:border-forest"
          >
            <div className="h-36 bg-sand">
              {p.imageUrls[0] && <img src={p.imageUrls[0]} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{p.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${p.status === 'active' ? 'bg-sage-soft text-forest' : 'bg-[#F3F4F6] text-muted'}`}
                >
                  {p.status}
                </span>
              </div>
              <div className="mt-1 text-sm text-muted">
                {p.variants.map((v) => `${v.label}: ${formatPkr(v.pricePkr)}`).join(' · ') || 'No sizes yet'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

const EMPTY: Omit<AdminProduct, 'id' | 'imageUrls' | 'variants'> = {
  categoryId: '',
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  howToUse: '',
  ingredients: '',
  storage: '',
  badge: null,
  imageKeys: [],
  status: 'draft',
  sortOrder: 0,
};
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function ProductEditPage() {
  const { id } = useParams({ from: '/products/$id' });
  const isNew = id === 'new';
  const qc = useQueryClient();
  const navigate = useNavigate();
  const cats = useQuery({
    queryKey: ['categories'],
    queryFn: () => get<AdminCategory[]>('/admin/categories'),
  });
  const product = useQuery({
    queryKey: ['product', id],
    queryFn: () => get<AdminProduct>(`/admin/products/${id}`),
    enabled: !isNew,
  });
  const [form, setForm] = useState(EMPTY);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (product.data) {
      const { id: _id, imageUrls, variants: _v, ...rest } = product.data;
      setForm(rest);
      setPreviews(imageUrls.filter((u): u is string => !!u));
    }
  }, [product.data]);

  const save = useMutation({
    mutationFn: (): Promise<{ id?: string; ok?: true }> =>
      isNew
        ? send<{ id: string }>('POST', '/admin/products', form)
        : send('PUT', `/admin/products/${id}`, form),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ['products'] });
      if (isNew && res.id) navigate({ to: '/products/$id', params: { id: res.id } });
    },
  });
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', new File([await toWebp(file)], 'image.webp', { type: 'image/webp' }));
      return send<{ key: string; url: string }>('POST', '/admin/uploads', fd);
    },
    onSuccess: (r) => {
      setForm((f) => ({ ...f, imageKeys: [...f.imageKeys, r.key] }));
      setPreviews((p) => [...p, r.url]);
    },
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <PageHeader
        title={isNew ? 'New product' : form.name || 'Product'}
        actions={
          <div className="flex gap-2">
            <Link
              to="/products"
              className="inline-flex h-10 items-center rounded-[10px] border border-[#D7D0C1] bg-white px-4 text-sm font-semibold"
            >
              Back
            </Link>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save product'}
            </Button>
          </div>
        }
      />
      <ErrorNote error={save.error ?? upload.error} />
      {save.isSuccess && <p className="mb-3 text-sm text-forest">Saved ✓</p>}
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <Card title="Basics">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  value={form.name}
                  onChange={(e) => {
                    set('name', e.target.value);
                    if (isNew) set('slug', slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Category">
                <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                  <option value="">Choose…</option>
                  {cats.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.isActive ? '' : ' (hidden)'}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="URL slug" hint="preppal.pk/p/…">
                <Input value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} />
              </Field>
              <Field label="Badge">
                <Select value={form.badge ?? ''} onChange={(e) => set('badge', e.target.value || null)}>
                  <option value="">None</option>
                  {PRODUCT_BADGES.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Short description" hint="One line on the product card">
              <Input
                value={form.shortDescription}
                maxLength={160}
                onChange={(e) => set('shortDescription', e.target.value)}
              />
            </Field>
            {(['description', 'howToUse', 'ingredients', 'storage'] as const).map((k) => (
              <Field
                key={k}
                label={
                  {
                    description: 'Description',
                    howToUse: 'How to use',
                    ingredients: 'Ingredients',
                    storage: 'Storage & shelf life',
                  }[k]
                }
              >
                <textarea
                  rows={3}
                  value={form[k]}
                  onChange={(e) => set(k, e.target.value)}
                  className={`${inputCls} h-auto py-2`}
                />
              </Field>
            ))}
          </Card>
          <Card title="Photos">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
              {previews.map((src, i) => (
                <div key={src} className="relative h-28 overflow-hidden rounded-xl">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-forest px-1.5 text-[11px] font-bold text-white">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Remove photo"
                    className="absolute right-1.5 top-1.5 rounded bg-white/90 px-1.5 text-xs"
                    onClick={() => {
                      set(
                        'imageKeys',
                        form.imageKeys.filter((_, j) => j !== i),
                      );
                      setPreviews(previews.filter((_, j) => j !== i));
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label className="grid h-28 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-[#BFC9B8] text-sm font-semibold text-forest">
                {upload.isPending ? 'Uploading…' : '+ Upload'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload.mutate(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-muted">
              Images are resized to WebP in your browser before upload. Save the product after uploading.
            </p>
          </Card>
          {!isNew && product.data && <VariantsCard productId={id} variants={product.data.variants} />}
        </div>
        <div className="flex-[1_1_240px]">
          <Card title="Status">
            {(['active', 'draft', 'archived'] as const).map((s) => (
              <label
                key={s}
                className={`flex items-center gap-2.5 rounded-xl p-3 font-semibold ${form.status === s ? 'border-2 border-forest bg-sage-soft' : 'border border-[#D7D0C1]'}`}
              >
                <input
                  type="radio"
                  checked={form.status === s}
                  onChange={() => set('status', s)}
                  className="accent-forest"
                />
                {{ active: 'Live on site', draft: 'Draft (hidden)', archived: 'Archived' }[s]}
              </label>
            ))}
            <Field label="Sort order" hint="Lower shows first">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', Number(e.target.value))}
              />
            </Field>
          </Card>
        </div>
      </div>
    </>
  );
}

function VariantsCard({ productId, variants }: { productId: string; variants: AdminVariant[] }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState({ label: '', sku: '', pricePkr: 0, unitNote: '' });
  const refresh = () => qc.invalidateQueries({ queryKey: ['product', productId] });
  const add = useMutation({
    mutationFn: () =>
      send('POST', `/admin/products/${productId}/variants`, {
        ...draft,
        sortOrder: variants.length + 1,
        isActive: true,
      }),
    onSuccess: () => {
      setDraft({ label: '', sku: '', pricePkr: 0, unitNote: '' });
      refresh();
    },
  });
  const update = useMutation({
    mutationFn: (v: AdminVariant) =>
      send('PUT', `/admin/variants/${v.id}`, {
        label: v.label,
        sku: v.sku,
        pricePkr: v.pricePkr,
        unitNote: v.unitNote,
        sortOrder: v.sortOrder,
        isActive: v.isActive,
      }),
    onSuccess: refresh,
  });
  return (
    <Card title="Sizes & prices">
      <ErrorNote error={add.error ?? update.error} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-2">Size</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Price (Rs)</th>
              <th className="p-2">Unit note</th>
              <th className="p-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <VariantRow key={v.id} v={v} onSave={(nv) => update.mutate(nv)} />
            ))}
            <tr className="border-t border-line">
              <td className="p-2">
                <Input
                  placeholder="e.g. 250 g"
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                />
              </td>
              <td className="p-2">
                <Input
                  placeholder="GGP-250"
                  value={draft.sku}
                  onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  min={0}
                  value={draft.pricePkr}
                  onChange={(e) => setDraft({ ...draft, pricePkr: Number(e.target.value) })}
                />
              </td>
              <td className="p-2">
                <Input
                  placeholder="per kg"
                  value={draft.unitNote}
                  onChange={(e) => setDraft({ ...draft, unitNote: e.target.value })}
                />
              </td>
              <td className="p-2">
                <Button onClick={() => add.mutate()} disabled={!draft.label || !draft.sku}>
                  Add
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function VariantRow({ v, onSave }: { v: AdminVariant; onSave: (v: AdminVariant) => void }) {
  const [row, setRow] = useState(v);
  const dirty = JSON.stringify(row) !== JSON.stringify(v);
  return (
    <tr className="border-t border-line">
      <td className="p-2">
        <Input value={row.label} onChange={(e) => setRow({ ...row, label: e.target.value })} />
      </td>
      <td className="p-2">
        <Input value={row.sku} onChange={(e) => setRow({ ...row, sku: e.target.value })} />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min={0}
          value={row.pricePkr}
          onChange={(e) => setRow({ ...row, pricePkr: Number(e.target.value) })}
        />
      </td>
      <td className="p-2">
        <Input value={row.unitNote} onChange={(e) => setRow({ ...row, unitNote: e.target.value })} />
      </td>
      <td className="whitespace-nowrap p-2">
        <input
          type="checkbox"
          checked={row.isActive}
          onChange={(e) => setRow({ ...row, isActive: e.target.checked })}
          aria-label="Active"
        />
        {dirty && (
          <Button className="ml-2 h-8" onClick={() => onSave(row)}>
            Save
          </Button>
        )}
      </td>
    </tr>
  );
}

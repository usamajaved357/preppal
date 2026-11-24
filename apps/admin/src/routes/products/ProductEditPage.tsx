import { formatPkr } from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { IconChevronLeft, IconExternal } from '../../components/icons';
import { SaveBar, useFeedback } from '../../components/overlays';
import {
  Badge,
  Button,
  buttonCls,
  Card,
  ErrorNote,
  Field,
  Input,
  Skeleton,
  Textarea,
} from '../../components/ui';
import { type AdminCategory, type AdminProduct, get, send } from '../../lib/api';
import { STOREFRONT_URL } from '../../lib/site';
import { type Photo, PhotosCard } from './PhotosCard';
import { ProductSidebar } from './ProductSidebar';
import { STATUS_META } from './ProductsPage';
import { VariantsCard } from './VariantsCard';

export type Form = Omit<AdminProduct, 'id' | 'imageUrls' | 'variants' | 'imageKeys'> & { photos: Photo[] };
const EMPTY: Form = {
  categoryId: '',
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  howToUse: '',
  ingredients: '',
  storage: '',
  badge: null,
  photos: [],
  status: 'draft',
  sortOrder: 0,
};
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const toForm = (p: AdminProduct): Form => ({
  categoryId: p.categoryId,
  name: p.name,
  slug: p.slug,
  shortDescription: p.shortDescription,
  description: p.description,
  howToUse: p.howToUse,
  ingredients: p.ingredients,
  storage: p.storage,
  badge: p.badge,
  status: p.status,
  sortOrder: p.sortOrder,
  photos: p.imageKeys.map((key, i) => ({ key, url: p.imageUrls[i] ?? '' })),
});

export function ProductEditPage() {
  const { id } = useParams({ from: '/products/$id' });
  const isNew = id === 'new';
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const cats = useQuery({
    queryKey: ['categories'],
    queryFn: () => get<AdminCategory[]>('/admin/categories'),
  });
  const product = useQuery({
    queryKey: ['product', id],
    queryFn: () => get<AdminProduct>(`/admin/products/${id}`),
    enabled: !isNew,
  });
  const initial = useMemo(() => (product.data ? toForm(product.data) : EMPTY), [product.data]);
  const [form, setForm] = useState<Form>(EMPTY);
  useEffect(() => setForm(initial), [initial]);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: (): Promise<{ id: string } | { ok: true }> => {
      const { photos, ...rest } = form;
      const body = { ...rest, imageKeys: photos.map((p) => p.key) };
      return isNew
        ? send<{ id: string }>('POST', '/admin/products', body)
        : send<{ ok: true }>('PUT', `/admin/products/${id}`, body);
    },
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ['products'] });
      if (isNew && 'id' in res) {
        toast('Product created — now add its sizes and prices');
        navigate({ to: '/products/$id', params: { id: res.id } });
      } else {
        await qc.invalidateQueries({ queryKey: ['product', id] });
        toast('Product saved');
      }
    },
  });

  if (!isNew && product.isLoading)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64" />
      </div>
    );

  const canSave = form.name.trim().length >= 2 && form.slug.length >= 2 && !!form.categoryId;
  const prices =
    product.data?.variants.filter((v) => v.isActive && v.pricePkr > 0).map((v) => v.pricePkr) ?? [];
  const priceLabel = prices.length ? `from ${formatPkr(Math.min(...prices))}` : 'Price not set';

  return (
    <>
      <Link
        to="/products"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-forest"
      >
        <IconChevronLeft width={16} height={16} /> All products
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-tight font-semibold text-forest md:text-[32px]">
              {isNew ? 'New product' : initial.name}
            </h1>
            {!isNew && (
              <Badge tone={STATUS_META[initial.status].tone} dot>
                {STATUS_META[initial.status].label}
              </Badge>
            )}
          </div>
          {isNew && (
            <p className="mt-1.5 text-sm text-muted">
              Fill in the basics and save — then add sizes and prices.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!isNew && STOREFRONT_URL && initial.status === 'active' && (
            <a
              href={`${STOREFRONT_URL}/p/${initial.slug}`}
              target="_blank"
              rel="noreferrer"
              className={buttonCls('secondary')}
            >
              <IconExternal width={16} height={16} /> View on site
            </a>
          )}
          <Button onClick={() => save.mutate()} disabled={!canSave || save.isPending || (!isNew && !dirty)}>
            {save.isPending ? 'Saving…' : isNew ? 'Create product' : 'Save'}
          </Button>
        </div>
      </div>
      <ErrorNote error={save.error} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card title="Basics">
            <div className="grid gap-4">
              <Field label="Product name">
                <Input
                  value={form.name}
                  placeholder="e.g. Ginger-Garlic Paste"
                  onChange={(e) => {
                    set('name', e.target.value);
                    if (isNew) set('slug', slugify(e.target.value));
                  }}
                />
              </Field>
              <Field
                label="Short description"
                hint={`Shown under the name on product cards · ${form.shortDescription.length}/160`}
              >
                <Input
                  value={form.shortDescription}
                  maxLength={160}
                  placeholder="e.g. Freshly ground · ready to cook"
                  onChange={(e) => set('shortDescription', e.target.value)}
                />
              </Field>
              <Field label="Description" hint="The main paragraph on the product page">
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <PhotosCard photos={form.photos} onChange={(p) => set('photos', p)} />

          {isNew ? (
            <Card title="Sizes & prices">
              <p className="text-sm text-muted">
                Create the product first — then you can add sizes like 250 g and 500 g here.
              </p>
            </Card>
          ) : (
            product.data && (
              <VariantsCard
                productId={id}
                variants={product.data.variants}
                skuHint={`${form.slug.slice(0, 3).toUpperCase() || 'SKU'}-250`}
              />
            )
          )}

          <Card
            title="Product page details"
            description="Optional sections customers see on the product page."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="How to use">
                <Textarea rows={3} value={form.howToUse} onChange={(e) => set('howToUse', e.target.value)} />
              </Field>
              <Field label="Ingredients">
                <Textarea
                  rows={3}
                  value={form.ingredients}
                  onChange={(e) => set('ingredients', e.target.value)}
                />
              </Field>
              <Field label="Storage & shelf life" className="md:col-span-2">
                <Input
                  value={form.storage}
                  placeholder="e.g. Keep refrigerated · use within 5 days"
                  onChange={(e) => set('storage', e.target.value)}
                />
              </Field>
            </div>
          </Card>
        </div>

        <ProductSidebar form={form} set={set} categories={cats.data ?? []} priceLabel={priceLabel} />
      </div>

      <SaveBar
        show={!isNew && dirty}
        saving={save.isPending}
        onSave={() => save.mutate()}
        onDiscard={() => setForm(initial)}
      />
    </>
  );
}

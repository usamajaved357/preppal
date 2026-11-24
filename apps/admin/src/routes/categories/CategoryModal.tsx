import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { IconImage, IconX } from '../../components/icons';
import { Modal, useFeedback } from '../../components/overlays';
import { Button, Field, Input, Step, Toggle } from '../../components/ui';
import { type AdminCategory, send } from '../../lib/api';
import { toWebp } from '../../lib/image';

interface Draft {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageKey: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const newCategoryDraft = (sortOrder: number): Draft => ({
  name: '',
  slug: '',
  description: '',
  imageKey: '',
  imageUrl: null,
  sortOrder,
  isActive: true,
});

/** Create or edit a category: name, storefront line, photo and visibility, with a live tile preview. */
export function CategoryModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Draft | AdminCategory;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const qc = useQueryClient();
  const { toast } = useFeedback();
  const [d, setD] = useState<Draft>({ ...initial });
  const [slugTouched, setSlugTouched] = useState(!!initial.id);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', new File([await toWebp(file, 800)], 'image.webp', { type: 'image/webp' }));
      return send<{ key: string; url: string }>('POST', '/admin/uploads', fd);
    },
    onSuccess: (r) => setD((x) => ({ ...x, imageKey: r.key, imageUrl: r.url })),
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: d.name,
        slug: d.slug,
        description: d.description,
        imageKey: d.imageKey,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
      };
      return d.id
        ? send('PUT', `/admin/categories/${d.id}`, body).then(() => ({ id: d.id as string }))
        : send<{ id: string }>('POST', '/admin/categories', body);
    },
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ['categories'] });
      toast(d.id ? `${d.name} saved` : `${d.name} added`);
      onSaved?.(r.id);
      onClose();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const valid = d.name.trim().length >= 2 && d.slug.length >= 2;

  return (
    <Modal
      title={d.id ? 'Edit category' : 'New category'}
      description="Categories group products on the storefront's “Shop by category” row and menu filters."
      width="max-w-3xl"
      onClose={onClose}
      footer={
        <>
          <span className="text-sm font-semibold text-ink">
            {d.name || 'Untitled'} · {d.isActive ? 'Shown on the storefront' : 'Hidden'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={!valid || save.isPending || upload.isPending}>
              {save.isPending ? 'Saving…' : d.id ? 'Save category' : 'Add category'}
            </Button>
          </div>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <Step n={1} title="Name it" />
            <Field label="Name">
              <Input
                autoFocus
                value={d.name}
                placeholder="e.g. Masala bases"
                onChange={(e) =>
                  setD({ ...d, name: e.target.value, slug: slugTouched ? d.slug : slugify(e.target.value) })
                }
              />
            </Field>
            <Field
              label="One-line description"
              hint={`Under the name on the storefront · ${d.description.length}/200`}
            >
              <Input
                value={d.description}
                maxLength={200}
                placeholder="e.g. Kabab & curry bases"
                onChange={(e) => setD({ ...d, description: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            <Step n={2} title="Add a photo" />
            <div className="flex items-center gap-3">
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-full border border-dashed border-line-strong px-4 text-sm font-semibold text-ink transition hover:border-ink/40 hover:bg-subtle">
                <IconImage width={17} height={17} />
                {upload.isPending ? 'Uploading…' : d.imageUrl ? 'Replace photo' : 'Choose photo'}
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
              {d.imageUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setD({ ...d, imageKey: '', imageUrl: null })}
                >
                  <IconX width={14} height={14} /> Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-faint">Square photos work best — they're shown in a circle.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Step n={3} title="Where it shows" />
            <div className="grid grid-cols-[1fr_110px] gap-3">
              <Field label="Web address" hint={`Used in links · ${d.slug || '…'}`}>
                <Input
                  value={d.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setD({ ...d, slug: slugify(e.target.value) });
                  }}
                />
              </Field>
              <Field label="Position" hint="Lower first">
                <Input
                  type="number"
                  value={d.sortOrder}
                  onChange={(e) => setD({ ...d, sortOrder: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-subtle px-4 py-3">
              <div>
                <div className="text-sm font-bold text-ink">Show on the storefront</div>
                <div className="text-xs text-muted">Hidden categories also hide their products.</div>
              </div>
              <Toggle
                label="Show on the storefront"
                checked={d.isActive}
                onChange={(isActive) => setD({ ...d, isActive })}
              />
            </div>
          </div>
        </div>

        <aside>
          <div className="mb-2 text-xs font-bold tracking-[0.1em] text-faint uppercase">Preview</div>
          <div className="hero-wash flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-line bg-cream px-4 py-6 text-center shadow-card">
            <span className="block h-[124px] w-[124px] overflow-hidden rounded-full bg-sand shadow-[0_10px_24px_rgba(22,58,44,.16)]">
              {d.imageUrl ? (
                <img src={d.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-faint">
                  <IconImage width={30} height={30} />
                </span>
              )}
            </span>
            <span>
              <span className="block text-[15px] font-semibold text-ink">{d.name || 'Category name'}</span>
              <span className="block text-[12.5px] text-muted">
                {d.description || 'One-line description'}
              </span>
            </span>
            {!d.isActive && (
              <span className="rounded-full bg-stone-soft px-2.5 py-0.5 text-xs font-semibold text-muted">
                Hidden
              </span>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-faint">As shown in “Shop by category”</p>
        </aside>
      </div>
    </Modal>
  );
}

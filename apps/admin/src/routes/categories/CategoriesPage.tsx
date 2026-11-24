import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  IconBox,
  IconCheck,
  IconChevronRight,
  IconEdit,
  IconImage,
  IconPlus,
  IconTag,
  IconTrash,
} from '../../components/icons';
import { Modal, RowMenu, useFeedback } from '../../components/overlays';
import {
  Button,
  ButtonIcon,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  IconButton,
  PageHeader,
  Select,
  Skeleton,
  StatStrip,
  Toggle,
} from '../../components/ui';
import { type AdminCategory, get, send } from '../../lib/api';
import { CategoryModal, newCategoryDraft } from './CategoryModal';

const body = (c: AdminCategory) => ({
  name: c.name,
  slug: c.slug,
  description: c.description,
  imageKey: c.imageKey,
  sortOrder: c.sortOrder,
  isActive: c.isActive,
});

export function CategoriesPage() {
  const qc = useQueryClient();
  const { toast, confirm } = useFeedback();
  const cats = useQuery({
    queryKey: ['categories'],
    queryFn: () => get<AdminCategory[]>('/admin/categories'),
  });
  const [editing, setEditing] = useState<AdminCategory | ReturnType<typeof newCategoryDraft> | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const list = cats.data ?? [];
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['categories'] }),
      qc.invalidateQueries({ queryKey: ['products'] }),
    ]);
  const onError = (e: Error) => toast(e.message, 'error');

  const update = useMutation({
    mutationFn: (c: AdminCategory) => send('PUT', `/admin/categories/${c.id}`, body(c)),
    onSuccess: refresh,
    onError,
  });
  const move = useMutation({
    mutationFn: async ({ a, b }: { a: AdminCategory; b: AdminCategory }) => {
      // Give the pair distinct positions, then swap them.
      const [pa, pb] =
        a.sortOrder === b.sortOrder ? [list.indexOf(a), list.indexOf(b)] : [a.sortOrder, b.sortOrder];
      await send('PUT', `/admin/categories/${a.id}`, { ...body(a), sortOrder: pb });
      await send('PUT', `/admin/categories/${b.id}`, { ...body(b), sortOrder: pa });
    },
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: (v: { c: AdminCategory; moveTo?: string }) =>
      send(
        'DELETE',
        `/admin/categories/${v.c.id}${v.moveTo ? `?moveTo=${encodeURIComponent(v.moveTo)}` : ''}`,
      ),
    onSuccess: async (_r, v) => {
      await refresh();
      setDeleting(null);
      toast(v.moveTo ? `${v.c.name} deleted · products moved` : `${v.c.name} deleted`);
    },
    onError,
  });

  const askDelete = async (c: AdminCategory) => {
    if (c.productCount > 0) return setDeleting(c);
    const ok = await confirm({
      title: `Delete ${c.name}?`,
      body: 'It has no products, so nothing else changes. This can’t be undone.',
      confirmLabel: 'Delete category',
      danger: true,
    });
    if (ok) remove.mutate({ c });
  };

  const shown = list.filter((c) => c.isActive).length;
  const empty = list.filter((c) => c.productCount === 0).length;

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Group products for the storefront. Reorder with the arrows. Hiding a category hides its products too."
        actions={
          <Button onClick={() => setEditing(newCategoryDraft((list.at(-1)?.sortOrder ?? 0) + 1))}>
            <ButtonIcon>
              <IconPlus width={14} height={14} />
            </ButtonIcon>
            New category
          </Button>
        }
      />
      <ErrorNote error={cats.error} />

      <StatStrip
        className="mb-5"
        stats={[
          { icon: <IconTag width={18} height={18} />, tone: 'plum', label: 'Categories', value: list.length },
          {
            icon: <IconCheck width={18} height={18} />,
            tone: 'green',
            label: 'On the storefront',
            value: shown,
          },
          {
            icon: <IconBox width={18} height={18} />,
            tone: 'gray',
            label: 'Hidden',
            value: list.length - shown,
          },
          {
            icon: <IconImage width={18} height={18} />,
            tone: 'amber',
            label: 'Without products',
            value: empty,
          },
        ]}
      />

      <Card
        icon={<IconTag width={18} height={18} />}
        tone="plum"
        title="All categories"
        description="The order here is the order on the storefront."
        bodyClassName="pt-4"
      >
        {cats.isLoading ? (
          <div className="flex flex-col gap-2 px-5 pb-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={<IconTag />} title="No categories yet">
            Add one to start grouping products.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {list.map((c, i) => (
              <li
                key={c.id}
                className={`flex items-center gap-3 px-5 py-3 transition hover:bg-subtle ${c.isActive ? '' : 'opacity-70'}`}
              >
                <div className="flex flex-col">
                  <IconButton
                    label="Move up"
                    disabled={i === 0 || move.isPending}
                    onClick={() => list[i - 1] && move.mutate({ a: c, b: list[i - 1] as AdminCategory })}
                    className="h-6 w-6"
                  >
                    <IconChevronRight width={14} height={14} className="-rotate-90" />
                  </IconButton>
                  <IconButton
                    label="Move down"
                    disabled={i === list.length - 1 || move.isPending}
                    onClick={() => list[i + 1] && move.mutate({ a: c, b: list[i + 1] as AdminCategory })}
                    className="h-6 w-6"
                  >
                    <IconChevronRight width={14} height={14} className="rotate-90" />
                  </IconButton>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
                >
                  <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-sand ring-1 ring-line">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-faint">
                        <IconImage width={18} height={18} />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink">{c.name}</span>
                    <span className="block truncate text-[13px] text-muted">
                      {c.description || 'No description'}
                    </span>
                  </span>
                </button>
                <span className="hidden w-28 text-sm text-muted sm:block">
                  <strong className="text-ink">{c.productCount}</strong> product
                  {c.productCount === 1 ? '' : 's'}
                </span>
                <Toggle
                  label={c.isActive ? `Hide ${c.name}` : `Show ${c.name}`}
                  checked={c.isActive}
                  disabled={update.isPending}
                  onChange={(isActive) => {
                    update.mutate({ ...c, isActive });
                    toast(isActive ? `${c.name} is on the storefront` : `${c.name} hidden`);
                  }}
                />
                <RowMenu
                  items={[
                    {
                      label: 'Edit',
                      icon: <IconEdit width={16} height={16} />,
                      onSelect: () => setEditing(c),
                    },
                    {
                      label: 'Delete',
                      icon: <IconTrash width={16} height={16} />,
                      danger: true,
                      onSelect: () => askDelete(c),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && <CategoryModal initial={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <MoveAndDelete
          category={deleting}
          others={list.filter((c) => c.id !== deleting.id)}
          pending={remove.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={(moveTo) => remove.mutate({ c: deleting, moveTo })}
        />
      )}
    </>
  );
}

function MoveAndDelete({
  category,
  others,
  pending,
  onClose,
  onConfirm,
}: {
  category: AdminCategory;
  others: AdminCategory[];
  pending: boolean;
  onClose: () => void;
  onConfirm: (moveTo: string) => void;
}) {
  const [target, setTarget] = useState(others[0]?.id ?? '');
  const n = category.productCount;
  return (
    <Modal
      title={`Delete ${category.name}?`}
      description={`It still has ${n} product${n === 1 ? '' : 's'}. Pick where they should go first.`}
      width="max-w-md"
      onClose={onClose}
      footer={
        <>
          <span />
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" disabled={!target || pending} onClick={() => onConfirm(target)}>
              Move & delete
            </Button>
          </div>
        </>
      }
    >
      {others.length === 0 ? (
        <p className="text-sm text-muted">Create another category first, then move these products into it.</p>
      ) : (
        <Field label={`Move ${n} product${n === 1 ? '' : 's'} to`}>
          <Select value={target} onChange={(e) => setTarget(e.target.value)}>
            {others.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isActive ? '' : ' (hidden)'}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </Modal>
  );
}

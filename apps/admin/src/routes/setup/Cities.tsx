import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { IconBuilding, IconEdit, IconPlus, IconTrash } from '../../components/icons';
import { Modal, RowMenu, useFeedback } from '../../components/overlays';
import { Badge, Button, Card, Field, IconChip, Input, Toggle } from '../../components/ui';
import { type AdminCity, send } from '../../lib/api';

type Draft = { id?: string; name: string; slug: string; isActive: boolean };
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Owner-only list of cities. A city must be active for customers to order there. */
export function CitiesCard({ cities, isOwner }: { cities: AdminCity[]; isOwner: boolean }) {
  const qc = useQueryClient();
  const { toast, confirm } = useFeedback();
  const [editing, setEditing] = useState<Draft | null>(null);
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['cities'] }),
      qc.invalidateQueries({ queryKey: ['public-settings'] }),
    ]);
  const onError = (e: Error) => toast(e.message, 'error');

  const save = useMutation({
    mutationFn: ({ id, ...b }: Draft) =>
      id ? send('PUT', `/admin/cities/${id}`, b) : send('POST', '/admin/cities', b),
    onSuccess: async (_r, v) => {
      await refresh();
      setEditing(null);
      toast(v.id ? `${v.name} saved` : `${v.name} added`);
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (c: AdminCity) => send('DELETE', `/admin/cities/${c.id}`),
    onSuccess: async (_r, c) => {
      await refresh();
      toast(`${c.name} deleted`);
    },
    onError,
  });

  return (
    <Card
      icon={<IconBuilding width={18} height={18} />}
      tone="sky"
      title="Cities"
      description="Customers can only order in active cities. New cities start with every product switched off in Inventory."
      bodyClassName="pt-4"
      actions={
        isOwner && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing({ name: '', slug: '', isActive: false })}
          >
            <IconPlus width={15} height={15} /> Add city
          </Button>
        )
      }
    >
      <ul className="divide-y divide-line border-t border-line">
        {cities.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-5 py-3">
            <IconChip tone={c.isActive ? 'sky' : 'gray'}>
              <IconBuilding width={17} height={17} />
            </IconChip>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-ink">{c.name}</div>
              <div className="text-xs text-muted">
                {c.areaCount} area{c.areaCount === 1 ? '' : 's'} · /{c.slug}
              </div>
            </div>
            <Badge tone={c.isActive ? 'green' : 'gray'} dot>
              {c.isActive ? 'Taking orders' : 'Off'}
            </Badge>
            {isOwner && (
              <>
                <Toggle
                  label={c.isActive ? `Turn off ${c.name}` : `Turn on ${c.name}`}
                  checked={c.isActive}
                  disabled={save.isPending}
                  onChange={(isActive) => save.mutate({ id: c.id, name: c.name, slug: c.slug, isActive })}
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
                      disabled: c.areaCount > 0,
                      hint: c.areaCount > 0 ? 'Delete its areas first' : undefined,
                      onSelect: async () => {
                        const ok = await confirm({
                          title: `Delete ${c.name}?`,
                          body: 'Its inventory settings are removed too. Cities that have had orders can only be turned off.',
                          confirmLabel: 'Delete city',
                          danger: true,
                        });
                        if (ok) remove.mutate(c);
                      },
                    },
                  ]}
                />
              </>
            )}
          </li>
        ))}
      </ul>

      {editing && (
        <Modal
          title={editing.id ? 'Edit city' : 'Add city'}
          description="Add the city, then its delivery areas, then switch products on for it in Inventory."
          onClose={() => setEditing(null)}
          width="max-w-md"
          footer={
            <>
              <span />
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={editing.name.trim().length < 2 || editing.slug.length < 2 || save.isPending}
                  onClick={() => save.mutate(editing)}
                >
                  {editing.id ? 'Save city' : 'Add city'}
                </Button>
              </div>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="City name">
              <Input
                autoFocus
                value={editing.name}
                placeholder="e.g. Okara"
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    name: e.target.value,
                    slug: editing.id ? editing.slug : slugify(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Web address" hint="Used in links and the API">
              <Input
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
              />
            </Field>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-subtle px-4 py-3">
              <div>
                <div className="text-sm font-bold text-ink">Taking orders</div>
                <div className="text-xs text-muted">Leave off until areas and stock are ready.</div>
              </div>
              <Toggle
                label="Taking orders"
                checked={editing.isActive}
                onChange={(isActive) => setEditing({ ...editing, isActive })}
              />
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}

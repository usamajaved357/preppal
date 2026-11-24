import { formatPkr } from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  IconBuilding,
  IconCash,
  IconCheck,
  IconEdit,
  IconPin,
  IconPlus,
  IconTrash,
} from '../../components/icons';
import { Modal, RowMenu, useFeedback } from '../../components/overlays';
import {
  Badge,
  Button,
  ButtonIcon,
  Card,
  EmptyState,
  Field,
  IconChip,
  Input,
  PageHeader,
  PrefixInput,
  Select,
  Skeleton,
  StatStrip,
  Toggle,
} from '../../components/ui';
import { type AdminCity, get, send } from '../../lib/api';
import { useMe } from '../../lib/me';
import { CitiesCard } from './Cities';

interface Area {
  id: string;
  cityId: string;
  name: string;
  deliveryFeePkr: number;
  isActive: boolean;
  sortOrder: number;
  orderCount: number;
}
type Draft = Omit<Area, 'id' | 'orderCount'> & { id?: string };
const feeLabel = (n: number) => (n > 0 ? formatPkr(n) : 'Free');

export function AreasPage() {
  const qc = useQueryClient();
  const { toast, confirm } = useFeedback();
  const me = useMe();
  const cities = useQuery({ queryKey: ['cities'], queryFn: () => get<AdminCity[]>('/admin/cities') });
  const areas = useQuery({ queryKey: ['areas'], queryFn: () => get<Area[]>('/admin/areas') });
  const [editing, setEditing] = useState<Draft | null>(null);
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['areas'] }),
      qc.invalidateQueries({ queryKey: ['cities'] }),
    ]);
  const onError = (e: Error) => toast(e.message, 'error');

  const save = useMutation({
    mutationFn: ({ id, ...b }: Draft) =>
      id ? send('PUT', `/admin/areas/${id}`, b) : send('POST', '/admin/areas', b),
    onSuccess: async (_r, v) => {
      await refresh();
      setEditing(null);
      toast(v.id ? `${v.name} saved` : `${v.name} added`);
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (a: Area) => send('DELETE', `/admin/areas/${a.id}`),
    onSuccess: async (_r, a) => {
      await refresh();
      toast(`${a.name} deleted`);
    },
    onError,
  });
  const toDraft = ({ orderCount: _o, ...a }: Area): Draft => a;

  const list = areas.data ?? [];
  const cityList = cities.data ?? [];
  const active = list.filter((a) => a.isActive);
  const fees = active.map((a) => a.deliveryFeePkr);
  const multiCity = cityList.length > 1;
  const cityName = (id: string) => cityList.find((c) => c.id === id)?.name ?? '';

  return (
    <>
      <PageHeader
        title="Delivery areas"
        subtitle="Customers pick their area at checkout and its fee is added to the total."
        actions={
          <Button
            onClick={() =>
              setEditing({
                cityId: cityList.find((c) => c.isActive)?.id ?? cityList[0]?.id ?? 'city_sahiwal',
                name: '',
                deliveryFeePkr: 0,
                isActive: true,
                sortOrder: list.length + 1,
              })
            }
          >
            <ButtonIcon>
              <IconPlus width={14} height={14} />
            </ButtonIcon>
            New area
          </Button>
        }
      />

      <StatStrip
        className="mb-5"
        stats={[
          {
            icon: <IconBuilding width={18} height={18} />,
            tone: 'sky',
            label: 'Cities',
            value: `${cityList.filter((c) => c.isActive).length}/${cityList.length}`,
            sub: 'Taking orders',
          },
          { icon: <IconPin width={18} height={18} />, tone: 'plum', label: 'Areas', value: list.length },
          {
            icon: <IconCheck width={18} height={18} />,
            tone: 'green',
            label: 'At checkout',
            value: active.length,
          },
          {
            icon: <IconCash width={18} height={18} />,
            tone: 'amber',
            label: 'Delivery fees',
            value: fees.length ? `${feeLabel(Math.min(...fees))} – ${feeLabel(Math.max(...fees))}` : '—',
          },
        ]}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card
          icon={<IconPin width={18} height={18} />}
          tone="plum"
          title="Areas"
          description="Areas that appear on orders can't be deleted — switch them off instead."
          bodyClassName="pt-4"
        >
          {areas.isLoading ? (
            <div className="flex flex-col gap-2 px-5 pb-5">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={<IconPin />} title="No delivery areas">
              Add the neighbourhoods you deliver to so customers can check out.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {list.map((a) => (
                <li
                  key={a.id}
                  className={`flex items-center gap-3 px-5 py-3 transition hover:bg-subtle ${a.isActive ? '' : 'opacity-70'}`}
                >
                  <IconChip tone={a.isActive ? 'plum' : 'gray'}>
                    <IconPin width={17} height={17} />
                  </IconChip>
                  <button
                    type="button"
                    onClick={() => setEditing(toDraft(a))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate font-bold text-ink">{a.name}</div>
                    <div className="text-xs text-muted">
                      {multiCity && `${cityName(a.cityId)} · `}
                      {a.orderCount} order{a.orderCount === 1 ? '' : 's'} ·{' '}
                      {a.isActive ? 'At checkout' : 'Hidden'}
                    </div>
                  </button>
                  <Badge tone={a.deliveryFeePkr > 0 ? 'gray' : 'green'}>
                    {a.deliveryFeePkr > 0 ? feeLabel(a.deliveryFeePkr) : 'Free delivery'}
                  </Badge>
                  <Toggle
                    label={`${a.name} at checkout`}
                    checked={a.isActive}
                    disabled={save.isPending}
                    onChange={(isActive) => save.mutate({ ...toDraft(a), isActive })}
                  />
                  <RowMenu
                    items={[
                      {
                        label: 'Edit',
                        icon: <IconEdit width={16} height={16} />,
                        onSelect: () => setEditing(toDraft(a)),
                      },
                      {
                        label: 'Delete',
                        icon: <IconTrash width={16} height={16} />,
                        danger: true,
                        disabled: a.orderCount > 0,
                        hint: a.orderCount > 0 ? 'Used on orders — switch it off instead' : undefined,
                        onSelect: async () => {
                          const ok = await confirm({
                            title: `Delete ${a.name}?`,
                            body: 'Customers will no longer be able to choose it. This can’t be undone.',
                            confirmLabel: 'Delete area',
                            danger: true,
                          });
                          if (ok) remove.mutate(a);
                        },
                      },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <CitiesCard cities={cityList} isOwner={me.data?.role === 'owner'} />
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'Edit area' : 'New delivery area'}
          description="Shown in the area list at checkout."
          onClose={() => setEditing(null)}
          width="max-w-md"
          footer={
            <>
              <span className="text-sm font-semibold text-ink">
                {editing.name || 'New area'} · {feeLabel(editing.deliveryFeePkr)}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={editing.name.trim().length < 2 || save.isPending}
                  onClick={() => save.mutate(editing)}
                >
                  {editing.id ? 'Save area' : 'Add area'}
                </Button>
              </div>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            {multiCity && (
              <Field label="City">
                <Select
                  value={editing.cityId}
                  onChange={(e) => setEditing({ ...editing, cityId: e.target.value })}
                >
                  {cityList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Area name">
              <Input
                autoFocus
                value={editing.name}
                placeholder="e.g. Farid Town"
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </Field>
            <Field label="Delivery fee" hint="Use 0 for free delivery">
              <PrefixInput
                prefix="Rs"
                type="number"
                min={0}
                value={editing.deliveryFeePkr}
                onChange={(e) => setEditing({ ...editing, deliveryFeePkr: Number(e.target.value) })}
              />
            </Field>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-subtle px-4 py-3">
              <div className="text-sm font-bold text-ink">Show at checkout</div>
              <Toggle
                label="Show at checkout"
                checked={editing.isActive}
                onChange={(isActive) => setEditing({ ...editing, isActive })}
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

import { formatPkr } from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { IconEdit, IconPin, IconPlus } from '../../components/icons';
import { Modal, useFeedback } from '../../components/overlays';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  PrefixInput,
  Select,
  Skeleton,
  Toggle,
} from '../../components/ui';
import { get, send } from '../../lib/api';

interface Area {
  id: string;
  cityId: string;
  name: string;
  deliveryFeePkr: number;
  isActive: boolean;
  sortOrder: number;
}
type Draft = Omit<Area, 'id'> & { id?: string };
const feeLabel = (n: number) => (n > 0 ? formatPkr(n) : 'Free');

export function AreasPage() {
  const qc = useQueryClient();
  const { toast } = useFeedback();
  const cities = useQuery({
    queryKey: ['cities'],
    queryFn: () => get<{ id: string; name: string }[]>('/admin/cities'),
  });
  const areas = useQuery({ queryKey: ['areas'], queryFn: () => get<Area[]>('/admin/areas') });
  const [editing, setEditing] = useState<Draft | null>(null);

  const save = useMutation({
    mutationFn: ({ id, ...body }: Draft) =>
      id ? send('PUT', `/admin/areas/${id}`, body) : send('POST', '/admin/areas', body),
    onSuccess: async (_r, v) => {
      await qc.invalidateQueries({ queryKey: ['areas'] });
      setEditing(null);
      toast(v.id ? `${v.name} updated` : `${v.name} added`);
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const list = areas.data ?? [];
  const active = list.filter((a) => a.isActive);
  const fees = active.map((a) => a.deliveryFeePkr);
  const cityName = (id: string) => cities.data?.find((c) => c.id === id)?.name ?? '';
  const multiCity = (cities.data?.length ?? 0) > 1;

  return (
    <>
      <PageHeader
        kicker="Setup"
        title="Delivery areas"
        subtitle="Customers pick their area at checkout. Its delivery fee is added to the order total."
        actions={
          <Button
            onClick={() =>
              setEditing({
                cityId: cities.data?.[0]?.id ?? 'city_sahiwal',
                name: '',
                deliveryFeePkr: 0,
                isActive: true,
                sortOrder: list.length + 1,
              })
            }
          >
            <IconPlus width={17} height={17} /> Add area
          </Button>
        }
      />

      <Card
        className="max-w-3xl"
        title={`${list.length} area${list.length === 1 ? '' : 's'}`}
        description={
          active.length
            ? `${active.length} shown at checkout · fees ${feeLabel(Math.min(...fees))} – ${feeLabel(Math.max(...fees))}`
            : 'No areas are shown at checkout yet'
        }
        bodyClassName="p-0"
      >
        {areas.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={<IconPin />} title="No delivery areas">
            Add the neighbourhoods you deliver to so customers can check out.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((a) => (
              <li
                key={a.id}
                className={`flex items-center gap-4 px-5 py-3.5 ${a.isActive ? '' : 'bg-canvas/50'}`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${a.isActive ? 'bg-sage-soft text-forest' : 'bg-stone-soft text-muted'}`}
                >
                  <IconPin />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`truncate font-semibold ${a.isActive ? 'text-ink' : 'text-muted'}`}>
                    {a.name}
                  </div>
                  <div className="text-xs text-muted">
                    {multiCity && `${cityName(a.cityId)} · `}
                    {a.isActive ? 'Shown at checkout' : 'Hidden at checkout'}
                  </div>
                </div>
                {a.deliveryFeePkr > 0 ? (
                  <Badge tone="gray">{feeLabel(a.deliveryFeePkr)}</Badge>
                ) : (
                  <Badge tone="green">Free delivery</Badge>
                )}
                <Toggle
                  label={`${a.name} active`}
                  checked={a.isActive}
                  disabled={save.isPending}
                  onChange={(isActive) => save.mutate({ ...a, isActive })}
                />
                <IconButton label={`Edit ${a.name}`} onClick={() => setEditing(a)}>
                  <IconEdit />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <Modal title={editing.id ? 'Edit area' : 'Add delivery area'} onClose={() => setEditing(null)}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(editing);
            }}
          >
            {multiCity && (
              <Field label="City">
                <Select
                  value={editing.cityId}
                  onChange={(e) => setEditing({ ...editing, cityId: e.target.value })}
                >
                  {cities.data?.map((c) => (
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
            <label className="flex items-center justify-between rounded-xl bg-canvas px-3.5 py-3">
              <span className="text-sm font-semibold text-ink">Show at checkout</span>
              <Toggle
                label="Show at checkout"
                checked={editing.isActive}
                onChange={(isActive) => setEditing({ ...editing, isActive })}
              />
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editing.name.trim().length < 2 || save.isPending}>
                {editing.id ? 'Save area' : 'Add area'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

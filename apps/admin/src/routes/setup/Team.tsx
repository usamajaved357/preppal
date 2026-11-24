import type { ROLES } from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { IconEdit, IconPhone, IconPlus, IconTrash, IconTruck, IconUsers } from '../../components/icons';
import { Modal, RowMenu, useFeedback } from '../../components/overlays';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  OptionCard,
  PageHeader,
  StatStrip,
  Toggle,
  type Tone,
} from '../../components/ui';
import { type AdminRider, get, send } from '../../lib/api';
import { useMe } from '../../lib/me';
import { formatPhone } from '../../lib/site';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: (typeof ROLES)[number];
  isActive: boolean;
}
type AdminDraft = Omit<Admin, 'id'> & { id?: string };
type RiderDraft = { id?: string; name: string; phone: string; isActive: boolean };

const ROLE_META: Record<Admin['role'], { tone: Tone; hint: string }> = {
  owner: { tone: 'green', hint: 'Everything, including settings and the team' },
  staff: { tone: 'sky', hint: 'Orders, products, categories and inventory' },
  rider: { tone: 'gray', hint: 'Reserved for the rider app (coming later)' },
};

export function TeamPage() {
  const qc = useQueryClient();
  const { toast, confirm } = useFeedback();
  const me = useMe();
  const isOwner = me.data?.role === 'owner';
  const admins = useQuery({
    queryKey: ['admins'],
    queryFn: () => get<Admin[]>('/admin/admins'),
    retry: false,
    enabled: isOwner,
  });
  const riders = useQuery({ queryKey: ['riders'], queryFn: () => get<AdminRider[]>('/admin/riders') });
  const [adminDraft, setAdminDraft] = useState<AdminDraft | null>(null);
  const [riderDraft, setRiderDraft] = useState<RiderDraft | null>(null);
  const onError = (e: Error) => toast(e.message, 'error');

  const saveAdmin = useMutation({
    mutationFn: ({ id, ...b }: AdminDraft) =>
      id ? send('PUT', `/admin/admins/${id}`, b) : send('POST', '/admin/admins', b),
    onSuccess: async (_r, v) => {
      await qc.invalidateQueries({ queryKey: ['admins'] });
      setAdminDraft(null);
      toast(v.id ? `${v.name} saved` : `${v.name} added — also add them to the Cloudflare Access policy`);
    },
    onError,
  });
  const removeAdmin = useMutation({
    mutationFn: (a: Admin) => send('DELETE', `/admin/admins/${a.id}`),
    onSuccess: async (_r, a) => {
      await qc.invalidateQueries({ queryKey: ['admins'] });
      toast(`${a.name} removed`);
    },
    onError,
  });
  const saveRider = useMutation({
    mutationFn: ({ id, ...b }: RiderDraft) =>
      id ? send('PUT', `/admin/riders/${id}`, b) : send('POST', '/admin/riders', b),
    onSuccess: async (_r, v) => {
      await qc.invalidateQueries({ queryKey: ['riders'] });
      setRiderDraft(null);
      toast(v.id ? `${v.name} saved` : `${v.name} added`);
    },
    onError,
  });
  const removeRider = useMutation({
    mutationFn: (r: AdminRider) => send('DELETE', `/admin/riders/${r.id}`),
    onSuccess: async (_r, r) => {
      await qc.invalidateQueries({ queryKey: ['riders'] });
      toast(`${r.name} removed`);
    },
    onError,
  });

  const riderList = riders.data ?? [];
  const adminList = admins.data ?? [];
  const toRiderDraft = (r: AdminRider): RiderDraft => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    isActive: r.isActive,
  });

  return (
    <>
      <PageHeader
        title="Team & riders"
        subtitle="Who can sign in to this admin, and who delivers your orders."
      />
      <StatStrip
        className="mb-5"
        stats={[
          {
            icon: <IconUsers width={18} height={18} />,
            tone: 'sky',
            label: 'Admins',
            value: isOwner ? adminList.length : '—',
            sub: 'Can sign in',
          },
          {
            icon: <IconTruck width={18} height={18} />,
            tone: 'clay',
            label: 'Riders',
            value: riderList.length,
          },
          {
            icon: <IconTruck width={18} height={18} />,
            tone: 'green',
            label: 'On duty',
            value: riderList.filter((r) => r.isActive).length,
            sub: 'Shown when assigning orders',
          },
        ]}
      />

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Card
          icon={<IconUsers width={18} height={18} />}
          tone="sky"
          title="Admin team"
          description="They sign in with Cloudflare Access using these emails."
          bodyClassName="pt-4"
          actions={
            isOwner && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAdminDraft({ email: '', name: '', role: 'staff', isActive: true })}
              >
                <IconPlus width={15} height={15} /> Add admin
              </Button>
            )
          }
        >
          {!isOwner ? (
            <EmptyState icon={<IconUsers />} title="Owner only">
              Only the owner can see and manage the admin team.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {adminList.map((a) => {
                const self = a.email === me.data?.email;
                return (
                  <Row key={a.id} name={a.name} muted={!a.isActive}>
                    <button
                      type="button"
                      onClick={() => setAdminDraft(a)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2 truncate font-bold text-ink">
                        {a.name}
                        {self && <span className="text-xs font-medium text-faint">you</span>}
                      </div>
                      <div className="truncate text-xs text-muted">{a.email}</div>
                    </button>
                    <Badge tone={ROLE_META[a.role].tone}>{a.role}</Badge>
                    <Toggle
                      label={self ? "You can't switch yourself off" : `${a.name} can sign in`}
                      checked={a.isActive}
                      disabled={self || saveAdmin.isPending}
                      onChange={(isActive) => saveAdmin.mutate({ ...a, isActive })}
                    />
                    <RowMenu
                      items={[
                        {
                          label: 'Edit',
                          icon: <IconEdit width={16} height={16} />,
                          onSelect: () => setAdminDraft(a),
                        },
                        {
                          label: 'Remove',
                          icon: <IconTrash width={16} height={16} />,
                          danger: true,
                          disabled: self,
                          hint: self ? "You can't remove yourself" : undefined,
                          onSelect: async () => {
                            const ok = await confirm({
                              title: `Remove ${a.name}?`,
                              body: 'They will lose access to the admin straight away. Also remove them from the Cloudflare Access policy.',
                              confirmLabel: 'Remove admin',
                              danger: true,
                            });
                            if (ok) removeAdmin.mutate(a);
                          },
                        },
                      ]}
                    />
                  </Row>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          icon={<IconTruck width={18} height={18} />}
          tone="clay"
          title="Riders"
          description="Assign riders from an order's details. Riders on past orders can be switched off, not removed."
          bodyClassName="pt-4"
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setRiderDraft({ name: '', phone: '', isActive: true })}
            >
              <IconPlus width={15} height={15} /> Add rider
            </Button>
          }
        >
          {riderList.length === 0 ? (
            <EmptyState icon={<IconTruck />} title="No riders yet">
              Add the people who deliver your orders.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {riderList.map((r) => (
                <Row key={r.id} name={r.name} muted={!r.isActive}>
                  <button
                    type="button"
                    onClick={() => setRiderDraft(toRiderDraft(r))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate font-bold text-ink">{r.name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <IconPhone width={12} height={12} /> {formatPhone(r.phone)} · {r.orderCount ?? 0} order
                      {r.orderCount === 1 ? '' : 's'}
                    </div>
                  </button>
                  {!r.isActive && <Badge tone="gray">Off duty</Badge>}
                  <Toggle
                    label={`${r.name} on duty`}
                    checked={r.isActive}
                    disabled={saveRider.isPending}
                    onChange={(isActive) => saveRider.mutate({ ...toRiderDraft(r), isActive })}
                  />
                  <RowMenu
                    items={[
                      {
                        label: 'Edit',
                        icon: <IconEdit width={16} height={16} />,
                        onSelect: () => setRiderDraft(toRiderDraft(r)),
                      },
                      {
                        label: 'Call',
                        icon: <IconPhone width={16} height={16} />,
                        onSelect: () => window.open(`tel:${r.phone}`),
                      },
                      {
                        label: 'Remove',
                        icon: <IconTrash width={16} height={16} />,
                        danger: true,
                        disabled: (r.orderCount ?? 0) > 0,
                        hint: (r.orderCount ?? 0) > 0 ? 'On past orders — switch off instead' : undefined,
                        onSelect: async () => {
                          const ok = await confirm({
                            title: `Remove ${r.name}?`,
                            body: 'They have no orders yet, so nothing else changes.',
                            confirmLabel: 'Remove rider',
                            danger: true,
                          });
                          if (ok) removeRider.mutate(r);
                        },
                      },
                    ]}
                  />
                </Row>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {adminDraft && (
        <Modal
          title={adminDraft.id ? 'Edit admin' : 'Add admin'}
          description="Use the exact email they sign in with."
          onClose={() => setAdminDraft(null)}
          footer={
            <FormFooter
              summary={`${adminDraft.name || 'New admin'} · ${adminDraft.role}`}
              onCancel={() => setAdminDraft(null)}
              onSubmit={() => saveAdmin.mutate(adminDraft)}
              disabled={
                !adminDraft.email.includes('@') || adminDraft.name.trim().length < 2 || saveAdmin.isPending
              }
              label={adminDraft.id ? 'Save' : 'Add admin'}
            />
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <Input
                autoFocus
                value={adminDraft.name}
                onChange={(e) => setAdminDraft({ ...adminDraft, name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={adminDraft.email}
                onChange={(e) => setAdminDraft({ ...adminDraft, email: e.target.value })}
              />
            </Field>
            <Field label="Role" group>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['owner', 'staff'] as const).map((role) => (
                  <OptionCard
                    key={role}
                    selected={adminDraft.role === role}
                    title={<span className="capitalize">{role}</span>}
                    body={ROLE_META[role].hint}
                    onSelect={() =>
                      adminDraft.email !== me.data?.email && setAdminDraft({ ...adminDraft, role })
                    }
                  />
                ))}
              </div>
            </Field>
          </div>
        </Modal>
      )}

      {riderDraft && (
        <Modal
          title={riderDraft.id ? 'Edit rider' : 'Add rider'}
          onClose={() => setRiderDraft(null)}
          width="max-w-md"
          footer={
            <FormFooter
              summary={riderDraft.name || 'New rider'}
              onCancel={() => setRiderDraft(null)}
              onSubmit={() => saveRider.mutate(riderDraft)}
              disabled={
                riderDraft.name.trim().length < 2 || riderDraft.phone.length < 10 || saveRider.isPending
              }
              label={riderDraft.id ? 'Save' : 'Add rider'}
            />
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <Input
                autoFocus
                value={riderDraft.name}
                onChange={(e) => setRiderDraft({ ...riderDraft, name: e.target.value })}
              />
            </Field>
            <Field label="Mobile number">
              <Input
                inputMode="tel"
                placeholder="0300 1234567"
                value={riderDraft.phone}
                onChange={(e) => setRiderDraft({ ...riderDraft, phone: e.target.value })}
              />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}

function Row({ name, muted, children }: { name: string; muted: boolean; children: ReactNode }) {
  return (
    <li
      className={`flex items-center gap-3 px-5 py-3 transition hover:bg-subtle ${muted ? 'opacity-65' : ''}`}
    >
      <Avatar name={name} />
      {children}
    </li>
  );
}

function FormFooter({
  summary,
  onCancel,
  onSubmit,
  disabled,
  label,
}: {
  summary: string;
  onCancel: () => void;
  onSubmit: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <>
      <span className="text-sm font-semibold text-ink capitalize">{summary}</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={disabled}>
          {label}
        </Button>
      </div>
    </>
  );
}

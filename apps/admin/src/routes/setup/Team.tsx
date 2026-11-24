import { ROLES } from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { IconEdit, IconPhone, IconPlus, IconTruck, IconUsers } from '../../components/icons';
import { Modal, useFeedback } from '../../components/overlays';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  Select,
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
type RiderDraft = Omit<AdminRider, 'id'> & { id?: string };

const ROLE_META: Record<Admin['role'], { tone: Tone; hint: string }> = {
  owner: { tone: 'green', hint: 'Everything, incl. settings and team' },
  staff: { tone: 'sky', hint: 'Orders, products and inventory' },
  rider: { tone: 'gray', hint: 'Reserved for the rider app (coming later)' },
};

export function TeamPage() {
  const qc = useQueryClient();
  const { toast } = useFeedback();
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

  const saveAdmin = useMutation({
    mutationFn: ({ id, ...b }: AdminDraft) =>
      id ? send('PUT', `/admin/admins/${id}`, b) : send('POST', '/admin/admins', b),
    onSuccess: async (_r, v) => {
      await qc.invalidateQueries({ queryKey: ['admins'] });
      setAdminDraft(null);
      toast(v.id ? `${v.name} updated` : `${v.name} added — also add them to the Cloudflare Access policy`);
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });
  const saveRider = useMutation({
    mutationFn: ({ id, ...b }: RiderDraft) =>
      id ? send('PUT', `/admin/riders/${id}`, b) : send('POST', '/admin/riders', b),
    onSuccess: async (_r, v) => {
      await qc.invalidateQueries({ queryKey: ['riders'] });
      setRiderDraft(null);
      toast(v.id ? `${v.name} updated` : `${v.name} added`);
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  return (
    <>
      <PageHeader
        kicker="Setup"
        title="Team & riders"
        subtitle="Who can sign in to this admin, and who delivers your orders."
      />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Card
          title="Admin team"
          description="Sign in with Cloudflare Access using these emails."
          bodyClassName="p-0"
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
            <ul className="divide-y divide-line">
              {admins.data?.map((a) => {
                const self = a.email === me.data?.email;
                return (
                  <Row key={a.id} name={a.name} muted={!a.isActive}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 truncate font-semibold text-ink">
                        {a.name}
                        {self && <span className="text-xs font-normal text-muted">(you)</span>}
                      </div>
                      <div className="truncate text-xs text-muted">{a.email}</div>
                    </div>
                    <Badge tone={ROLE_META[a.role].tone}>{a.role}</Badge>
                    <Toggle
                      label={self ? "You can't disable yourself" : `${a.name} can sign in`}
                      checked={a.isActive}
                      disabled={self || saveAdmin.isPending}
                      onChange={(isActive) => saveAdmin.mutate({ ...a, isActive })}
                    />
                    <IconButton label={`Edit ${a.name}`} onClick={() => setAdminDraft(a)}>
                      <IconEdit />
                    </IconButton>
                  </Row>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          title="Riders"
          description="Assign riders to orders from the order details."
          bodyClassName="p-0"
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
          {riders.data?.length === 0 ? (
            <EmptyState icon={<IconTruck />} title="No riders yet">
              Add the people who deliver your orders.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {riders.data?.map((r) => (
                <Row key={r.id} name={r.name} muted={!r.isActive}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{r.name}</div>
                    <a
                      href={`tel:${r.phone}`}
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-forest"
                    >
                      <IconPhone width={12} height={12} /> {formatPhone(r.phone)}
                    </a>
                  </div>
                  {!r.isActive && <Badge tone="gray">Off duty</Badge>}
                  <Toggle
                    label={`${r.name} available`}
                    checked={r.isActive}
                    disabled={saveRider.isPending}
                    onChange={(isActive) => saveRider.mutate({ ...r, isActive })}
                  />
                  <IconButton label={`Edit ${r.name}`} onClick={() => setRiderDraft(r)}>
                    <IconEdit />
                  </IconButton>
                </Row>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {adminDraft && (
        <Modal title={adminDraft.id ? 'Edit admin' : 'Add admin'} onClose={() => setAdminDraft(null)}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveAdmin.mutate(adminDraft);
            }}
          >
            <Field label="Name">
              <Input
                autoFocus
                value={adminDraft.name}
                onChange={(e) => setAdminDraft({ ...adminDraft, name: e.target.value })}
              />
            </Field>
            <Field label="Email" hint="Must match the email they sign in with">
              <Input
                type="email"
                value={adminDraft.email}
                onChange={(e) => setAdminDraft({ ...adminDraft, email: e.target.value })}
              />
            </Field>
            <Field label="Role" hint={ROLE_META[adminDraft.role].hint}>
              <Select
                value={adminDraft.role}
                disabled={adminDraft.email === me.data?.email}
                onChange={(e) => setAdminDraft({ ...adminDraft, role: e.target.value as Admin['role'] })}
              >
                {ROLES.map((x) => (
                  <option key={x} value={x} className="capitalize">
                    {x}
                  </option>
                ))}
              </Select>
            </Field>
            <FormActions
              onCancel={() => setAdminDraft(null)}
              disabled={
                !adminDraft.email.includes('@') || adminDraft.name.trim().length < 2 || saveAdmin.isPending
              }
            >
              {adminDraft.id ? 'Save' : 'Add admin'}
            </FormActions>
          </form>
        </Modal>
      )}

      {riderDraft && (
        <Modal title={riderDraft.id ? 'Edit rider' : 'Add rider'} onClose={() => setRiderDraft(null)}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveRider.mutate(riderDraft);
            }}
          >
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
            <FormActions
              onCancel={() => setRiderDraft(null)}
              disabled={
                riderDraft.name.trim().length < 2 || riderDraft.phone.length < 10 || saveRider.isPending
              }
            >
              {riderDraft.id ? 'Save' : 'Add rider'}
            </FormActions>
          </form>
        </Modal>
      )}
    </>
  );
}

function Row({ name, muted, children }: { name: string; muted: boolean; children: ReactNode }) {
  return (
    <li className={`flex items-center gap-3 px-5 py-3.5 ${muted ? 'bg-canvas/50 opacity-75' : ''}`}>
      <Avatar name={name} />
      {children}
    </li>
  );
}

function FormActions({
  onCancel,
  disabled,
  children,
}: {
  onCancel: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mt-2 flex justify-end gap-2">
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={disabled}>
        {children}
      </Button>
    </div>
  );
}

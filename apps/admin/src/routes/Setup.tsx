import { formatPkr, ROLES, type Settings } from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button, Card, ErrorNote, Field, Input, PageHeader, Select } from '../components/ui';
import { get, send } from '../lib/api';

// ───────────── Delivery areas ─────────────
interface Area {
  id: string;
  cityId: string;
  name: string;
  deliveryFeePkr: number;
  isActive: boolean;
  sortOrder: number;
}

export function AreasPage() {
  const qc = useQueryClient();
  const cities = useQuery({
    queryKey: ['cities'],
    queryFn: () => get<{ id: string; name: string }[]>('/admin/cities'),
  });
  const areas = useQuery({ queryKey: ['areas'], queryFn: () => get<Area[]>('/admin/areas') });
  const [draft, setDraft] = useState({ cityId: 'city_sahiwal', name: '', deliveryFeePkr: 0 });
  const add = useMutation({
    mutationFn: () => send('POST', '/admin/areas', { ...draft, isActive: true, sortOrder: 0 }),
    onSuccess: () => {
      setDraft({ ...draft, name: '', deliveryFeePkr: 0 });
      qc.invalidateQueries({ queryKey: ['areas'] });
    },
  });
  const update = useMutation({
    mutationFn: (a: Area) =>
      send('PUT', `/admin/areas/${a.id}`, {
        cityId: a.cityId,
        name: a.name,
        deliveryFeePkr: a.deliveryFeePkr,
        isActive: a.isActive,
        sortOrder: a.sortOrder,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['areas'] }),
  });
  return (
    <>
      <PageHeader
        title="Delivery areas"
        subtitle="Customers pick one of these at checkout. The fee is added to their total."
      />
      <ErrorNote error={add.error ?? update.error} />
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="City">
            <Select value={draft.cityId} onChange={(e) => setDraft({ ...draft, cityId: e.target.value })}>
              {cities.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Area name">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Farid Town"
            />
          </Field>
          <Field label="Delivery fee (Rs)">
            <Input
              type="number"
              min={0}
              value={draft.deliveryFeePkr}
              onChange={(e) => setDraft({ ...draft, deliveryFeePkr: Number(e.target.value) })}
            />
          </Field>
          <Button onClick={() => add.mutate()} disabled={draft.name.length < 2}>
            Add area
          </Button>
        </div>
        <ul className="divide-y divide-line">
          {areas.data?.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <strong>{a.name}</strong>{' '}
                <span className="text-muted">
                  · {a.deliveryFeePkr ? formatPkr(a.deliveryFeePkr) : 'Free'}
                </span>
              </span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={a.isActive}
                  onChange={(e) => update.mutate({ ...a, isActive: e.target.checked })}
                />{' '}
                Active
              </label>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

// ───────────── Settings ─────────────
export function SettingsPage() {
  const qc = useQueryClient();
  const s = useQuery({ queryKey: ['settings'], queryFn: () => get<Settings>('/admin/settings') });
  const [form, setForm] = useState<Settings | null>(null);
  const [emails, setEmails] = useState('');
  useEffect(() => {
    if (s.data) {
      setForm(s.data);
      setEmails(s.data.alertEmails.join(', '));
    }
  }, [s.data]);
  const save = useMutation({
    mutationFn: () =>
      send('PUT', '/admin/settings', {
        ...form,
        alertEmails: emails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
  if (!form) return <p className="text-muted">Loading…</p>;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm({ ...form, [k]: v });
  return (
    <>
      <PageHeader
        title="Settings"
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isSuccess ? 'Saved ✓' : 'Save settings'}
          </Button>
        }
      />
      <ErrorNote error={save.error} />
      <div className="grid max-w-3xl gap-5">
        <Card title="Ordering window">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Cutoff hour (0–23)" hint="Orders after this roll to the day after tomorrow">
              <Input
                type="number"
                min={0}
                max={23}
                value={form.cutoffHour}
                onChange={(e) => set('cutoffHour', Number(e.target.value))}
              />
            </Field>
            <Field label="Delivered by" hint="Shown to customers">
              <Input value={form.deliveryByLabel} onChange={(e) => set('deliveryByLabel', e.target.value)} />
            </Field>
            <Field label="Days customers can choose">
              <Input
                type="number"
                min={1}
                max={7}
                value={form.maxDaysAhead}
                onChange={(e) => set('maxDaysAhead', Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Minimum order (Rs, 0 = none)">
            <Input
              type="number"
              min={0}
              value={form.minOrderPkr}
              onChange={(e) => set('minOrderPkr', Number(e.target.value))}
            />
          </Field>
        </Card>
        <Card title="Contact & alerts">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="WhatsApp number" hint="Format 92XXXXXXXXXX">
              <Input value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
            </Field>
            <Field label="Instagram handle">
              <Input value={form.instagramHandle} onChange={(e) => set('instagramHandle', e.target.value)} />
            </Field>
          </div>
          <Field
            label="New-order alert emails"
            hint="Comma separated. Needs RESEND_API_KEY and a verified domain."
          >
            <Input value={emails} onChange={(e) => setEmails(e.target.value)} />
          </Field>
        </Card>
      </div>
    </>
  );
}

// ───────────── Team & riders ─────────────
interface Admin {
  id: string;
  email: string;
  name: string;
  role: (typeof ROLES)[number];
  isActive: boolean;
}
interface Rider {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
}

export function TeamPage() {
  const qc = useQueryClient();
  const admins = useQuery({
    queryKey: ['admins'],
    queryFn: () => get<Admin[]>('/admin/admins'),
    retry: false,
  });
  const riders = useQuery({ queryKey: ['riders'], queryFn: () => get<Rider[]>('/admin/riders') });
  const [a, setA] = useState({ email: '', name: '', role: 'staff' as Admin['role'] });
  const [r, setR] = useState({ name: '', phone: '' });
  const addAdmin = useMutation({
    mutationFn: () => send('POST', '/admin/admins', { ...a, isActive: true }),
    onSuccess: () => {
      setA({ email: '', name: '', role: 'staff' });
      qc.invalidateQueries({ queryKey: ['admins'] });
    },
  });
  const addRider = useMutation({
    mutationFn: () => send('POST', '/admin/riders', { ...r, isActive: true }),
    onSuccess: () => {
      setR({ name: '', phone: '' });
      qc.invalidateQueries({ queryKey: ['riders'] });
    },
  });
  return (
    <>
      <PageHeader
        title="Team & riders"
        subtitle="Admins sign in with Cloudflare Access using this email. Also add the email to the Access policy."
      />
      <div className="grid max-w-4xl gap-5">
        <Card title="Admins">
          {admins.error ? (
            <p className="text-sm text-muted">Only the owner can manage admins.</p>
          ) : (
            <>
              <ErrorNote error={addAdmin.error} />
              <ul className="divide-y divide-line">
                {admins.data?.map((x) => (
                  <li key={x.id} className="flex justify-between py-2.5">
                    <span>
                      <strong>{x.name}</strong> · {x.email}
                    </span>
                    <span className="text-sm text-muted">
                      {x.role}
                      {x.isActive ? '' : ' (disabled)'}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Email">
                  <Input
                    type="email"
                    value={a.email}
                    onChange={(e) => setA({ ...a, email: e.target.value })}
                  />
                </Field>
                <Field label="Name">
                  <Input value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} />
                </Field>
                <Field label="Role">
                  <Select
                    value={a.role}
                    onChange={(e) => setA({ ...a, role: e.target.value as Admin['role'] })}
                  >
                    {ROLES.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </Select>
                </Field>
                <Button onClick={() => addAdmin.mutate()} disabled={!a.email || a.name.length < 2}>
                  Add admin
                </Button>
              </div>
            </>
          )}
        </Card>
        <Card title="Riders">
          <ErrorNote error={addRider.error} />
          <ul className="divide-y divide-line">
            {riders.data?.map((x) => (
              <li key={x.id} className="flex justify-between py-2.5">
                <strong>{x.name}</strong>
                <span className="text-muted">{x.phone}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Name">
              <Input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input
                value={r.phone}
                onChange={(e) => setR({ ...r, phone: e.target.value })}
                placeholder="03xx xxxxxxx"
              />
            </Field>
            <Button onClick={() => addRider.mutate()} disabled={r.name.length < 2}>
              Add rider
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

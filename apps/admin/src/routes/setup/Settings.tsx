import type { Settings } from '@preppal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { IconClock, IconX } from '../../components/icons';
import { SaveBar, useFeedback } from '../../components/overlays';
import {
  ErrorNote,
  Field,
  Input,
  inputCls,
  PageHeader,
  PrefixInput,
  Segmented,
  Select,
  Skeleton,
} from '../../components/ui';
import { get, send } from '../../lib/api';
import { useMe } from '../../lib/me';
import { formatHour } from '../../lib/site';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function SettingsPage() {
  const qc = useQueryClient();
  const { toast } = useFeedback();
  const me = useMe();
  const readOnly = me.data?.role !== 'owner';
  const s = useQuery({ queryKey: ['settings'], queryFn: () => get<Settings>('/admin/settings') });
  const [form, setForm] = useState<Settings | null>(null);
  const [emailInput, setEmailInput] = useState('');
  useEffect(() => {
    if (s.data) setForm(s.data);
  }, [s.data]);

  const save = useMutation({
    mutationFn: (body: Settings) => send('PUT', '/admin/settings', body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings'] });
      await qc.invalidateQueries({ queryKey: ['public-settings'] });
      toast('Settings saved');
    },
  });

  if (!form || !s.data)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-60" />
      </div>
    );

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm({ ...form, [k]: v });
  const dirty = JSON.stringify(form) !== JSON.stringify(s.data);
  const addEmail = () => {
    const e = emailInput.trim().replace(/,$/, '');
    if (e && !form.alertEmails.includes(e)) set('alertEmails', [...form.alertEmails, e]);
    setEmailInput('');
  };

  return (
    <>
      <PageHeader
        kicker="Setup"
        title="Settings"
        subtitle="How ordering works on the storefront, and where new-order alerts go."
      />
      {readOnly && (
        <p className="mb-5 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted">
          You can view these settings. Only the owner can change them.
        </p>
      )}
      <ErrorNote error={save.error} />

      <fieldset disabled={readOnly} className="flex max-w-5xl flex-col gap-5">
        <Section
          title="Ordering window"
          body="When the order cutoff is, and how far ahead customers can book."
        >
          <div className="flex items-start gap-3 rounded-xl bg-forest px-4 py-3.5 text-sm text-white">
            <IconClock className="mt-0.5 shrink-0 text-sage" />
            <p>
              Orders placed before <strong className="text-sage">{formatHour(form.cutoffHour)}</strong> are
              delivered <strong className="text-sage">the next day by {form.deliveryByLabel || '…'}</strong>.
              Customers can pick from{' '}
              <strong className="text-sage">
                {form.maxDaysAhead} delivery day{form.maxDaysAhead === 1 ? '' : 's'}
              </strong>
              {form.minOrderPkr > 0 && (
                <>
                  , with a minimum order of{' '}
                  <strong className="text-sage">Rs {form.minOrderPkr.toLocaleString('en-PK')}</strong>
                </>
              )}
              .
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Order cutoff" hint="After this, orders roll to the day after tomorrow">
              <Select value={form.cutoffHour} onChange={(e) => set('cutoffHour', Number(e.target.value))}>
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Delivered by" hint="Shown to customers, e.g. “5 PM”">
              <Input
                value={form.deliveryByLabel}
                maxLength={20}
                onChange={(e) => set('deliveryByLabel', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Delivery days customers can choose" group>
            <Segmented
              value={String(form.maxDaysAhead)}
              onChange={(v) => set('maxDaysAhead', Number(v))}
              options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: n }))}
              className="self-start"
            />
          </Field>
          <Field label="Minimum order" hint="Use 0 for no minimum">
            <PrefixInput
              prefix="Rs"
              type="number"
              min={0}
              value={form.minOrderPkr}
              onChange={(e) => set('minOrderPkr', Number(e.target.value))}
              className="sm:max-w-60"
            />
          </Field>
        </Section>

        <Section title="Contact" body="Shown on the storefront and used for the WhatsApp order button.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp number" hint="Country code first, no plus: 923001234567">
              <PrefixInput
                prefix="+"
                inputMode="numeric"
                value={form.whatsappNumber}
                onChange={(e) => set('whatsappNumber', e.target.value.replace(/\D/g, ''))}
              />
            </Field>
            <Field label="Instagram">
              <PrefixInput
                prefix="@"
                value={form.instagramHandle}
                onChange={(e) => set('instagramHandle', e.target.value.replace(/^@/, ''))}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="New-order alerts"
          body="Emails that get a message for every new order. Needs RESEND_API_KEY and a verified domain."
        >
          <Field label="Alert emails" hint="Press Enter or comma after each email" group>
            <div className={`${inputCls} flex h-auto min-h-10 flex-wrap items-center gap-1.5 py-1.5`}>
              {form.alertEmails.map((e) => (
                <span
                  key={e}
                  className="inline-flex items-center gap-1 rounded-lg bg-sage-soft py-1 pr-1 pl-2.5 text-sm font-medium text-forest"
                >
                  {e}
                  <button
                    type="button"
                    aria-label={`Remove ${e}`}
                    onClick={() =>
                      set(
                        'alertEmails',
                        form.alertEmails.filter((x) => x !== e),
                      )
                    }
                    className="grid h-5 w-5 place-items-center rounded hover:bg-forest hover:text-white"
                  >
                    <IconX width={12} height={12} />
                  </button>
                </span>
              ))}
              <input
                type="email"
                value={emailInput}
                placeholder={form.alertEmails.length ? '' : 'owner@preppal.pk'}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addEmail();
                  }
                }}
                onBlur={addEmail}
                className="min-w-40 flex-1 bg-transparent outline-none"
              />
            </div>
          </Field>
        </Section>
      </fieldset>

      <SaveBar
        show={dirty && !readOnly}
        saving={save.isPending}
        onSave={() => save.mutate(form)}
        onDiscard={() => setForm(s.data)}
      />
    </>
  );
}

function Section({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 rounded-2xl border border-line bg-white p-5 shadow-card lg:grid-cols-[260px_minmax(0,1fr)] lg:p-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-[13px] text-muted">{body}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  );
}

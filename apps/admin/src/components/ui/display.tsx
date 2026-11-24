import type { ReactNode } from 'react';
import { IconAlert } from '../icons';

// ───────────── Tones ─────────────
export type Tone = 'green' | 'amber' | 'sky' | 'plum' | 'clay' | 'rose' | 'red' | 'gray';
export const TONE: Record<Tone, string> = {
  green: 'bg-sage-soft text-forest',
  amber: 'bg-amber-soft text-amber-ink',
  sky: 'bg-sky-soft text-sky-ink',
  plum: 'bg-plum-soft text-plum-ink',
  clay: 'bg-clay-soft text-clay-ink',
  rose: 'bg-rose-soft text-rose-ink',
  red: 'bg-terra-soft text-terra-ink',
  gray: 'bg-stone-soft text-muted',
};

export function Badge({ tone = 'gray', children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${TONE[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Rounded-square tinted icon holder used in card headers, stats and list rows. */
export function IconChip({
  tone = 'gray',
  children,
  size = 'md',
}: {
  tone?: Tone;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const s = { sm: 'h-8 w-8 rounded-lg', md: 'h-9 w-9 rounded-xl', lg: 'h-11 w-11 rounded-xl' }[size];
  return (
    <span className={`grid shrink-0 place-items-center ring-1 ring-black/[0.04] ring-inset ${s} ${TONE[tone]}`}>
      {children}
    </span>
  );
}

const AVATAR_TONES: Tone[] = ['amber', 'sky', 'plum', 'green', 'clay', 'rose'];
export function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const tone = AVATAR_TONES[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR_TONES.length] ?? 'gray';
  return (
    <span
      aria-hidden
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[13px] font-bold ${TONE[tone]} ${className}`}
    >
      {initials || '?'}
    </span>
  );
}

// ───────────── Layout ─────────────
export function Card({
  icon,
  tone = 'gray',
  title,
  description,
  children,
  actions,
  className = '',
  bodyClassName = 'p-5',
}: {
  icon?: ReactNode;
  tone?: Tone;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`rounded-[var(--radius-card)] border border-line bg-surface shadow-card ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-1">
          <div className="flex min-w-0 items-start gap-3">
            {icon && <IconChip tone={tone}>{icon}</IconChip>}
            <div className="min-w-0">
              {title && <h2 className="text-[15.5px] leading-snug font-bold text-ink">{title}</h2>}
              {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4" data-print-hide>
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-bold text-ink md:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface Stat {
  icon: ReactNode;
  tone?: Tone;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  onClick?: () => void;
  highlight?: boolean;
}

const LG_COLS: Record<number, string> = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };

/** One card split into stat cells with dividers (KPI strip). */
export function StatStrip({ stats, className = '' }: { stats: Stat[]; className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-card ${LG_COLS[stats.length] ?? 'lg:grid-cols-4'} ${className}`}
      data-print-hide
    >
      {stats.map((s, i) => {
        const body = (
          <>
            <IconChip tone={s.tone ?? 'gray'}>{s.icon}</IconChip>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-muted">{s.label}</div>
              <div
                className={`mt-0.5 text-[22px] leading-tight font-bold tabular-nums ${s.highlight ? 'text-amber-ink' : 'text-ink'}`}
              >
                {s.value}
              </div>
              {s.sub && <div className="mt-1 text-xs text-muted">{s.sub}</div>}
            </div>
          </>
        );
        const cls = `flex items-start gap-3 p-4 text-left md:p-5 ${i % 2 === 1 ? 'border-l border-line' : ''} ${i >= 2 ? 'border-t border-line lg:border-t-0' : ''} ${i > 0 ? 'lg:border-l' : ''}`;
        return s.onClick ? (
          <button key={s.label} type="button" onClick={s.onClick} className={`${cls} transition hover:bg-subtle`}>
            {body}
          </button>
        ) : (
          <div key={s.label} className={cls}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

// ───────────── Feedback ─────────────
export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-xl border border-rose-ink/15 bg-rose-soft px-3.5 py-2.5 text-sm text-rose-ink"
    >
      <IconAlert className="mt-0.5 shrink-0" width={16} height={16} />
      {error instanceof Error ? error.message : 'Something went wrong'}
    </p>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <IconChip tone="green" size="lg">
        {icon}
      </IconChip>
      <p className="mt-3 text-base font-bold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-stone-soft ${className}`} />
);

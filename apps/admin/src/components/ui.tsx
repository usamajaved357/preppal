import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { IconAlert } from './icons';

// ───────────── Buttons ─────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-forest text-white shadow-card hover:bg-forest-deep',
  secondary: 'border border-line-strong bg-white text-ink hover:border-forest hover:text-forest',
  ghost: 'text-muted hover:bg-sand hover:text-ink',
  danger: 'border border-terra/40 bg-white text-terra hover:bg-terra hover:text-white',
};
const SIZE: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-[10px] px-4 text-sm',
};

/** Class string for things that look like buttons (Links, <a>). */
export const buttonCls = (variant: Variant = 'primary', size: Size = 'md') =>
  `inline-flex shrink-0 items-center justify-center font-semibold transition disabled:pointer-events-none disabled:opacity-45 ${VARIANT[variant]} ${SIZE[size]}`;

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" {...p} className={`${buttonCls(variant, size)} ${className}`} />;
}

export function IconButton({
  label,
  className = '',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...p}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-sand hover:text-ink ${className}`}
    />
  );
}

// ───────────── Form controls ─────────────
export const inputCls =
  'h-10 w-full rounded-[10px] border border-line-strong bg-white px-3 text-[15px] text-ink outline-none transition placeholder:text-muted/60 hover:border-muted/50 focus:border-forest focus:ring-3 focus:ring-sage/50 disabled:bg-canvas disabled:text-muted';

/** Labelled form field. Use `group` when the content holds buttons (a <label> would click the first one). */
export function Field({
  label,
  children,
  hint,
  className = '',
  group = false,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
  group?: boolean;
}) {
  const Tag = group ? 'div' : 'label';
  return (
    <Tag
      className={`flex min-w-0 flex-col gap-1.5 ${className}`}
      role={group ? 'group' : undefined}
      aria-label={group ? label : undefined}
    >
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </Tag>
  );
}

export const Input = ({ className = '', ...p }: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={`${inputCls} ${className}`} />
);

/** Input with a fixed prefix such as "Rs". */
export function PrefixInput({
  prefix,
  className = '',
  ...p
}: InputHTMLAttributes<HTMLInputElement> & { prefix: string }) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm font-semibold text-muted">
        {prefix}
      </span>
      <input {...p} className={`${inputCls} pl-10 tabular-nums`} />
    </div>
  );
}

export const Select = ({ className = '', ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={`${inputCls} cursor-pointer pr-8 ${className}`} />
);

export const Textarea = ({ className = '', ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={`${inputCls} h-auto min-h-20 resize-y py-2.5 leading-relaxed ${className}`} />
);

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? 'bg-forest' : 'bg-line-strong'}`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-card transition ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

/** Pill-style segmented control. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex flex-wrap gap-1 rounded-xl bg-sand/70 p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition ${
            value === o.value ? 'bg-white text-forest shadow-card' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ───────────── Layout ─────────────
export function Card({
  title,
  description,
  children,
  actions,
  className = '',
  bodyClassName = 'p-5',
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-white shadow-card ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[17px] font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          {actions}
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
  kicker,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  kicker?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4" data-print-hide>
      <div className="min-w-0">
        {kicker && (
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-gold">{kicker}</div>
        )}
        <h1 className="text-[28px] leading-tight font-semibold text-forest md:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ───────────── Feedback ─────────────
export type Tone = 'green' | 'amber' | 'sky' | 'plum' | 'clay' | 'red' | 'gray';
export const TONE: Record<Tone, string> = {
  green: 'bg-sage-soft text-forest',
  amber: 'bg-amber-soft text-amber-ink',
  sky: 'bg-sky-soft text-sky-ink',
  plum: 'bg-plum-soft text-plum-ink',
  clay: 'bg-clay-soft text-clay-ink',
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

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-xl border border-terra/20 bg-terra-soft px-3.5 py-2.5 text-sm text-terra-ink"
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
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-sage-soft text-forest">
        {icon}
      </div>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-sand ${className}`} />
);

export function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <span
      aria-hidden
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-soft text-[13px] font-bold text-forest ${className}`}
    >
      {initials || '?'}
    </span>
  );
}

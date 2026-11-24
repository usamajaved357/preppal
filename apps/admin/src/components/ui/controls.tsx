import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { IconCheck, IconChevronDown, IconSearch } from '../icons';

// ───────────── Buttons ─────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand';
type Size = 'sm' | 'md';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-ink text-white shadow-pill hover:bg-ink-soft',
  brand: 'bg-forest text-white shadow-pill hover:bg-forest-deep',
  secondary: 'border border-line-strong bg-surface text-ink shadow-card hover:border-ink/30 hover:bg-subtle',
  ghost: 'text-muted hover:bg-subtle hover:text-ink',
  danger: 'bg-rose-ink text-white shadow-pill hover:bg-rose-ink/90',
};
const SIZE: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
};

/** Class string for things that look like buttons (Links, <a>). All buttons are pills. */
export const buttonCls = (variant: Variant = 'primary', size: Size = 'md') =>
  `inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-45 ${VARIANT[variant]} ${SIZE[size]}`;

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" {...p} className={`${buttonCls(variant, size)} ${className}`} />;
}

/** Leading "+" (or any icon) in a small translucent circle, as on primary create buttons. */
export const ButtonIcon = ({ children }: { children: ReactNode }) => (
  <span className="-ml-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/15">{children}</span>
);

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
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-subtle hover:text-ink disabled:opacity-40 ${className}`}
    />
  );
}

// ───────────── Form controls ─────────────
/** Shared look for every text control. Shape (radius) and horizontal padding are added per control so they never clash. */
export const fieldBase =
  'w-full border border-line-strong bg-surface text-[14.5px] text-ink outline-none transition placeholder:text-faint hover:border-faint focus:border-ink/60 focus:ring-4 focus:ring-ink/8 disabled:bg-subtle disabled:text-muted';

/** Boxed text input (forms). */
export const inputCls = `${fieldBase} h-10 rounded-xl px-3.5`;
/** Capsule controls: search bars and dropdown menus. */
export const pillCls = `${fieldBase} h-10 rounded-full px-4`;

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
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </Tag>
  );
}

export const Input = ({
  className = '',
  pill = false,
  ...p
}: InputHTMLAttributes<HTMLInputElement> & { pill?: boolean }) => (
  <input {...p} className={`${pill ? pillCls : inputCls} ${className}`} />
);

/** Input with a fixed prefix such as "Rs". */
export function PrefixInput({
  prefix,
  className = '',
  ...p
}: InputHTMLAttributes<HTMLInputElement> & { prefix: string }) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-sm font-semibold text-faint">
        {prefix}
      </span>
      <input {...p} className={`${fieldBase} h-10 rounded-xl pr-3.5 pl-10 tabular-nums`} />
    </div>
  );
}

export function SearchInput({ className = '', ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className}`}>
      <IconSearch
        width={16}
        height={16}
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint"
      />
      <input type="search" {...p} className={`${fieldBase} h-10 rounded-full pr-4 pl-10`} />
    </div>
  );
}

/**
 * Capsule dropdown with its own chevron, inset from the right edge.
 * `className` styles the wrapper (width, flex); `compact` makes it 36px tall.
 */
export function Select({
  className = '',
  compact = false,
  ...p
}: SelectHTMLAttributes<HTMLSelectElement> & { compact?: boolean }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        {...p}
        className={`${fieldBase} cursor-pointer appearance-none truncate rounded-full pr-11 pl-4 ${compact ? 'h-9 text-sm' : 'h-10'}`}
      />
      <IconChevronDown
        width={16}
        height={16}
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export const Textarea = ({ className = '', ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...p}
    className={`${fieldBase} min-h-20 resize-y rounded-xl px-3.5 py-2.5 leading-relaxed ${className}`}
  />
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
      className={`relative inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full transition disabled:opacity-45 ${checked ? 'bg-ink' : 'bg-line-strong'}`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)] transition ${checked ? 'translate-x-[23px]' : 'translate-x-[3px]'}`}
      />
    </button>
  );
}

/** Pill tabs. Active pill uses the brand gradient. Optional counts render as small numbers. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T;
  options: { value: T; label: ReactNode; count?: number; icon?: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-line bg-surface p-1 shadow-card ${className}`}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition ${
              active ? 'pill-active' : 'text-muted hover:text-ink'
            }`}
          >
            {o.icon}
            {o.label}
            {o.count !== undefined && (
              <span className={`tabular-nums ${active ? 'text-white/75' : 'text-faint'}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Big selectable card with a check badge — for choices that need a sentence of explanation. */
export function OptionCard({
  selected,
  title,
  body,
  onSelect,
  icon,
}: {
  selected: boolean;
  title: ReactNode;
  body?: ReactNode;
  onSelect: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
        selected
          ? 'border-forest bg-sage-soft/50 ring-3 ring-forest/12'
          : 'border-line-strong bg-surface hover:border-faint'
      }`}
    >
      {icon}
      <span className="min-w-0 pr-5">
        <span className="block text-sm font-bold text-ink">{title}</span>
        {body && <span className="mt-0.5 block text-xs text-muted">{body}</span>}
      </span>
      {selected && (
        <span className="absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-forest text-white">
          <IconCheck width={12} height={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/** Numbered step heading inside long forms and modals. */
export const Step = ({ n, title }: { n: number; title: string }) => (
  <div className="flex items-center gap-2.5">
    <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs font-bold text-white">
      {n}
    </span>
    <h3 className="text-[15px] font-bold text-ink">{title}</h3>
  </div>
);

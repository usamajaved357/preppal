import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export const inputCls =
  'h-11 w-full rounded-[10px] border-[1.5px] border-[#D7D0C1] bg-white px-3 text-[15px] outline-none focus:border-forest';

export function Button({
  variant = 'primary',
  className = '',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const v = {
    primary: 'bg-forest text-white hover:bg-forest-deep',
    ghost: 'border border-[#D7D0C1] bg-white text-ink hover:border-forest',
    danger: 'border border-terra bg-white text-terra hover:bg-terra hover:text-white',
  }[variant];
  return (
    <button
      type="button"
      {...p}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition disabled:opacity-50 ${v} ${className}`}
    />
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={`${inputCls} ${p.className ?? ''}`} />
);
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={`${inputCls} ${p.className ?? ''}`} />
);

export function Card({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold text-forest">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg bg-[#FBEAE3] px-3 py-2 text-sm text-[#7A2E12]">
      {error instanceof Error ? error.message : 'Something went wrong'}
    </p>
  );
}

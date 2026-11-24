import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { IconAlert, IconCheck, IconDots, IconX } from './icons';
import { Button, IconButton } from './ui';

// ───────────── Toasts + confirm dialog (one provider) ─────────────
type ToastTone = 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}
interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}
interface FeedbackApi {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (o: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback needs <FeedbackProvider>');
  return ctx;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const nextId = useRef(0);

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3000);
  }, []);
  const confirm = useCallback(
    (o: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })),
    [],
  );
  const close = (v: boolean) => {
    pending?.resolve(v);
    setPending(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex animate-rise items-center gap-2.5 rounded-full bg-ink py-2.5 pr-5 pl-2.5 text-sm font-medium text-white shadow-pop"
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full ${t.tone === 'success' ? 'bg-sage text-forest-deep' : 'bg-rose-ink text-white'}`}
            >
              {t.tone === 'success' ? (
                <IconCheck width={13} height={13} strokeWidth={3} />
              ) : (
                <IconAlert width={12} height={12} strokeWidth={2.6} />
              )}
            </span>
            {t.message}
          </div>
        ))}
      </div>
      {pending && (
        <Modal
          onClose={() => close(false)}
          title={pending.title}
          width="max-w-md"
          footer={
            <>
              <span />
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => close(false)}>
                  Cancel
                </Button>
                <Button variant={pending.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
                  {pending.confirmLabel ?? 'Confirm'}
                </Button>
              </div>
            </>
          }
        >
          {pending.body && <div className="text-sm leading-relaxed text-muted">{pending.body}</div>}
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}

// ───────────── Modal + drawer ─────────────
function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
}

/**
 * Dialog with a header (title + description), scrollable body and an optional footer bar.
 * The footer is a flex row: put a summary on the left and actions on the right.
 */
export function Modal({
  title,
  description,
  children,
  footer,
  onClose,
  width = 'max-w-lg',
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  width?: string;
}) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-[60] grid animate-fade place-items-center bg-ink/35 p-3 backdrop-blur-[3px] sm:p-6">
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-full w-full ${width} animate-rise flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-pop`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mt-0.5 -mr-2">
            <IconX />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-subtle px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Drawer({
  children,
  onClose,
  header,
  footer,
}: {
  children: ReactNode;
  onClose: () => void;
  header: ReactNode;
  footer?: ReactNode;
}) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-50 animate-fade bg-ink/30 backdrop-blur-[2px]" data-print-hide>
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className="absolute inset-y-2 right-2 flex w-[calc(100%-16px)] max-w-[520px] animate-slide-in flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-canvas shadow-pop"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <div className="min-w-0 flex-1">{header}</div>
          <IconButton label="Close" onClick={onClose} className="-mr-2">
            <IconX />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="border-t border-line bg-surface px-5 py-3.5">{footer}</div>}
      </aside>
    </div>
  );
}

/** Sticky "unsaved changes" bar shown at the bottom of edit pages. */
export function SaveBar({
  show,
  saving,
  onSave,
  onDiscard,
  label = 'You have unsaved changes',
  saveLabel = 'Save changes',
}: {
  show: boolean;
  saving?: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  label?: string;
  saveLabel?: string;
}) {
  if (!show) return null;
  return (
    <div className="pointer-events-none sticky bottom-4 z-30 mt-6 flex justify-center" data-print-hide>
      <div className="pointer-events-auto flex w-full max-w-xl animate-rise flex-wrap items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-white shadow-pop">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 animate-pulse rounded-full bg-sage" />
          {label}
        </span>
        <div className="flex gap-1.5">
          {onDiscard && (
            <Button variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={onDiscard}>
              Discard
            </Button>
          )}
          <Button className="bg-white !text-ink hover:bg-sage-soft" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ───────────── Row actions menu ─────────────
export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  hint?: string;
}

/** "⋯" button that opens a small menu of row actions (Edit, Duplicate, Delete…). */
export function RowMenu({ items, label = 'More actions' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <IconButton
        label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <IconDots />
      </IconButton>
      {open && (
        <div
          role="menu"
          className="absolute top-9 right-0 z-40 w-52 animate-rise overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-pop"
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              title={it.hint}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                it.onSelect();
              }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition disabled:opacity-40 ${
                it.danger ? 'text-rose-ink hover:bg-rose-soft' : 'text-ink hover:bg-subtle'
              }`}
            >
              {it.icon && <span className="opacity-80">{it.icon}</span>}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

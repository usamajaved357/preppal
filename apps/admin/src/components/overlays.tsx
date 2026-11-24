import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { IconAlert, IconCheck, IconX } from './icons';
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
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex animate-rise items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-pop"
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-full ${t.tone === 'success' ? 'bg-sage text-forest-deep' : 'bg-terra text-white'}`}
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
        <Modal onClose={() => close(false)} title={pending.title} width="max-w-md">
          {pending.body && <div className="text-sm text-muted">{pending.body}</div>}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => close(false)}>
              Keep it
            </Button>
            <Button
              className={pending.danger ? 'bg-terra hover:bg-terra-ink' : ''}
              onClick={() => close(true)}
              autoFocus
            >
              {pending.confirmLabel ?? 'Confirm'}
            </Button>
          </div>
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

export function Modal({
  title,
  children,
  onClose,
  width = 'max-w-lg',
}: {
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  width?: string;
}) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-[60] grid animate-fade place-items-center bg-ink/40 p-4 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${width} animate-rise rounded-2xl bg-white p-6 shadow-pop`}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <IconButton label="Close" onClick={onClose} className="-mt-1 -mr-2">
            <IconX />
          </IconButton>
        </div>
        {children}
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
    <div className="fixed inset-0 z-50 animate-fade bg-ink/35" data-print-hide>
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-full max-w-[520px] animate-slide-in flex-col bg-canvas shadow-pop"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line bg-white px-5 py-4">
          <div className="min-w-0 flex-1">{header}</div>
          <IconButton label="Close" onClick={onClose} className="-mr-2">
            <IconX />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-line bg-white px-5 py-3.5">{footer}</div>}
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
      <div className="pointer-events-auto flex w-full max-w-2xl animate-rise flex-wrap items-center justify-between gap-3 rounded-2xl bg-forest-deep px-4 py-3 text-white shadow-pop">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-sage" />
          {label}
        </span>
        <div className="flex gap-2">
          {onDiscard && (
            <Button
              variant="ghost"
              className="text-nav-text hover:bg-white/10 hover:text-white"
              onClick={onDiscard}
            >
              Discard
            </Button>
          )}
          <Button className="bg-cream-btn text-forest-deep hover:bg-white" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

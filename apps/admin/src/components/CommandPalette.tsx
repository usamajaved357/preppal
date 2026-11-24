import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { type AdminProduct, get } from '../lib/api';
import { IconBox, IconPlus, IconSearch } from './icons';
import { NAV } from './nav';
import { IconChip } from './ui';

/** Opens the palette on ⌘K / Ctrl+K. */
export function useCommandShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
}

interface Entry {
  key: string;
  label: string;
  hint: string;
  icon: ReactNode;
  go: () => void;
}

/** "Jump to" search over pages, quick actions and products. */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => get<AdminProduct[]>('/admin/products'),
  });
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  const entries = useMemo<Entry[]>(() => {
    const go = (to: string, params?: Record<string, string>) => () => {
      onClose();
      navigate({ to, params } as Parameters<typeof navigate>[0]);
    };
    const pages = NAV.flatMap((g) => g.items).map((n) => {
      const Icon = n.icon;
      return { key: n.to, label: n.label, hint: n.hint, icon: <Icon width={17} height={17} />, go: go(n.to) };
    });
    const actions: Entry[] = [
      {
        key: 'new-product',
        label: 'New product',
        hint: 'Add something to the menu',
        icon: <IconPlus width={17} height={17} />,
        go: go('/products/$id', { id: 'new' }),
      },
    ];
    const prods = (products.data ?? []).map((p) => ({
      key: p.id,
      label: p.name,
      hint: `Product · ${p.variants.length} size${p.variants.length === 1 ? '' : 's'}`,
      icon: <IconBox width={17} height={17} />,
      go: go('/products/$id', { id: p.id }),
    }));
    const all = [...pages, ...actions, ...prods];
    const needle = q.trim().toLowerCase();
    return needle
      ? all.filter((e) => `${e.label} ${e.hint}`.toLowerCase().includes(needle))
      : all.slice(0, 10);
  }, [products.data, q, navigate, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, entries.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
      if (e.key === 'Enter') entries[active]?.go();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [entries, active, onClose]);

  return (
    <div className="fixed inset-0 z-[65] animate-fade bg-ink/30 p-4 pt-[12vh] backdrop-blur-[3px]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to"
        className="relative mx-auto w-full max-w-xl animate-rise overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <IconSearch className="text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Search pages and products…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
          />
          <kbd className="rounded-md border border-line bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-muted">
            Esc
          </kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {entries.map((e, i) => (
            <li key={e.key}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={e.go}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${i === active ? 'bg-subtle' : ''}`}
              >
                <IconChip tone={i === active ? 'green' : 'gray'} size="sm">
                  {e.icon}
                </IconChip>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{e.label}</span>
                  <span className="block truncate text-xs text-muted">{e.hint}</span>
                </span>
              </button>
            </li>
          ))}
          {entries.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>}
        </ul>
      </div>
    </div>
  );
}

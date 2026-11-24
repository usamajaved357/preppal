import type { PublicSettingsDto } from '@preppal/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { type AdminOrder, get } from '../lib/api';
import { useMe } from '../lib/me';
import { STOREFRONT_URL } from '../lib/site';
import { CommandPalette, useCommandShortcut } from './CommandPalette';
import { IconArrowUpRight, IconChevronRight, IconMenu, IconSearch, IconX } from './icons';
import { NAV, type NavItem } from './nav';
import { Avatar } from './ui';

export function Shell() {
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  useCommandShortcut(() => setPalette(true));
  const path = useRouterState({ select: (s) => s.location.pathname });
  // Close the mobile menu after navigating (state adjustment during render, no effect needed).
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setOpen(false);
  }

  if (me.isError) return <NoAccess message={(me.error as Error).message} />;

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-canvas/90 px-4 py-2.5 backdrop-blur md:hidden"
        data-print-hide
      >
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink shadow-card"
        >
          {open ? <IconX /> : <IconMenu />}
        </button>
      </div>

      <nav
        aria-label="Admin"
        data-print-hide
        className={`${open ? 'flex' : 'hidden'} fixed inset-x-0 top-[61px] bottom-0 z-40 flex-col bg-canvas px-3 pb-3 md:sticky md:top-0 md:flex md:h-screen md:w-[244px] md:shrink-0`}
      >
        <div className="hidden px-2 pt-4 pb-4 md:block">
          <Brand />
        </div>
        <button
          type="button"
          onClick={() => setPalette(true)}
          className="mx-1 mt-3 mb-4 flex h-10 items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 text-left text-sm text-faint shadow-card transition hover:border-line-strong md:mt-0"
        >
          <IconSearch width={16} height={16} />
          <span className="flex-1">Jump to…</span>
          <kbd className="rounded-md border border-line bg-subtle px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted">
            ⌘K
          </kbd>
        </button>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="mb-1 px-3 text-xs font-semibold text-faint">{g.group}</div>
              <div className="flex flex-col gap-0.5">
                {g.items.map((n) => (
                  <NavLink key={n.to} item={n} />
                ))}
              </div>
            </div>
          ))}
        </div>
        {me.data && (
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <Avatar name={me.data.name} className="h-9 w-9 rounded-full" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold text-ink">{me.data.name}</div>
              <div className="truncate text-xs text-muted capitalize">{me.data.role}</div>
            </div>
          </div>
        )}
      </nav>

      <div
        data-print-frame
        className="min-w-0 flex-1 bg-surface md:my-2 md:mr-2 md:min-h-[calc(100vh-16px)] md:rounded-[var(--radius-card)] md:border md:border-line md:shadow-card"
      >
        <TopBar path={path} />
        <main className="px-4 py-6 sm:px-6 md:px-8 md:py-7">
          <div className="mx-auto max-w-[1240px]">
            <Outlet />
          </div>
        </main>
      </div>
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </div>
  );
}

function TopBar({ path }: { path: string }) {
  const settings = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => get<PublicSettingsDto>('/settings'),
  });
  const item = NAV.flatMap((g) => g.items).find((n) => (n.to === '/' ? path === '/' : path.startsWith(n.to)));
  const sub = path.startsWith('/products/') ? (path.endsWith('/new') ? 'New product' : 'Edit product') : null;
  const paused = settings.data?.ordersPaused;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6 md:px-8"
      data-print-hide
    >
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <Link to="/" className="text-muted hover:text-ink">
          Preppal admin
        </Link>
        {item && (
          <>
            <IconChevronRight width={14} height={14} className="text-faint" />
            {sub ? (
              <Link to={item.to} className="text-muted hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-ink">{item.label}</span>
            )}
          </>
        )}
        {sub && (
          <>
            <IconChevronRight width={14} height={14} className="text-faint" />
            <span className="truncate font-semibold text-ink">{sub}</span>
          </>
        )}
      </nav>
      <div className="flex items-center gap-2">
        {settings.data && (
          <Link
            to="/settings"
            className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[13px] font-semibold text-ink shadow-card transition hover:border-line-strong"
            title="Change in Settings"
          >
            <span className={`h-2 w-2 rounded-full ${paused ? 'bg-amber-ink' : 'animate-pulse bg-forest'}`} />
            {paused ? 'Orders paused' : 'Taking orders'}
          </Link>
        )}
        {STOREFRONT_URL && (
          <a
            href={STOREFRONT_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[13px] font-semibold text-ink shadow-card transition hover:border-line-strong sm:flex"
          >
            Storefront <IconArrowUpRight width={14} height={14} />
          </a>
        )}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl ring-1 ring-line" />
      <div className="leading-tight">
        <div className="font-display text-[17px] font-bold text-forest">Preppal</div>
        <div className="text-xs text-muted">Admin console</div>
      </div>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  const pending = usePendingCount(item.to === '/');
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.to === '/' }}
      className="group flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 text-[14.5px] font-medium text-ink-soft transition hover:bg-surface/70 hover:text-ink"
      activeProps={{ className: '!border-line bg-surface font-semibold !text-ink shadow-card' }}
    >
      {({ isActive }) => (
        <>
          <Icon
            width={18}
            height={18}
            className={isActive ? 'text-terra' : 'text-faint group-hover:text-ink'}
          />
          <span className="flex-1">{item.label}</span>
          {pending > 0 && (
            <span
              title={`${pending} order${pending === 1 ? '' : 's'} waiting for confirmation`}
              className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-ink px-1.5 text-[11px] font-bold text-white"
            >
              {pending}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

/** Orders awaiting confirmation for the next delivery day (shares the Orders page cache). */
function usePendingCount(enabled: boolean): number {
  const settings = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => get<PublicSettingsDto>('/settings'),
    enabled,
  });
  const date = settings.data?.deliveryDates[0];
  const orders = useQuery({
    queryKey: ['orders', date],
    queryFn: () => get<AdminOrder[]>(`/admin/orders?date=${date}`),
    enabled: enabled && !!date,
    refetchInterval: 30_000,
  });
  if (!enabled) return 0;
  return orders.data?.filter((o) => o.status === 'pending').length ?? 0;
}

function NoAccess({ message }: { message: string }) {
  return (
    <div className="hero-wash grid min-h-screen place-items-center bg-canvas p-6">
      <div className="w-full max-w-md animate-rise rounded-[var(--radius-card)] border border-line bg-surface p-8 text-center shadow-pop">
        <img src="/logo.png" alt="" className="mx-auto mb-5 h-16 w-16 rounded-2xl" />
        <h1 className="mb-2 text-2xl font-bold text-ink">No admin access</h1>
        <p className="text-sm text-muted">{message}.</p>
        <p className="mt-4 rounded-2xl bg-subtle px-4 py-3 text-sm text-muted">
          Ask the owner to add your email under <strong className="text-ink">Team & riders</strong>, then
          refresh this page.
        </p>
      </div>
    </div>
  );
}

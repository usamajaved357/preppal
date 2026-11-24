import type { PublicSettingsDto } from '@preppal/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { type ComponentType, type SVGProps, useState } from 'react';
import { type AdminOrder, get } from '../lib/api';
import { useMe } from '../lib/me';
import { STOREFRONT_URL } from '../lib/site';
import {
  IconBox,
  IconExternal,
  IconMenu,
  IconOrders,
  IconPin,
  IconSettings,
  IconStack,
  IconUsers,
  IconX,
} from './icons';
import { Avatar } from './ui';

type NavItem = { to: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> };
const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Daily', items: [{ to: '/', label: 'Orders', icon: IconOrders }] },
  {
    group: 'Catalog',
    items: [
      { to: '/products', label: 'Products', icon: IconBox },
      { to: '/inventory', label: 'Inventory', icon: IconStack },
    ],
  },
  {
    group: 'Setup',
    items: [
      { to: '/areas', label: 'Delivery areas', icon: IconPin },
      { to: '/team', label: 'Team & riders', icon: IconUsers },
      { to: '/settings', label: 'Settings', icon: IconSettings },
    ],
  },
];

export function Shell() {
  const me = useMe();
  const [open, setOpen] = useState(false);
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
        className="sticky top-0 z-40 flex items-center justify-between bg-forest-deep px-4 py-2.5 md:hidden"
        data-print-hide
      >
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10"
        >
          {open ? <IconX /> : <IconMenu />}
        </button>
      </div>

      <nav
        aria-label="Admin"
        data-print-hide
        className={`${open ? 'flex' : 'hidden'} fixed inset-x-0 top-[60px] bottom-0 z-40 flex-col bg-forest-deep px-3 pb-4 text-nav-text md:sticky md:top-0 md:flex md:h-screen md:w-[248px] md:shrink-0`}
      >
        <div className="hidden px-3 pt-5 pb-6 md:block">
          <Brand />
        </div>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto pt-3 md:pt-0">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-nav-muted/70">
                {g.group}
              </div>
              <div className="flex flex-col gap-0.5">
                {g.items.map((n) => (
                  <NavLink key={n.to} item={n} />
                ))}
              </div>
            </div>
          ))}
        </div>
        {STOREFRONT_URL && (
          <a
            href={STOREFRONT_URL}
            target="_blank"
            rel="noreferrer"
            className="mb-3 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-nav-muted transition hover:bg-white/5 hover:text-white"
          >
            <IconExternal width={17} height={17} />
            View storefront
          </a>
        )}
        {me.data && (
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <Avatar name={me.data.name} className="bg-sage text-forest-deep" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-white">{me.data.name}</div>
              <div className="truncate text-xs text-nav-muted">
                {me.data.email} · <span className="capitalize">{me.data.role}</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-[1280px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.png" alt="" className="h-10 w-10 rounded-full ring-2 ring-white/10" />
      <div className="leading-tight">
        <div className="font-display text-lg font-bold text-white">Preppal</div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Admin</div>
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
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition hover:bg-white/5 hover:text-white"
      activeProps={{ className: 'bg-white/10 !text-white' }}
    >
      {({ isActive }) => (
        <>
          <Icon
            width={19}
            height={19}
            className={isActive ? 'text-sage' : 'text-nav-muted group-hover:text-white'}
          />
          <span className="flex-1">{item.label}</span>
          {pending > 0 && (
            <span
              title={`${pending} order${pending === 1 ? '' : 's'} waiting for confirmation`}
              className="grid h-5 min-w-5 place-items-center rounded-full bg-sage px-1.5 text-[11px] font-bold text-forest-deep"
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
    <div className="grid min-h-screen place-items-center bg-forest-deep p-6">
      <div className="w-full max-w-md animate-rise rounded-3xl bg-white p-8 text-center shadow-pop">
        <img src="/logo.png" alt="" className="mx-auto mb-5 h-16 w-16 rounded-full" />
        <h1 className="mb-2 text-2xl font-semibold text-forest">No admin access</h1>
        <p className="text-sm text-muted">{message}.</p>
        <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">
          Ask the owner to add your email under <strong className="text-ink">Team & riders</strong>, then
          refresh this page.
        </p>
      </div>
    </div>
  );
}

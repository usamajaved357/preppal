import { useQuery } from '@tanstack/react-query';
import { Link, Outlet } from '@tanstack/react-router';
import { get } from '../lib/api';

const NAV = [
  { to: '/', label: 'Orders' },
  { to: '/products', label: 'Products' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/areas', label: 'Delivery areas' },
  { to: '/team', label: 'Team & riders' },
  { to: '/settings', label: 'Settings' },
] as const;

export function Shell() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => get<{ email: string; name: string; role: string }>('/admin/me'),
  });

  if (me.isError) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-md">
          <img src="/logo.png" alt="" className="mx-auto mb-4 h-16 w-16" />
          <h1 className="mb-2 text-2xl font-semibold">No admin access</h1>
          <p className="text-muted">
            {(me.error as Error).message}. Ask the owner to add your email under Team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-wrap bg-[#F7F4EC]">
      <nav
        aria-label="Admin"
        className="flex w-full flex-col gap-1 bg-forest-deep p-4 text-[#D7E2D6] md:min-h-screen md:w-60"
      >
        <div className="mb-4 flex items-center gap-2.5 px-2">
          <img src="/logo.png" alt="" className="h-11 w-11" />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-white">Preppal</div>
            <div className="text-xs text-[#A9BFAF]">Admin</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 md:flex-col">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === '/' }}
              className="rounded-lg px-3 py-2.5 text-[15px] hover:bg-white/5"
              activeProps={{ className: 'bg-white/10 text-white' }}
            >
              {n.label}
            </Link>
          ))}
        </div>
        {me.data && (
          <div className="mt-auto hidden border-t border-white/10 px-2 pt-3 text-xs text-[#A9BFAF] md:block">
            Signed in as
            <br />
            <span className="text-white">{me.data.email}</span> · {me.data.role}
          </div>
        )}
      </nav>
      <main className="min-w-0 flex-1 p-5 md:p-7">
        <Outlet />
      </main>
    </div>
  );
}

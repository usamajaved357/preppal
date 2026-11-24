import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { q } from '../lib/api';
import { cartCount, useCart } from '../lib/cart';
import { useSearch } from '../lib/search';
import { formatHour, formatWhatsapp } from '../lib/site';
import { useToast } from '../lib/toast';
import { IconBag, IconCheck, IconMenu, IconPin, IconSearch, IconWhatsApp } from './icons';

/**
 * Header visibility: hide while scrolling down past the fold, show again on any scroll up.
 * `scrolled` adds a shadow once the page has moved.
 */
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    // Plain passive listener: setState with an unchanged value doesn't re-render, so this stays cheap.
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > 160);
        last = y;
      }
      setScrolled(y > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return { hidden, scrolled };
}

export function Layout() {
  const { data: settings } = useQuery(q.settings());
  const count = useCart((s) => cartCount(s.lines));
  const [open, setOpen] = useState(false);
  const wa = settings?.whatsappNumber ?? '923285228505';
  const city = settings?.cityNames.join(', ') || 'Sahiwal';
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();
  const path = useRouterState({ select: (st) => st.location.pathname });
  const { hidden, scrolled } = useHideOnScroll();
  // Keep the header on screen while something in it (search box, menu) has focus.
  const headerRef = useRef<HTMLElement>(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const sync = () => setFocused(!!headerRef.current?.contains(document.activeElement));
    const onOut = () => setTimeout(sync, 0); // activeElement updates after focusout
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', sync);
      document.removeEventListener('focusout', onOut);
    };
  }, []);
  const toast = useToast();
  // Bump the cart pill whenever the count goes up.
  const [bump, setBump] = useState(0);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) setBump((b) => b + 1);
    prevCount.current = count;
  }, [count]);
  const goToMenu = () => {
    const scroll = () => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    if (path === '/') scroll();
    else navigate({ to: '/' }).then(() => setTimeout(scroll, 80));
  };

  return (
    <div className="min-h-screen bg-cream">
      <div
        className={`px-4 py-2 text-center text-[13.5px] ${settings?.ordersPaused ? 'bg-terra text-white' : 'bg-forest-deep text-[#E4EBDD]'}`}
      >
        {settings?.ordersPaused ? (
          <strong className="font-semibold">{settings.pauseMessage}</strong>
        ) : settings?.announcement ? (
          <span className="font-medium">{settings.announcement}</span>
        ) : (
          <>
            <strong className="font-semibold text-sage">
              Order by {formatHour(settings?.cutoffHour ?? 23)}
            </strong>{' '}
            for delivery tomorrow by {settings?.deliveryByLabel ?? '5 PM'} · Cash on delivery · Now delivering
            in {city}
          </>
        )}
      </div>

      <header
        ref={headerRef}
        className={`sticky top-0 z-30 border-b bg-white/90 backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 ease-out ${
          hidden && !open && !focused ? '-translate-y-full' : 'translate-y-0'
        } ${scrolled ? 'border-transparent shadow-[0_8px_30px_-12px_rgba(22,58,44,.25)]' : 'border-line'}`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-3 px-4 py-2.5 sm:gap-x-7 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Preppal home">
            <img src="/images/logo.png" alt="" className="h-12 w-12 sm:h-14 sm:w-14" />
            <span className="font-display text-[26px] font-bold text-forest">Preppal</span>
          </Link>
          <nav aria-label="Main" className="hidden gap-6 text-[15px] font-medium md:flex">
            <a href="/#menu" className="py-3 hover:text-forest">
              Menu
            </a>
            <a href="/#categories" className="py-3 hover:text-forest">
              Categories
            </a>
            <Link to="/track" className="py-3 hover:text-forest">
              Track order
            </Link>
          </nav>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              goToMenu();
            }}
            className="order-last flex h-11 flex-[1_1_100%] items-center gap-2.5 rounded-full bg-[#F4F0E7] px-4 ring-forest/30 transition focus-within:bg-white focus-within:ring-2 md:order-none md:flex-[1_1_240px]"
          >
            <IconSearch className="text-muted" />
            <label htmlFor="site-search" className="sr-only">
              Search Preppal
            </label>
            <input
              id="site-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (path !== '/' && e.target.value) navigate({ to: '/' });
              }}
              placeholder="Search paste, garlic, marinated fish…"
              className="w-full bg-transparent text-[15px] outline-none"
            />
          </form>
          <span className="ml-auto hidden items-center gap-1.5 text-sm font-semibold sm:flex md:ml-0">
            <IconPin className="text-forest" /> {city}
          </span>
          <Link
            to="/cart"
            className="ml-auto flex h-11 items-center gap-2 rounded-full bg-forest px-4 text-[15px] sm:px-5 font-semibold text-white transition hover:bg-forest-deep hover:shadow-lg sm:ml-0"
          >
            <IconBag /> <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span
                key={bump}
                className="grid h-6 min-w-6 animate-pop place-items-center rounded-full bg-sage px-1.5 text-[13px] font-bold text-forest-deep"
              >
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
            className="grid h-11 w-11 place-items-center rounded-xl bg-[#F4F0E7] md:hidden"
          >
            <IconMenu />
          </button>
          {open && (
            <nav aria-label="Mobile" className="flex w-full flex-col border-t border-line py-2 md:hidden">
              <a href="/#menu" className="py-3" onClick={() => setOpen(false)}>
                Menu
              </a>
              <a href="/#categories" className="py-3" onClick={() => setOpen(false)}>
                Categories
              </a>
              <Link to="/track" className="py-3" onClick={() => setOpen(false)}>
                Track order
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-20 bg-forest-deep text-[#D7E2D6]">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-10 px-6 pb-8 pt-14">
          <div className="flex max-w-xs flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="" className="h-14 w-14" />
              <span className="font-display text-[28px] font-bold text-white">Preppal</span>
            </div>
            <p className="leading-relaxed">Stop chopping. Start cooking. We handle all the prep.</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="font-semibold text-white">Shop</span>
            <a href="/#menu">Tomorrow's menu</a>
            <Link to="/track">Track order</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="font-semibold text-white">Contact</span>
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
              WhatsApp {formatWhatsapp(wa)}
            </a>
            <a
              href={`https://instagram.com/${settings?.instagramHandle ?? 'preppal.swl'}`}
              target="_blank"
              rel="noreferrer"
            >
              Instagram @{settings?.instagramHandle ?? 'preppal.swl'}
            </a>
            <span>{city}, Punjab</span>
          </div>
        </div>
        <div className="border-t border-[#22513E] px-6 py-4 text-center text-[13px] text-[#A9BFAF]">
          © {new Date().getFullYear()} Preppal · Cash on delivery
        </div>
      </footer>

      {toast.message && (
        <div key={toast.id} role="status" className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="flex animate-toast items-center gap-3 rounded-full bg-forest-deep py-2.5 pr-2.5 pl-3 text-[15px] text-white shadow-[0_18px_40px_-12px_rgba(22,58,44,.6)]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-sage text-forest-deep">
              <IconCheck width={15} height={15} />
            </span>
            <span className="font-medium">{toast.message}</span>
            <Link
              to="/cart"
              onClick={toast.hide}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-forest-deep transition hover:bg-sage"
            >
              View cart
            </Link>
          </div>
        </div>
      )}

      <a
        href={`https://wa.me/${wa}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Order on WhatsApp"
        className="fixed right-5 bottom-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-[#25D366]/40 before:[animation-duration:2.6s] [&>svg]:relative"
      >
        <IconWhatsApp width={26} height={26} />
      </a>
    </div>
  );
}

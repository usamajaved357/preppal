import { useQuery } from '@tanstack/react-query';
import { Link, Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import { q } from '../lib/api';
import { cartCount, useCart } from '../lib/cart';
import { IconBag, IconMenu, IconPin, IconSearch, IconWhatsApp } from './icons';

export function Layout() {
  const { data: settings } = useQuery(q.settings());
  const count = useCart((s) => cartCount(s.lines));
  const [open, setOpen] = useState(false);
  const wa = settings?.whatsappNumber ?? '923285228505';

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-forest-deep px-4 py-2 text-center text-[13.5px] text-[#E4EBDD]">
        <strong className="font-semibold text-sage">Order by 11 PM</strong> for delivery tomorrow by{' '}
        {settings?.deliveryByLabel ?? '5 PM'} · Cash on delivery · Now delivering in Sahiwal
      </div>

      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-7 gap-y-3 px-4 py-2.5 sm:px-6">
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
          <label className="order-last flex h-11 flex-[1_1_100%] items-center gap-2.5 rounded-full bg-[#F4F0E7] px-4 md:order-none md:flex-[1_1_240px]">
            <IconSearch className="text-muted" />
            <span className="sr-only">Search Preppal</span>
            <input
              placeholder="Search paste, garlic, marinated fish…"
              className="w-full bg-transparent text-[15px] outline-none"
            />
          </label>
          <span className="ml-auto hidden items-center gap-1.5 text-sm font-semibold sm:flex md:ml-0">
            <IconPin className="text-forest" /> Sahiwal
          </span>
          <Link
            to="/cart"
            className="ml-auto flex h-11 items-center gap-2 rounded-full bg-forest px-5 text-[15px] font-semibold text-white sm:ml-0"
          >
            <IconBag /> Cart{count > 0 && <span>· {count}</span>}
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
              WhatsApp 0328 5228505
            </a>
            <a
              href={`https://instagram.com/${settings?.instagramHandle ?? 'preppal.swl'}`}
              target="_blank"
              rel="noreferrer"
            >
              Instagram @{settings?.instagramHandle ?? 'preppal.swl'}
            </a>
            <span>Sahiwal, Punjab</span>
          </div>
        </div>
        <div className="border-t border-[#22513E] px-6 py-4 text-center text-[13px] text-[#A9BFAF]">
          © {new Date().getFullYear()} Preppal · Cash on delivery
        </div>
      </footer>

      <a
        href={`https://wa.me/${wa}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Order on WhatsApp"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
      >
        <IconWhatsApp width={26} height={26} />
      </a>
    </div>
  );
}

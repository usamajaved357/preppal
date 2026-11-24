import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { CutoffCountdown } from '../components/CutoffCountdown';
import { HeroSlideshow } from '../components/HeroSlideshow';
import { IconCheck } from '../components/icons';
import { ProductCard } from '../components/ProductCard';
import { api, q } from '../lib/api';
import { INSTAGRAM_TILES, STEPS, TRUST_POINTS } from '../lib/site';

export function HomePage() {
  const settings = useQuery(q.settings());
  const categories = useQuery(q.categories());
  const products = useQuery(q.products());
  const [filter, setFilter] = useState<string>('all');

  const filters = useMemo(() => {
    const used = new Set(products.data?.map((p) => p.categorySlug));
    return [{ slug: 'all', name: 'All' }, ...(categories.data ?? []).filter((c) => used.has(c.slug))];
  }, [categories.data, products.data]);
  const visible = (products.data ?? []).filter((p) => filter === 'all' || p.categorySlug === filter);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest">
        <HeroSlideshow />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="flex min-h-[540px] animate-rise flex-col justify-center gap-5 py-12 text-white md:w-[46%] md:pr-8">
            <span className="text-[13.5px] font-semibold uppercase tracking-[1.6px] text-sage">
              Your meal, simplified
            </span>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-1.2px] md:text-[66px]">
              Stop chopping.
              <br />
              Start cooking.
            </h1>
            <p className="max-w-[470px] text-[18.5px] leading-relaxed text-[#D7E2D6]">
              We handle all the prep — fresh ginger-garlic paste, peeled garlic, masala bases and marinated
              meats, made the morning of delivery.
            </p>
            <div className="mt-1.5 flex flex-wrap gap-3">
              <a
                href="#menu"
                className="inline-flex h-[54px] items-center rounded-full bg-cream-btn px-7 font-bold text-forest-deep"
              >
                Shop tomorrow's menu
              </a>
              <a
                href={`https://wa.me/${settings.data?.whatsappNumber ?? '923285228505'}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-[54px] items-center rounded-full border-[1.5px] border-white/45 px-6 font-semibold"
              >
                Order on WhatsApp
              </a>
            </div>
            {settings.data && (
              <div className="mt-2">
                <CutoffCountdown msUntilCutoff={settings.data.msUntilCutoff} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-sage-soft text-forest">
                <IconCheck />
              </span>
              <span className="flex flex-col leading-snug">
                <strong className="text-[15px] font-semibold">{t.title}</strong>
                <span className="text-[13px] text-muted">{t.body}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl px-6 pt-14">
        <h2 className="text-4xl font-semibold">Shop by category</h2>
        <p className="mt-1.5 text-muted">Everything prepped, washed and ready for the pan</p>
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-6">
          {(categories.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setFilter(c.slug);
                document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group flex flex-col items-center gap-3 text-center"
            >
              <span className="block h-[132px] w-[132px] overflow-hidden rounded-full bg-sand shadow-[0_10px_24px_rgba(22,58,44,.14)]">
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  />
                )}
              </span>
              <span className="flex flex-col">
                <span className="text-[15.5px] font-semibold">{c.name}</span>
                <span className="text-[12.5px] text-muted">{c.description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="menu" className="mx-auto max-w-7xl scroll-mt-28 px-6 pt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-4xl font-semibold">Tomorrow's menu</h2>
            <p className="mt-1.5 text-muted">Prepared fresh the morning of delivery</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.slug}
                type="button"
                onClick={() => setFilter(f.slug)}
                className={`h-10 rounded-full border px-4 text-sm font-medium ${
                  filter === f.slug ? 'border-forest bg-forest text-white' : 'border-[#DDD6C7] bg-white'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
        {products.isLoading && <p className="text-muted">Loading tomorrow's menu…</p>}
        {products.isError && <p className="text-terra">Could not load the menu. Please refresh.</p>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(282px,1fr))] gap-6">
          {visible.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* Feature rows */}
      <section className="mx-auto flex max-w-7xl flex-col gap-20 px-6 pt-24">
        <Feature
          image="/images/site/chopping.jpg"
          alt="Fresh herbs being chopped"
          kicker="Why Preppal"
          title="Skip the prep work. Keep the home-cooked taste."
          body="Peeling garlic, grinding paste, chopping methi and marinating meat take the longest. We do all of it, so you only cook."
          chips={['No more chopping', 'Peeled, ground & ready']}
        />
        <Feature
          reverse
          image="/images/site/karahi.jpg"
          alt="Chicken karahi cooking"
          kicker="Always fresh"
          title="We take tomorrow's orders tonight — because we only sell fresh."
          body="Order before 11 PM. Your items are prepared the next morning and reach your door by 5 PM. Pay the rider in cash."
          chips={['Order by 11 PM', 'At your door by 5 PM']}
        />
      </section>

      {/* How it works */}
      <section className="mt-20 bg-sand">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="mb-9 text-center text-4xl font-semibold">How Preppal works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex flex-col items-center gap-3 text-center">
                <img
                  src={s.image}
                  alt=""
                  className="h-[120px] w-[120px] rounded-full border-4 border-white object-cover shadow-md"
                />
                <span className="text-[12.5px] font-semibold tracking-[1.2px] text-gold">STEP {i + 1}</span>
                <h3 className="text-[23px] font-semibold">{s.title}</h3>
                <p className="max-w-[300px] leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deals */}
      <section className="mx-auto max-w-7xl px-6 pt-20">
        <div className="flex flex-wrap overflow-hidden rounded-[28px] bg-forest-deep">
          <div className="flex flex-[1_1_440px] flex-col gap-3.5 p-8 text-white md:p-12">
            <span className="self-start rounded-full bg-terra px-3 py-1.5 text-xs font-semibold">
              Seasonal deals
            </span>
            <h2 className="text-4xl font-semibold leading-tight md:text-[42px]">
              Iftari se sehri tak — your favourite deal, prepped.
            </h2>
            <p className="leading-relaxed text-[#D7E2D6]">
              Ramazan and Eid bundles, made in limited numbers each day. Get a WhatsApp message when the next
              one opens.
            </p>
            <NotifyForm />
          </div>
          <img
            src="/images/site/spread.jpg"
            alt="A table of small dishes for iftar"
            className="min-h-[300px] flex-[1_1_380px] object-cover"
          />
        </div>
      </section>

      {/* Instagram */}
      <section className="mx-auto max-w-7xl px-6 pt-20">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[32px] font-semibold">From the Preppal kitchen</h2>
            <p className="mt-1.5 text-muted">Recipes, new items and deals on Instagram</p>
          </div>
          <a
            href={`https://instagram.com/${settings.data?.instagramHandle ?? 'preppal.swl'}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-forest"
          >
            Follow @{settings.data?.instagramHandle ?? 'preppal.swl'} →
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {INSTAGRAM_TILES.map((src) => (
            <div key={src} className="group aspect-square overflow-hidden rounded-[18px]">
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Feature(props: {
  image: string;
  alt: string;
  kicker: string;
  title: string;
  body: string;
  chips: [string, string];
  reverse?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-14 ${props.reverse ? 'flex-wrap-reverse md:flex-row-reverse' : ''}`}
    >
      <div className="relative flex-[1_1_480px]">
        <img
          src={props.image}
          alt={props.alt}
          className="h-[400px] w-full rounded-[28px] object-cover shadow-[0_24px_48px_rgba(22,58,44,.14)]"
        />
        <span className="absolute left-5 top-5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-forest">
          {props.chips[0]}
        </span>
        <span className="absolute bottom-6 right-5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-forest">
          {props.chips[1]}
        </span>
      </div>
      <div className="flex flex-[1_1_420px] flex-col gap-4">
        <span className="text-[13px] font-semibold uppercase tracking-[1.4px] text-gold">{props.kicker}</span>
        <h2 className="text-4xl font-semibold leading-[1.12] md:text-[42px]">{props.title}</h2>
        <p className="text-[17px] leading-[1.7] text-muted">{props.body}</p>
      </div>
    </div>
  );
}

function NotifyForm() {
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  return (
    <form
      className="mt-2 flex flex-wrap gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setState('sending');
        try {
          await api.notify(phone, 'deals');
          setState('done');
        } catch {
          setState('error');
        }
      }}
    >
      <label className="sr-only" htmlFor="notify-phone">
        WhatsApp number
      </label>
      <input
        id="notify-phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="03xx xxxxxxx"
        inputMode="tel"
        className="h-[52px] w-56 rounded-full bg-white/10 px-5 text-white placeholder:text-white/60 outline-none ring-1 ring-white/25"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="h-[52px] rounded-full bg-cream-btn px-6 font-bold text-forest-deep"
      >
        {state === 'done' ? 'You’re on the list ✓' : 'Notify me'}
      </button>
      {state === 'error' && (
        <span className="w-full text-sm text-[#F3B8A0]">Enter a valid mobile number, e.g. 03001234567</span>
      )}
    </form>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { CategoryShowcase } from '../components/CategoryShowcase';
import { CutoffCountdown } from '../components/CutoffCountdown';
import { HeroSlideshow } from '../components/HeroSlideshow';
import { Deals, Feature, HowItWorks, InstagramStrip, SectionHeading } from '../components/HomeSections';
import { IconCheck } from '../components/icons';
import { ProductCard } from '../components/ProductCard';
import { Reveal } from '../components/Reveal';
import { q } from '../lib/api';
import { useSearch } from '../lib/search';
import { TRUST_POINTS } from '../lib/site';
import { useStoreInfo } from '../lib/store-info';

export function HomePage() {
  const settings = useQuery(q.settings());
  const categories = useQuery(q.categories());
  const products = useQuery(q.products());
  const info = useStoreInfo();
  const [filter, setFilter] = useState<string>('all');

  const filters = useMemo(() => {
    const used = new Set(products.data?.map((p) => p.categorySlug));
    return [{ slug: 'all', name: 'All' }, ...(categories.data ?? []).filter((c) => used.has(c.slug))];
  }, [categories.data, products.data]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products.data ?? []) m.set(p.categorySlug, (m.get(p.categorySlug) ?? 0) + 1);
    return m;
  }, [products.data]);
  const query = useSearch((st) => st.query);
  const setQuery = useSearch((st) => st.setQuery);
  const needle = query.trim().toLowerCase();
  const visible = (products.data ?? []).filter(
    (p) =>
      (filter === 'all' || p.categorySlug === filter) &&
      (!needle || `${p.name} ${p.shortDescription}`.toLowerCase().includes(needle)),
  );
  const trust = TRUST_POINTS.map((t) =>
    t.title === 'Next-day delivery' ? { ...t, body: `Order by ${info.cutoff}, get it by ${info.by}` } : t,
  );
  const pickCategory = (slug: string) => {
    setFilter(slug);
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest">
        <HeroSlideshow />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="hero-stagger flex min-h-[540px] flex-col justify-center gap-5 py-12 text-white md:w-[46%] md:pr-8">
            <span className="text-[13.5px] font-semibold tracking-[1.6px] text-sage uppercase">
              Your meal, simplified
            </span>
            <h1 className="text-5xl leading-[1.02] font-semibold tracking-[-1.2px] md:text-[66px]">
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
                className="group inline-flex h-[54px] items-center gap-2 rounded-full bg-cream-btn px-7 font-bold text-forest-deep shadow-[0_10px_30px_-10px_rgba(0,0,0,.4)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Shop tomorrow's menu
                <span className="transition group-hover:translate-x-1">→</span>
              </a>
              <a
                href={`https://wa.me/${info.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-[54px] items-center rounded-full border-[1.5px] border-white/45 px-6 font-semibold transition hover:border-white hover:bg-white/10"
              >
                Order on WhatsApp
              </a>
            </div>
            <div className="mt-2">
              {settings.data &&
                (settings.data.ordersPaused ? (
                  <div className="max-w-[470px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-[15px] backdrop-blur">
                    <strong className="text-sage">Ordering is paused.</strong> {settings.data.pauseMessage}
                  </div>
                ) : (
                  <CutoffCountdown msUntilCutoff={settings.data.msUntilCutoff} />
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((t, i) => (
            <Reveal key={t.title} delay={i * 90} className="flex items-center gap-3">
              <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-sage-soft text-forest">
                <IconCheck />
              </span>
              <span className="flex flex-col leading-snug">
                <strong className="text-[15px] font-semibold">{t.title}</strong>
                <span className="text-[13px] text-muted">{t.body}</span>
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Categories — bento grid of photo cards */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-24 px-6 pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            kicker="Fresh every morning"
            title="Shop by category"
            sub="Everything prepped, washed and ready for the pan"
          />
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="animate-rise rounded-full border border-[#DDD6C7] bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest"
            >
              Show all categories
            </button>
          )}
        </div>
        <CategoryShowcase
          categories={categories.data ?? []}
          counts={counts}
          active={filter}
          onPick={pickCategory}
        />
      </section>

      {/* Products */}
      <section id="menu" className="mx-auto max-w-7xl scroll-mt-24 px-6 pt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            kicker={`Order by ${info.cutoff} tonight`}
            title="Tomorrow's menu"
            sub="Prepared fresh the morning of delivery"
          />
          <div className="-mx-6 flex max-w-[calc(100%+3rem)] gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:max-w-full md:flex-wrap md:px-0">
            {filters.map((f) => (
              <button
                key={f.slug}
                type="button"
                onClick={() => setFilter(f.slug)}
                className={`h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition active:scale-95 ${
                  filter === f.slug
                    ? 'border-forest bg-forest text-white shadow-[0_6px_16px_-6px_rgba(31,77,58,.6)]'
                    : 'border-[#DDD6C7] bg-white hover:border-forest hover:text-forest'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
        {needle && (
          <div className="mb-5 flex animate-rise flex-wrap items-center gap-3 rounded-2xl bg-sage-soft px-4 py-3 text-[15px]">
            <span>
              {visible.length} result{visible.length === 1 ? '' : 's'} for <strong>“{query.trim()}”</strong>
            </span>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="ml-auto font-semibold text-forest underline underline-offset-2"
            >
              Clear search
            </button>
          </div>
        )}
        {products.isLoading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(282px,1fr))] gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[380px] animate-pulse rounded-[22px] bg-sand" />
            ))}
          </div>
        )}
        {!products.isLoading && visible.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#DDD6C7] bg-white px-6 py-14 text-center">
            <p className="font-display text-2xl font-semibold">Nothing here yet</p>
            <p className="mt-1 text-muted">
              {needle
                ? 'Try another word, or ask us on WhatsApp — we prep to order.'
                : 'Check back soon for this category.'}
            </p>
          </div>
        )}
        {products.isError && <p className="text-terra">Could not load the menu. Please refresh.</p>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(282px,1fr))] gap-6">
          {visible.map((p, i) => (
            <Reveal key={`${filter}-${p.id}`} delay={(i % 4) * 80}>
              <ProductCard p={p} />
            </Reveal>
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
          body={`Order before ${info.cutoff}. Your items are prepared the next morning and reach your door by ${info.by}. Pay the rider in cash.`}
          chips={[`Order by ${info.cutoff}`, `At your door by ${info.by}`]}
        />
      </section>

      <HowItWorks />
      <Deals />
      <InstagramStrip />
    </>
  );
}

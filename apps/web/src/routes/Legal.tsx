import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { IconWhatsApp } from '../components/icons';
import { Reveal } from '../components/Reveal';
import { LEGAL_UPDATED, type LegalSlug, legalPages } from '../lib/legal';
import { formatWhatsapp } from '../lib/site';
import { useStoreInfo } from '../lib/store-info';

/** One template for all policy pages: /delivery, /refunds, /privacy, /terms. */
export function LegalPage({ slug }: { slug: LegalSlug }) {
  const info = useStoreInfo();
  const pages = legalPages({ ...info, whatsappDisplay: formatWhatsapp(info.whatsapp) });
  const page = pages.find((p) => p.slug === slug);
  const [active, setActive] = useState(page?.sections[0]?.id ?? '');

  useEffect(() => {
    const previous = document.title;
    document.title = `${page?.title ?? 'Policies'} — Preppal`;
    return () => {
      document.title = previous;
    };
  }, [page?.title]);

  // Highlight the section currently in view in the table of contents.
  useEffect(() => {
    if (!page || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );
    for (const s of page.sections) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [page]);

  if (!page) return null;

  return (
    <>
      <section className="relative overflow-hidden bg-sand">
        <div className="hero-stagger mx-auto max-w-5xl px-6 pt-12 pb-10">
          <span className="text-[13px] font-semibold tracking-[1.4px] text-gold uppercase">Policies</span>
          <h1 className="mt-2 text-[40px] leading-tight font-semibold md:text-[52px]">{page.title}</h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted">{page.intro}</p>
          <p className="mt-3 text-sm text-muted">Last updated {LEGAL_UPDATED}</p>
          <nav
            aria-label="Policies"
            className="-mx-6 mt-7 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:px-0"
          >
            {pages.map((p) => (
              <Link
                key={p.slug}
                to={p.path}
                className={`h-10 shrink-0 rounded-full border px-4 text-sm leading-10 font-semibold transition ${
                  p.slug === slug
                    ? 'border-forest bg-forest text-white shadow-[0_6px_16px_-6px_rgba(31,77,58,.6)]'
                    : 'border-[#DDD6C7] bg-white hover:border-forest hover:text-forest'
                }`}
              >
                {p.nav}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <div className="mb-3 text-xs font-bold tracking-[1.2px] text-muted uppercase">On this page</div>
            <ul className="flex flex-col gap-1 border-l-2 border-line">
              {page.sections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                    className={`-ml-0.5 border-l-2 py-1.5 pl-4 text-left text-sm transition ${
                      active === s.id
                        ? 'border-forest font-semibold text-forest'
                        : 'border-transparent text-muted hover:text-ink'
                    }`}
                  >
                    {s.heading}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="flex min-w-0 flex-col gap-4">
          {page.sections.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i, 3) * 60}>
              <section
                id={s.id}
                className="scroll-mt-28 rounded-[22px] border border-line bg-white p-6 md:p-7"
              >
                <h2 className="flex items-center gap-3 text-[24px] font-semibold">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage-soft font-sans text-sm font-bold text-forest">
                    {i + 1}
                  </span>
                  {s.heading}
                </h2>
                <div className="mt-3 flex flex-col gap-3 text-[16px] leading-relaxed text-[#3E4B43]">
                  {s.body.map((b, j) =>
                    Array.isArray(b) ? (
                      <ul key={`${s.id}-${j}`} className="flex flex-col gap-2">
                        {b.map((li) => (
                          <li key={li} className="flex gap-3">
                            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                            <span>{li}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p key={`${s.id}-${j}`}>{b}</p>
                    ),
                  )}
                </div>
              </section>
            </Reveal>
          ))}

          <Reveal from="scale">
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-forest-deep p-6 text-white md:p-7">
              <div>
                <div className="font-display text-2xl font-semibold">Still have a question?</div>
                <p className="mt-1 text-[#D7E2D6]">Message us on WhatsApp and we’ll help.</p>
              </div>
              <a
                href={`https://wa.me/${info.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-bold text-white transition hover:-translate-y-0.5"
              >
                <IconWhatsApp width={20} height={20} /> Message us
              </a>
            </div>
          </Reveal>
        </article>
      </div>
    </>
  );
}

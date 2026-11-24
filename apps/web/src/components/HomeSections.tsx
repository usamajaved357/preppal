import { useState } from 'react';
import { api } from '../lib/api';
import { INSTAGRAM_TILES, stepsFor } from '../lib/site';
import { useStoreInfo } from '../lib/store-info';
import { Reveal } from './Reveal';

/** Small gold kicker + display heading + subline, revealed on scroll. */
export function SectionHeading({
  kicker,
  title,
  sub,
  center,
}: {
  kicker: string;
  title: string;
  sub?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={center ? 'text-center' : ''}>
      <span className="text-[13px] font-semibold tracking-[1.4px] text-gold uppercase">{kicker}</span>
      <h2 className="mt-1.5 text-[34px] leading-tight font-semibold md:text-4xl">{title}</h2>
      {sub && <p className="mt-1.5 text-muted">{sub}</p>}
    </Reveal>
  );
}

export function Feature(props: {
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
      <Reveal from={props.reverse ? 'right' : 'left'} className="relative flex-[1_1_480px]">
        <div className="group overflow-hidden rounded-[28px] shadow-[0_24px_48px_rgba(22,58,44,.14)]">
          <img
            src={props.image}
            alt={props.alt}
            loading="lazy"
            className="h-[400px] w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-105"
          />
        </div>
        <span className="absolute top-5 left-5 animate-float rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-forest shadow-lg">
          {props.chips[0]}
        </span>
        <span className="absolute right-5 bottom-6 animate-float rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-forest shadow-lg [animation-delay:-3s]">
          {props.chips[1]}
        </span>
      </Reveal>
      <Reveal delay={120} className="flex flex-[1_1_420px] flex-col gap-4">
        <span className="text-[13px] font-semibold tracking-[1.4px] text-gold uppercase">{props.kicker}</span>
        <h2 className="text-4xl leading-[1.12] font-semibold md:text-[42px]">{props.title}</h2>
        <p className="text-[17px] leading-[1.7] text-muted">{props.body}</p>
      </Reveal>
    </div>
  );
}

/** Three steps joined by a dashed line on wide screens. */
export function HowItWorks() {
  const info = useStoreInfo();
  return (
    <section className="mt-24 bg-sand">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading center kicker="Simple as 1-2-3" title="How Preppal works" />
        <div className="relative mt-10 grid gap-10 md:grid-cols-3">
          <div
            aria-hidden
            className="absolute top-[60px] right-[16%] left-[16%] hidden border-t-2 border-dashed border-[#D9CFBD] md:block"
          />
          {stepsFor(info).map((s, i) => (
            <Reveal
              key={s.title}
              delay={i * 140}
              className="relative flex flex-col items-center gap-3 text-center"
            >
              <span className="relative">
                <img
                  src={s.image}
                  alt=""
                  loading="lazy"
                  className="h-[120px] w-[120px] rounded-full border-4 border-white object-cover shadow-md transition duration-500 hover:scale-105"
                />
                <span className="absolute -right-1 -bottom-1 grid h-9 w-9 place-items-center rounded-full bg-forest font-display text-base font-bold text-white shadow-md ring-4 ring-sand">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-2 text-[23px] font-semibold">{s.title}</h3>
              <p className="max-w-[300px] leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Deals() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-20">
      <Reveal
        from="scale"
        className="flex flex-wrap overflow-hidden rounded-[28px] bg-forest-deep shadow-[0_30px_60px_-30px_rgba(22,58,44,.6)]"
      >
        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-3.5 p-8 text-white md:p-12">
          <span className="self-start rounded-full bg-terra px-3 py-1.5 text-xs font-semibold">
            Seasonal deals
          </span>
          <h2 className="text-4xl leading-tight font-semibold md:text-[42px]">
            Iftari se sehri tak — your favourite deal, prepped.
          </h2>
          <p className="leading-relaxed text-[#D7E2D6]">
            Ramazan and Eid bundles, made in limited numbers each day. Get a WhatsApp message when the next
            one opens.
          </p>
          <NotifyForm />
        </div>
        {/* Fixed-size frame so the photo's natural size can't stretch the card. */}
        <div className="group relative min-h-[280px] min-w-0 flex-[1_1_380px] overflow-hidden">
          <img
            src="/images/site/spread.jpg"
            alt="A table of small dishes for iftar"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/40 to-transparent" />
        </div>
      </Reveal>
    </section>
  );
}

export function InstagramStrip() {
  const { instagram } = useStoreInfo();
  return (
    <section className="mx-auto max-w-7xl px-6 pt-20">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          kicker="@ the kitchen"
          title="From the Preppal kitchen"
          sub="Recipes, new items and deals on Instagram"
        />
        <a
          href={`https://instagram.com/${instagram}`}
          target="_blank"
          rel="noreferrer"
          className="group font-semibold text-forest"
        >
          Follow @{instagram} <span className="inline-block transition group-hover:translate-x-1">→</span>
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {INSTAGRAM_TILES.map((src, i) => (
          <Reveal key={src} delay={i * 80} from="scale">
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-[18px]"
              aria-label="Open Preppal on Instagram"
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <span className="absolute inset-0 bg-forest-deep/0 transition group-hover:bg-forest-deep/25" />
            </a>
          </Reveal>
        ))}
      </div>
    </section>
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
        className="h-[52px] w-56 rounded-full bg-white/10 px-5 text-white ring-1 ring-white/25 outline-none placeholder:text-white/60 focus:ring-2 focus:ring-sage"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="h-[52px] rounded-full bg-cream-btn px-6 font-bold text-forest-deep transition hover:bg-white active:scale-95"
      >
        {state === 'done' ? (
          <span className="inline-block animate-pop">You’re on the list ✓</span>
        ) : (
          'Notify me'
        )}
      </button>
      {state === 'error' && (
        <span className="w-full text-sm text-[#F3B8A0]">Enter a valid mobile number, e.g. 03001234567</span>
      )}
    </form>
  );
}

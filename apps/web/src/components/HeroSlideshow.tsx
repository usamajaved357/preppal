import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { HERO_SLIDES } from '../lib/site';
import { IconChevronDown } from './icons';

const INTERVAL = 3500; // ms each photo stays up
const FADE = 800; // ms crossfade
const MOTIONS = ['kb-in', 'kb-left', 'kb-out', 'kb-right'] as const;

/**
 * Hero photo slideshow: crossfade + a different camera move per photo, story-style progress bars,
 * prev/next, swipe on touch. Pauses on hover and while the tab is hidden. Only the previous, current
 * and next photos are mounted so phones don't download all of them up front.
 */
export function HeroSlideshow() {
  const n = HERO_SLIDES.length;
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0); // bumps on every change so animations restart
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (to: number) => {
    const next = (to + n) % n;
    if (next === idx) return;
    setPrev(idx);
    setIdx(next);
    setCycle((c) => c + 1);
  };

  // Auto-advance. Re-armed on every change, so manual navigation restarts the timer and the progress bar together.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `go` reads idx; cycle is the restart signal.
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(idx + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [idx, cycle, paused]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const mounted = new Set([idx, (idx + 1) % n, ...(prev === null ? [] : [prev])]);
  const current = HERO_SLIDES[idx];
  if (!current) return null;

  return (
    <section
      aria-label="Featured dishes"
      aria-roledescription="carousel"
      className="relative h-[380px] w-full overflow-hidden bg-forest-deep md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[54%]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start == null || end == null || Math.abs(end - start) < 40) return;
        go(end < start ? idx + 1 : idx - 1);
      }}
    >
      {HERO_SLIDES.map((s, i) =>
        mounted.has(i) ? (
          <div
            key={s.src}
            aria-hidden={i !== idx}
            className="absolute inset-0 overflow-hidden transition-opacity ease-out"
            style={{ opacity: i === idx ? 1 : 0, transitionDuration: `${FADE}ms`, zIndex: i === idx ? 2 : 1 }}
          >
            <img
              key={i === idx ? `on-${cycle}` : `off-${i}`}
              src={s.src}
              srcSet={s.srcSet}
              sizes="(min-width: 768px) 54vw, 100vw"
              alt={s.alt}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              className={`h-full w-full object-cover ${i === idx ? MOTIONS[i % MOTIONS.length] : ''}`}
              style={{ '--kb': `${INTERVAL + FADE + 600}ms` } as CSSProperties}
            />
          </div>
        ) : null,
      )}

      {/* Blend into the green copy panel, plus a soft floor for the caption. */}
      <div className="pointer-events-none absolute inset-0 z-[3] hidden bg-[linear-gradient(90deg,#1F4D3A_0%,rgba(31,77,58,.55)_14%,rgba(31,77,58,0)_38%)] md:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-44 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      {/* Progress bars + counter */}
      <div className="absolute inset-x-4 top-4 z-[4] flex items-center gap-3 md:top-6 md:right-7 md:left-[14%]">
        <div className="flex flex-1 gap-1.5">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Show photo ${i + 1}: ${s.caption}`}
              aria-current={i === idx}
              onClick={() => go(i)}
              className="group h-4 flex-1 py-1.5"
            >
              <span className="block h-1 overflow-hidden rounded-full bg-white/30 transition group-hover:bg-white/50">
                <span
                  key={i === idx ? `p-${cycle}` : `s-${i}`}
                  className={`block h-full rounded-full bg-white ${i === idx ? 'slide-progress' : ''}`}
                  style={
                    {
                      '--dur': `${INTERVAL}ms`,
                      transform: i < idx ? 'scaleX(1)' : i > idx ? 'scaleX(0)' : undefined,
                      transformOrigin: 'left',
                      animationPlayState: paused ? 'paused' : 'running',
                    } as CSSProperties
                  }
                />
              </span>
            </button>
          ))}
        </div>
        <span className="font-display text-sm font-semibold text-white/90 tabular-nums">
          {String(idx + 1).padStart(2, '0')}
          <span className="text-white/50"> / {String(n).padStart(2, '0')}</span>
        </span>
      </div>

      {/* Caption + arrows */}
      <div className="absolute inset-x-4 bottom-5 z-[4] flex items-end justify-between gap-3 md:right-7 md:bottom-8 md:left-[14%]">
        <div key={`c-${cycle}`} className="caption-in max-w-[80%]">
          <span className="mb-2 inline-block rounded-full bg-sage px-2.5 py-1 text-[11px] font-bold tracking-[1.2px] text-forest-deep uppercase">
            {current.tag}
          </span>
          <p className="font-display text-[22px] leading-tight font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,.45)] md:text-[28px]">
            {current.caption}
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 md:flex">
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(idx - 1)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white/25"
          >
            <IconChevronDown className="rotate-90" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(idx + 1)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white/25"
          >
            <IconChevronDown className="-rotate-90" />
          </button>
        </div>
      </div>
    </section>
  );
}

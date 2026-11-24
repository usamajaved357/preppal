import { useEffect, useState } from 'react';
import { HERO_SLIDES } from '../lib/site';

/** Crossfading photo slideshow with a slow Ken Burns zoom. Pauses on hover. */
export function HeroSlideshow() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [paused]);
  const current = HERO_SLIDES[idx] ?? HERO_SLIDES[0];

  return (
    <section
      aria-label="Featured products"
      className="relative h-[340px] w-full overflow-hidden md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[54%]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {HERO_SLIDES.map((s, i) => (
        <div
          key={s.image}
          className="absolute inset-0 overflow-hidden transition-opacity duration-[1100ms]"
          style={{ opacity: i === idx ? 1 : 0 }}
          aria-hidden={i !== idx}
        >
          <img src={s.image} alt={s.alt} className="h-full w-full animate-kenburns object-cover" />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#1F4D3A_0%,rgba(31,77,58,.55)_14%,rgba(31,77,58,0)_38%)] md:block" />
      <div className="absolute inset-x-4 bottom-5 flex flex-wrap items-center justify-between gap-3 md:left-[12%] md:right-7 md:bottom-7">
        <span className="rounded-full bg-white/95 px-4 py-2.5 text-sm font-semibold text-ink shadow-lg">
          {current.caption}
        </span>
        <div className="flex items-center gap-2">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.image}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === idx}
              onClick={() => setIdx(i)}
              className="h-2 rounded-full transition-all"
              style={{ width: i === idx ? 28 : 8, background: i === idx ? '#fff' : 'rgba(255,255,255,.5)' }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

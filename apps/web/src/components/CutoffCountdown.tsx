import { useEffect, useState } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');

/** Counts down to tonight's order cutoff. `msUntilCutoff` comes from GET /api/settings. */
export function CutoffCountdown({
  msUntilCutoff,
  variant = 'dark',
}: {
  msUntilCutoff: number;
  variant?: 'dark' | 'light';
}) {
  const [deadline] = useState(() => Date.now() + msUntilCutoff);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const s = Math.max(0, Math.floor((deadline - now) / 1000));
  const parts = [
    { v: pad(Math.floor(s / 3600)), u: 'hrs' },
    { v: pad(Math.floor((s % 3600) / 60)), u: 'mins' },
    { v: pad(s % 60), u: 'secs' },
  ];
  const wrap =
    variant === 'dark'
      ? 'bg-white/8 border border-white/15 text-[#D7E2D6]'
      : 'bg-white border border-line text-muted';

  if (s === 0) {
    return (
      <div className={`inline-flex rounded-2xl px-4 py-3 text-sm ${wrap}`}>
        Today's orders are closed — order now for the day after tomorrow.
      </div>
    );
  }
  return (
    <div className={`inline-flex items-center gap-3.5 rounded-2xl py-2.5 pl-4 pr-3 ${wrap}`}>
      <span className="text-[13.5px] leading-snug">
        Orders for tomorrow
        <br />
        close in
      </span>
      <div className="flex gap-1.5" role="timer" aria-label="Time left to order for tomorrow">
        {parts.map((p) => (
          <div key={p.u} className="flex w-[54px] flex-col items-center rounded-[10px] bg-white py-1.5">
            <span className="font-display text-[21px] font-bold leading-none text-forest">{p.v}</span>
            <span className="text-[10.5px] text-muted">{p.u}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { type CSSProperties, type ElementType, type ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Fades/slides its children in the first time they scroll into view.
 * `delay` (ms) staggers items in a list; `from` picks the direction. Respects reduced motion via CSS.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  from = 'up',
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  from?: 'up' | 'left' | 'right' | 'scale';
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      data-from={from}
      style={{ '--d': `${delay}ms` } as CSSProperties}
      className={`reveal ${shown ? 'is-in' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}

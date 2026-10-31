'use client';
/** Large figures. Each one is a fixed value or a live count of a collection. */
import { useItemsMap } from '@/lib/store';
import { cx } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';

const SIZES = { md: 'text-[2.2rem]', lg: 'text-[2.8rem] md:text-[3.4rem]', xl: 'text-[3.4rem] md:text-[4.4rem]' };

/** Counts up to the figure once it scrolls into view. Non-numeric values show as typed. */
function CountUp({ value }) {
  const text = String(value ?? '');
  const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(text);
  const ref = useRef(null);
  const [shown, setShown] = useState(text);
  const done = useRef(false);
  useEffect(() => setShown(text), [text]);
  useEffect(() => {
    if (done.current || !m || !ref.current || typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const target = Number(m[2]);
    const decimals = (m[2].split('.')[1] || '').length;
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      done.current = true;
      const start = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - start) / 1100);
        const eased = 1 - (1 - k) ** 3;
        setShown(`${m[1]}${(target * eased).toFixed(decimals)}${m[3]}`);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      setShown(`${m[1]}${(0).toFixed(decimals)}${m[3]}`);
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return <span ref={ref}>{shown}</span>;
}

export default function StatsSection({ section }) {
  const p = section.props;
  const items = useItemsMap();
  const stats = useMemo(
    () =>
      (p.items || []).map((s) => {
        if (!s.source) return s;
        const count = Object.values(items).filter(
          (it) =>
            it.collection === s.source &&
            !it.hidden &&
            (!s.filterField || String(it[s.filterField] ?? '').toLowerCase() === String(s.filterValue ?? '').toLowerCase())
        ).length;
        return { ...s, value: String(count) };
      }),
    [p.items, items]
  );
  if (!stats.length) return null;
  return (
    <dl className={cx('grid grid-cols-2 gap-y-8 md:flex md:flex-wrap', p.align === 'center' && 'text-center md:justify-center')}>
      {stats.map((s, i) => (
        <div key={`${s.label}-${i}`} className={cx('px-0 md:min-w-[10rem] md:flex-1 md:px-8 md:first:pl-0', p.dividers && i > 0 && 'md:border-l md:border-line', p.align === 'center' && 'md:first:pl-8')}>
          <dd className={cx('font-heading font-medium leading-none tabular-nums text-ink', SIZES[p.size] || SIZES.lg)}>
            <CountUp value={s.value} />
            {s.suffix && <span className="ml-1 text-[0.5em] text-accent">{s.suffix}</span>}
          </dd>
          <dt className="mt-2 text-[0.92rem] text-ink2">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}

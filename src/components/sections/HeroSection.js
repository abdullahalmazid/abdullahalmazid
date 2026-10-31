'use client';
/**
 * Introduction band. Fills `height`% of the window (80 by default) with the
 * photo in a column of `imageWidth`% (a third by default) and the name,
 * titles, short bio and buttons beside it.
 */
import ActionButton from '@/components/ui/ActionButton';
import Icon from '@/components/ui/Icon';
import Markdown from '@/components/ui/Markdown';
import SafeImage from '@/components/ui/SafeImage';
import Waveform from '@/components/ui/Waveform';
import { useConfig } from '@/lib/store';
import { cx, toTags } from '@/lib/utils';
import { useEffect, useState } from 'react';

const NAME_SIZES = {
  md: 'text-[2.3rem] md:text-[3.2rem]',
  lg: 'text-[2.6rem] md:text-[4.1rem]',
  xl: 'text-[3rem] md:text-[5rem]',
};

function Decoration({ type }) {
  if (type === 'waveform') {
    return <Waveform className="pointer-events-none absolute inset-x-0 -bottom-6 -z-10 h-[88px] w-full md:-bottom-10 md:h-[120px]" />;
  }
  if (type === 'grid' || type === 'dots') {
    const bg =
      type === 'grid'
        ? 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)'
        : 'radial-gradient(var(--border) 1.2px, transparent 1.2px)';
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        style={{ backgroundImage: bg, backgroundSize: type === 'grid' ? '48px 48px' : '22px 22px' }}
      />
    );
  }
  return null;
}

/** Cycles through the titles with a typewriter effect. Static for reduced motion. */
function TypedRoles({ roles }) {
  const [state, setState] = useState({ i: 0, n: 0, del: false });
  const [still, setStill] = useState(false);
  useEffect(() => {
    setStill(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }, []);
  useEffect(() => {
    if (still || roles.length < 2) return undefined;
    const word = roles[state.i % roles.length];
    let delay = state.del ? 28 : 55;
    if (!state.del && state.n === word.length) delay = 1900;
    if (state.del && state.n === 0) delay = 300;
    const t = setTimeout(() => {
      setState((s) => {
        const w = roles[s.i % roles.length];
        if (!s.del && s.n === w.length) return { ...s, del: true };
        if (s.del && s.n === 0) return { i: s.i + 1, n: 0, del: false };
        return { ...s, n: s.n + (s.del ? -1 : 1) };
      });
    }, delay);
    return () => clearTimeout(t);
  }, [state, still, roles]);

  if (still || roles.length < 2) {
    return <p className="mt-5 text-[1.15rem] font-medium text-ink">{roles.join(' · ')}</p>;
  }
  const word = roles[state.i % roles.length];
  return (
    <p className="mt-5 min-h-[1.8em] font-mono text-[1.02rem] text-ink md:text-[1.12rem]">
      <span className="sr-only">{roles.join(', ')}</span>
      <span aria-hidden="true">
        <span className="text-accent">&gt;</span> {word.slice(0, state.n)}
        <span className="ml-0.5 inline-block h-[1.1em] w-[0.55ch] translate-y-[0.18em] animate-pulse bg-accent" />
      </span>
    </p>
  );
}

export default function HeroSection({ section, inDrawer }) {
  const p = section.props;
  const config = useConfig();
  const roles = String(p.roles || '').split('\n').map((r) => r.trim()).filter(Boolean);
  const keywords = toTags(p.keywords);
  const imageRight = p.imageSide === 'right';
  const imgW = Math.min(50, Math.max(20, Number(p.imageWidth) || 33));
  const align = { start: 'md:items-start', center: 'md:items-center', end: 'md:items-end' }[p.verticalAlign] || 'md:items-center';

  return (
    <div
      className={cx('relative flex flex-col justify-center', p.decoration === 'waveform' && 'pb-20 md:pb-28')}
      style={{ minHeight: inDrawer ? undefined : `calc(${Number(p.height) || 80}svh - var(--nav-h) - 96px)` }}
    >
      <Decoration type={p.decoration} />
      <style
        dangerouslySetInnerHTML={{
          __html: `[data-section="${section.id}"] .hero-grid{grid-template-columns:minmax(0,1fr)}@media(min-width:768px){[data-section="${section.id}"] .hero-grid{grid-template-columns:${imageRight ? `minmax(0,1fr) ${imgW}%` : `${imgW}% minmax(0,1fr)`}}}`,
        }}
      />
      <div className={cx('hero-grid grid gap-10 md:gap-16', align)}>
        <div className={cx('relative mx-auto w-full max-w-[230px] sm:max-w-[280px] md:max-w-none', imageRight && 'md:order-2')}>
          <div
            className={cx('pointer-events-none absolute inset-0 translate-x-3 translate-y-3 border border-accent/60', `shape-${p.imageShape}`)}
            aria-hidden="true"
          />
          <SafeImage
            src={p.image || config.person?.photo}
            alt={p.imageAlt || p.name}
            fallbackText={p.name}
            width={900}
            className={cx('relative aspect-[4/5] w-full object-cover', `shape-${p.imageShape}`, p.imageShape === 'circle' && '!aspect-square')}
          />
        </div>

        <div className={cx('min-w-0', imageRight && 'md:order-1')}>
          {p.eyebrow && <p className="mb-3 text-[0.98rem] font-medium text-accent">{p.eyebrow}</p>}
          <h1 className={cx('font-heading font-medium leading-[1.02] tracking-[-0.02em] text-ink', NAME_SIZES[p.nameSize] || NAME_SIZES.lg)}>
            {p.name}
          </h1>

          {p.typed && roles.length > 0 && <TypedRoles roles={roles} />}
          {!p.typed && roles.length > 0 && (
            <ul className="mt-5 space-y-1">
              {roles.map((r, i) => (
                <li key={r} className={cx(i === 0 ? 'text-[1.15rem] font-medium text-ink' : 'text-[1rem] text-ink2')}>
                  {r}
                </li>
              ))}
            </ul>
          )}

          {p.bio && <Markdown className="mt-6 max-w-[58ch] text-[1.06rem]">{p.bio}</Markdown>}

          {p.buttons?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {p.buttons.map((b, i) => (
                <ActionButton key={`${b.label}-${i}`} {...b} />
              ))}
            </div>
          )}

          {p.showKeywords && keywords.length > 0 && (
            <p className="mt-8 max-w-[62ch] text-[0.92rem] leading-relaxed text-muted">
              {keywords.join(', ')}
            </p>
          )}

          {p.showSocials && (config.socials || []).length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {config.socials.map((s) => (
                <li key={s.label + s.url}>
                  <a
                    href={s.url}
                    target={s.url?.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/70 px-3 py-1.5 text-[0.85rem] text-ink2 transition-colors hover:border-accent hover:text-accent"
                  >
                    <Icon name={s.icon} size={14} />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

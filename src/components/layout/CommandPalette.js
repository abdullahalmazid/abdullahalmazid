'use client';
/**
 * ⌘K / Ctrl K command palette.
 *
 * Searches every tab and every entry in every collection (titles, subtitles,
 * tags, authors…) plus quick actions: switch light/dark, copy email, download
 * the CV, open the dashboard. Arrow keys move, Enter opens, Esc closes.
 * Other components open it with window.dispatchEvent(new Event('aam:palette')).
 */
import Icon from '@/components/ui/Icon';
import { useAdmin } from '@/context/AdminContext';
import { useDrawer } from '@/context/DrawerContext';
import { setColorChoice } from '@/lib/colorMode';
import { tabHref } from '@/lib/links';
import { readItem } from '@/lib/roles';
import { navIconFor } from '@/lib/sections';
import { useConfig, useItemsMap, usePages, useSchema } from '@/lib/store';
import { cx } from '@/lib/utils';
import { CornerDownLeft, Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export const openPalette = () => window.dispatchEvent(new Event('aam:palette'));

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Every query word must appear; earlier and title matches rank higher. */
function score(entry, words) {
  if (!words.length) return 1;
  let total = 0;
  for (const w of words) {
    const t = entry.titleN.indexOf(w);
    if (t >= 0) total += 10 - Math.min(t, 8) + (entry.titleN.startsWith(w) ? 6 : 0);
    else if (entry.textN.includes(w)) total += 2;
    else return 0;
  }
  return total + (entry.boost || 0);
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname() || '/';
  const drawer = useDrawer();
  const pages = usePages();
  const items = useItemsMap();
  const schema = useSchema();
  const config = useConfig();
  const { user } = useAdmin();

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('aam:palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('aam:palette', onOpen);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const entries = useMemo(() => {
    if (!open) return [];
    const out = [];
    const email = config.contact?.email;
    const actions = [
      { id: 'a-light', title: 'Switch to light mode', icon: 'Sun', run: () => setColorChoice('light'), show: config.theme?.visitorToggle },
      { id: 'a-dark', title: 'Switch to dark mode', icon: 'Moon', run: () => setColorChoice('dark'), show: config.theme?.visitorToggle },
      { id: 'a-email', title: `Copy email address${email ? ` (${email})` : ''}`, icon: 'Mail', show: Boolean(email), run: () => navigator.clipboard?.writeText(email).then(() => toast.success('Email copied'), () => toast.error('Copy blocked')) },
      { id: 'a-cv', title: 'CV: view and download as PDF', icon: 'Download', show: true, run: () => router.push('/cv') },
      { id: 'a-rss', title: 'RSS feed', icon: 'Rss', show: true, run: () => window.open('/rss.xml', '_blank', 'noopener') },
      { id: 'a-admin', title: user ? 'Open the dashboard' : 'Sign in to edit', icon: 'Settings', show: true, run: () => router.push(user ? '/admin' : '/login') },
    ];
    actions.filter((a) => a.show).forEach((a) => out.push({ ...a, group: 'Actions', titleN: norm(a.title), textN: norm(a.title), boost: -4 }));

    pages.forEach((p) =>
      out.push({
        id: `p-${p.id}`,
        group: 'Pages',
        title: p.title,
        sub: p.header?.subtitle || '',
        icon: navIconFor(p),
        titleN: norm(`${p.title} ${p.navLabel || ''}`),
        textN: norm(`${p.header?.subtitle || ''} ${p.seo?.description || ''}`),
        boost: 2,
        run: () => router.push(tabHref(p.id)),
      })
    );

    Object.values(items).forEach((it) => {
      if (it.hidden) return;
      const def = schema.collections?.[it.collection];
      if (!def) return;
      const r = readItem(it, def);
      out.push({
        id: `i-${it.id}`,
        group: def.label,
        title: r.title,
        sub: [r.subtitle, r.date].filter(Boolean).join(' · '),
        icon: def.icon,
        titleN: norm(r.title),
        textN: norm([r.subtitle, r.group, r.date, r.badge, ...r.tags, ...r.metas.map((m) => m.value), r.body.slice(0, 600)].join(' ')),
        run: () => drawer.openItem(it.id),
      });
    });
    return out;
  }, [open, pages, items, schema, config, router, drawer, user]);

  const results = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (!words.length) {
      // Empty query: pages first, then a few actions.
      return entries.filter((e) => e.group === 'Pages' || e.group === 'Actions');
    }
    return entries
      .map((e) => ({ e, s: score(e, words) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40)
      .map((x) => x.e);
  }, [entries, query]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (entry) => {
    if (!entry) return;
    close();
    // Opening an item from a full entry page should go back to a tab first.
    setTimeout(() => entry.run(), 0);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  if (!open) return null;

  // Group headers, preserving result order.
  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-3 pt-[12vh] backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && close()} role="presentation">
      <div role="dialog" aria-modal="true" aria-label="Search the site" className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-line bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,.5)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search projects, papers, skills, posts…"
            className="h-14 w-full bg-transparent text-[1rem] text-ink placeholder:text-muted focus:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `pal-${results[active].id}` : undefined}
          />
          <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[0.7rem] text-muted sm:block">Esc</kbd>
        </div>
        <ul id="palette-list" ref={listRef} role="listbox" className="max-h-[58vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-10 text-center text-ink2">Nothing matches “{query}”.</li>}
          {results.map((r, i) => {
            const header = r.group !== lastGroup ? r.group : '';
            lastGroup = r.group;
            return (
              <li key={r.id}>
                {header && <p className="px-3 pb-1 pt-3 text-[0.72rem] font-semibold uppercase tracking-wider text-muted">{header}</p>}
                <button
                  type="button"
                  id={`pal-${r.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => choose(r)}
                  className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left', i === active ? 'bg-accent-light' : 'hover:bg-bg2')}
                >
                  <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line', i === active ? 'text-accent' : 'text-ink2')}>
                    <Icon name={r.icon} size={16} fallback={<Icon name="FileText" size={16} />} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.95rem] text-ink">{r.title}</span>
                    {r.sub && <span className="block truncate text-[0.8rem] text-muted">{r.sub}</span>}
                  </span>
                  {i === active && <CornerDownLeft size={15} className="shrink-0 text-accent" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[0.75rem] text-muted">
          <span>↑ ↓ to move · Enter to open</span>
          <span>{pathname === '/' ? 'Tip: press / anywhere' : 'Ctrl K / ⌘K'}</span>
        </div>
      </div>
    </div>
  );
}

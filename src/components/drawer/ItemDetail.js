'use client';
/**
 * One content entry. Shown inside the side panel, and (with `standalone`) as
 * the entry's own page at /<route>/<id>.
 *
 * Long-form entries (collections with `article: true`, or bodies with three
 * or more headings) get a reading time and a table of contents. Collections
 * with `citation: true` get a cite box in APA, IEEE, plain and BibTeX.
 */
import Markdown from '@/components/ui/Markdown';
import SafeImage from '@/components/ui/SafeImage';
import { useAdmin } from '@/context/AdminContext';
import { useDrawer } from '@/context/DrawerContext';
import { readingMinutes, tableOfContents } from '@/lib/article';
import { absoluteUrl, itemHref } from '@/lib/links';
import { bibtex, CITE_STYLES, readItem } from '@/lib/roles';
import { useCollectionDef, useConfig, useItemsMap, useSchema, useStatus } from '@/lib/store';
import { cx } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight, Clock, Copy, Download, ExternalLink, Github, Link2, ListTree, Maximize2, Pencil, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

async function copyText(text, done = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
    return true;
  } catch {
    toast.error('Copying is blocked in this browser. Select the text instead.');
    return false;
  }
}

function downloadText(name, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const LINK_ICON = { github: Github, code: Github, video: PlayCircle };

function CiteBox({ item }) {
  const [style, setStyle] = useState('apa');
  const [copied, setCopied] = useState(false);
  const current = CITE_STYLES.find((s) => s.id === style) || CITE_STYLES[0];
  const text = current.format(item);
  return (
    <section className="mt-10 rounded-card border border-line bg-bg2 p-5" aria-labelledby="cite-h">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="cite-h" className="font-heading text-[1.15rem] font-medium text-ink">Cite this</h2>
        <div className="flex rounded-full border border-line bg-card p-0.5" role="tablist" aria-label="Citation style">
          {CITE_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={style === s.id}
              onClick={() => setStyle(s.id)}
              className={cx('rounded-full px-3 py-1 text-[0.8rem] font-medium transition-colors', style === s.id ? 'bg-accent text-accent-contrast' : 'text-ink2 hover:text-ink')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {current.mono ? (
        <pre className="overflow-x-auto rounded-lg bg-card p-4 font-mono text-[0.8rem] leading-relaxed text-ink">{text}</pre>
      ) : (
        <p className="select-all text-[0.95rem] leading-relaxed text-ink2">{text}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            if (await copyText(text, `${current.label} citation copied`)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }
          }}
          className="btn btn-outline !px-3 !py-1.5 text-[0.85rem]"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : `Copy ${current.label}`}
        </button>
        <button type="button" onClick={() => downloadText(`${item.id}.bib`, bibtex(item), 'application/x-bibtex')} className="btn btn-outline !px-3 !py-1.5 text-[0.85rem]">
          <Download size={14} /> .bib
        </button>
      </div>
    </section>
  );
}

function Toc({ toc, standalone }) {
  const [open, setOpen] = useState(standalone);
  if (toc.length < 3) return null;
  return (
    <nav aria-label="On this page" className={cx('rounded-card border border-line bg-card p-4', standalone && 'sticky top-24 mt-10')}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 text-left text-[0.85rem] font-semibold uppercase tracking-wide text-muted" aria-expanded={open}>
        <ListTree size={15} /> On this page
      </button>
      {open && (
        <ol className="mt-3 space-y-1.5 text-[0.92rem]">
          {toc.map((h) => (
            <li key={h.id} className={cx(h.level === 3 && 'pl-4')}>
              <a href={`#${h.id}`} className="text-ink2 hover:text-accent">
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}

export default function ItemDetail({ id, ids, fallback, standalone = false }) {
  const items = useItemsMap();
  const config = useConfig();
  const schema = useSchema();
  const status = useStatus();
  const item = items[id] || (status.source !== 'live' ? fallback?.item : null);
  const storeDef = useCollectionDef(item?.collection);
  const def = storeDef || fallback?.def;
  const drawer = useDrawer();
  const { canList, openItemEditor } = useAdmin();

  const r = item && def ? readItem(item, def) : null;
  const toc = useMemo(() => (r?.body ? tableOfContents(r.body) : []), [r?.body]);

  const related = useMemo(() => {
    if (!item || !def) return [];
    const mine = new Set((r?.tags || []).map((t) => t.toLowerCase()));
    if (!mine.size) return [];
    return Object.values(items)
      .filter((o) => o.id !== item.id && o.collection === item.collection && !o.hidden)
      .map((o) => ({ o, score: readItem(o, def).tags.filter((t) => mine.has(t.toLowerCase())).length }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.o);
  }, [items, item, def, r?.tags]);

  if (!item || !def) {
    const waiting = status.source !== 'live' && status.mode === 'live' && !status.error;
    return (
      <div className="px-6 py-20 text-center md:px-10">
        {waiting ? (
          <div className="mx-auto max-w-md space-y-3" aria-busy="true">
            <div className="mx-auto h-8 w-3/4 animate-pulse rounded bg-bg2" />
            <div className="mx-auto h-4 w-1/2 animate-pulse rounded bg-bg2" />
          </div>
        ) : (
          <>
            <h2 className="font-heading text-3xl text-ink">This entry is no longer available</h2>
            <p className="mt-2 text-ink2">It may have been removed or hidden.</p>
            {standalone && (
              <Link href="/" className="btn btn-outline mt-6">
                Go to the home page
              </Link>
            )}
          </>
        )}
      </div>
    );
  }

  const href = itemHref(item, schema);
  const article = def.article || toc.length >= 3;
  const pos = ids ? ids.indexOf(id) : -1;
  const prev = pos > 0 ? ids[pos - 1] : null;
  const next = pos >= 0 && pos < ids.length - 1 ? ids[pos + 1] : null;
  const go = (target) => drawer.replace({ type: 'item', id: target, ids });
  const highlight = config.person?.citeAs;
  const kicker = [def.singular, r.group, r.date].filter(Boolean);

  const body = (
    <>
      {r.body && <Markdown withAnchors className={cx('mt-8', article ? 'text-[1.08rem] md:text-[1.12rem]' : 'text-[1.05rem]')}>{r.body}</Markdown>}

      {r.tags.length > 0 && (
        <ul className="mt-8 flex flex-wrap gap-1.5" aria-label="Tags">
          {r.tags.map((t) => (
            <li key={t} className="rounded-full border border-line px-3 py-1 font-mono text-[0.78rem] text-ink2">
              {t}
            </li>
          ))}
        </ul>
      )}

      {def.citation && <CiteBox item={item} />}
    </>
  );

  const hasToc = toc.length >= 3;
  const head = (
      <div>
        <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.88rem] text-accent">
          <span>{kicker.join(' · ')}</span>
          {article && r.body && (
            <span className="inline-flex items-center gap-1 text-muted">
              <Clock size={14} /> {readingMinutes(r.body)} min read
            </span>
          )}
        </p>
        <h1 className="font-heading text-[2rem] font-semibold leading-[1.1] tracking-[-0.015em] text-ink md:text-[2.7rem]">{r.title}</h1>
        {r.subtitle && <p className="mt-4 text-[1.15rem] leading-relaxed text-ink2">{r.subtitle}</p>}
        {r.metas.length > 0 && (
          <ul className="mt-3 space-y-1 text-ink2">
            {r.metas.map((m) => (
              <li key={m.key}>
                {highlight && m.value.includes(highlight)
                  ? m.value.split(highlight).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && <strong className="font-semibold text-ink">{highlight}</strong>}
                      </span>
                    ))
                  : m.value}
              </li>
            ))}
          </ul>
        )}
        {r.badge && <span className="mt-4 inline-block rounded-md bg-accent-light px-2 py-0.5 text-[0.8rem] font-semibold text-accent">{r.badge}</span>}

        <div className="mt-6 flex flex-wrap gap-2">
          {r.links.map((l) => {
            const LinkIcon = LINK_ICON[l.label.toLowerCase()] || (/github\.com/.test(l.url) ? Github : /youtu/.test(l.url) ? PlayCircle : ExternalLink);
            return (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-solid !py-2 text-[0.9rem]">
                <LinkIcon size={15} /> {l.label}
              </a>
            );
          })}
          {!standalone && (
            <Link href={href} onClick={() => drawer.dismiss()} className="btn btn-outline !py-2 text-[0.9rem]">
              <Maximize2 size={15} /> Full page
            </Link>
          )}
          <button type="button" onClick={() => copyText(absoluteUrl(href), 'Link copied')} className="btn btn-outline !py-2 text-[0.9rem]">
            <Link2 size={15} /> Share
          </button>
          {canList(item.collection) && (
            <button type="button" onClick={() => openItemEditor(item.collection, item)} className="btn btn-outline !py-2 text-[0.9rem]">
              <Pencil size={15} /> Edit
            </button>
          )}
        </div>

        {r.details.length > 0 && (
          <dl className="mt-8 grid gap-x-6 gap-y-2 rounded-card border border-line bg-card p-5 sm:grid-cols-[9rem_1fr]">
            {r.details.map((d) => (
              <div key={d.key} className="contents">
                <dt className="text-[0.88rem] text-muted">{d.label}</dt>
                <dd className="break-words text-ink">
                  {d.key === 'doi' ? (
                    <a href={`https://doi.org/${d.value}`} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
                      {d.value}
                    </a>
                  ) : d.key === 'level' && Number(d.value) ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="flex gap-1" aria-hidden="true">
                        {[1, 2, 3].map((n) => (
                          <span key={n} className={cx('h-2 w-2 rounded-full', n <= Number(d.value) ? 'bg-accent' : 'bg-line')} />
                        ))}
                      </span>
                      {['', 'Familiar (coursework)', 'Applied in a project', 'Core: central to a thesis or flagship project'][Math.min(3, Number(d.value))]}
                    </span>
                  ) : d.key === 'email' ? (
                    <a href={`mailto:${d.value}`} className="text-accent underline underline-offset-4">
                      {d.value}
                    </a>
                  ) : (
                    d.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {r.images.length > 0 && (
          <div className="mt-8 space-y-3">
            <SafeImage src={r.images[0]} alt={r.title} width={1600} className="max-h-[70vh] w-full rounded-card bg-bg2 object-contain" />
            {r.images.length > 1 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {r.images.slice(1).map((src) => (
                  <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-[calc(var(--radius)*0.6)] border border-line">
                    <SafeImage src={src} alt="" width={700} className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

  );
  const tail = (
      <div>
        {related.length > 0 && (
          <section className="mt-12 border-t border-line pt-6" aria-labelledby="related-h">
            <h2 id="related-h" className="mb-4 text-[0.85rem] font-semibold uppercase tracking-wide text-muted">Related</h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {related.map((o) => {
                const ro = readItem(o, def);
                return (
                  <li key={o.id}>
                    <Link
                      href={itemHref(o, schema)}
                      onClick={(e) => {
                        if (!standalone) {
                          e.preventDefault();
                          drawer.replace({ type: 'item', id: o.id, ids });
                        }
                      }}
                      className="group flex h-full flex-col rounded-card border border-line bg-card p-4 transition-colors hover:border-accent"
                    >
                      <span className="line-clamp-3 font-medium leading-snug text-ink group-hover:text-accent">{ro.title}</span>
                      {ro.date && <span className="mt-auto pt-2 text-[0.82rem] text-muted">{ro.date}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {!standalone && (prev || next) && (
          <nav className="mt-12 grid grid-cols-2 gap-3 border-t border-line pt-6" aria-label="Previous and next">
            <div>
              {prev && (
                <button type="button" onClick={() => go(prev)} className="group flex w-full flex-col items-start text-left">
                  <span className="inline-flex items-center gap-1 text-[0.85rem] text-muted"><ChevronLeft size={15} /> Previous</span>
                  <span className="mt-1 line-clamp-2 text-ink group-hover:text-accent">{readItem(items[prev] || {}, def).title}</span>
                </button>
              )}
            </div>
            <div>
              {next && (
                <button type="button" onClick={() => go(next)} className="group flex w-full flex-col items-end text-right">
                  <span className="inline-flex items-center gap-1 text-[0.85rem] text-muted">Next <ChevronRight size={15} /></span>
                  <span className="mt-1 line-clamp-2 text-ink group-hover:text-accent">{readItem(items[next] || {}, def).title}</span>
                </button>
              )}
            </div>
          </nav>
        )}

        {standalone && def.route && (
          <p className="mt-12 border-t border-line pt-6">
            <Link href={`/${def.route}`} className="inline-flex items-center gap-1.5 text-accent hover:underline">
              <ChevronLeft size={16} /> All {def.label.toLowerCase()}
            </Link>
          </p>
        )}
      </div>
  );

  if (standalone) {
    return (
      <article className="mx-auto max-w-site px-5 pb-16 pt-6 md:px-10 md:pt-10">
        <div className={cx('grid gap-10', hasToc ? 'xl:grid-cols-[minmax(0,860px)_220px] xl:justify-center' : 'mx-auto max-w-[860px]')}>
          <div className="min-w-0">
            {head}
            {hasToc && (
              <div className="mt-8 xl:hidden">
                <Toc toc={toc} />
              </div>
            )}
            {body}
            {tail}
          </div>
          {hasToc && (
            <aside className="hidden xl:block">
              <Toc toc={toc} standalone />
            </aside>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-[860px] px-5 pb-16 pt-8 md:px-10 md:pt-12">
      {head}
      {hasToc && (
        <div className="mt-8">
          <Toc toc={toc} />
        </div>
      )}
      {body}
      {tail}
    </article>
  );
}

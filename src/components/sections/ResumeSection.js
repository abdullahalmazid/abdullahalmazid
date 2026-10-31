'use client';
/**
 * Résumé generated from the site's own content.
 *
 * Each CV section pulls entries from one list (or is free text), with its
 * own selection (all / filtered / hand-picked order), sort, fields and
 * format (entries, bullets, numbers, citations, one line per category, comma
 * list). The sheet's look (layout, colour, headings, links, dates, spacing,
 * paper size, photo) comes from the section settings. "Download CV (PDF)" typesets it with LaTeX (see CvExport); every title links back to its page on the site.
 */
import Icon from '@/components/ui/Icon';
import Markdown from '@/components/ui/Markdown';
import SafeImage from '@/components/ui/SafeImage';
import { cvBody, normalizeCvBlock } from '@/lib/cv';
import { absoluteUrl, itemHref, SITE_URL } from '@/lib/links';
import { ieee, readItem } from '@/lib/roles';
import { useCollectionItems, useConfig, useSchema } from '@/lib/store';
import { cx } from '@/lib/utils';
import { Fragment } from 'react';
import { selectItems } from './CollectionSection';
import CvExport from './CvExport';

/** Bold the owner's name, written in full or as initials ("A. A. Mazid"). */
function Highlight({ text, name }) {
  if (!name) return text;
  const words = name.trim().split(/\s+/);
  const short = `${words.slice(0, -1).map((w) => `${w[0]}.`).join(' ')} ${words[words.length - 1]}`;
  const hit = [name, short].find((n) => text.includes(n));
  if (!hit) return text;
  return text.split(hit).map((part, i, arr) => (
    <Fragment key={i}>
      {part}
      {i < arr.length - 1 && <strong>{hit}</strong>}
    </Fragment>
  ));
}

const DENSITY = { compact: { block: '0.85rem', item: '0.35rem' }, normal: { block: '1.25rem', item: '0.7rem' }, airy: { block: '1.7rem', item: '1rem' } };
const NAME = { md: '1.55rem', lg: '1.9rem', xl: '2.35rem' };
// Static system fonts: browsers embed them as ordinary TrueType in the PDF, which
// applicant-tracking systems read reliably (variable web fonts become Type 3).
const FONT = { site: 'var(--font-body)', sans: "Arial, Helvetica, 'Liberation Sans', sans-serif", serif: "Georgia, 'Times New Roman', Times, serif" };
const HEAD_FONT = { site: 'var(--font-heading)', sans: "Arial, Helvetica, 'Liberation Sans', sans-serif", serif: "Georgia, 'Times New Roman', Times, serif" };

function TitleLink({ b, it, schema, def, children }) {
  if (!b.linkTitle || !def?.route) return children;
  return (
    <a href={absoluteUrl(itemHref(it, schema))} className="cv-a">
      {children}
    </a>
  );
}

function Links({ r }) {
  if (!r.links.length) return null;
  return (
    <span className="ml-2 text-[0.78em] font-normal">
      {r.links.map((l, i) => (
        <Fragment key={l.url}>
          {i > 0 && ' · '}
          <a href={l.url} className="cv-a">
            {l.label}
          </a>
        </Fragment>
      ))}
    </span>
  );
}

function Entry({ it, b, def, schema, p }) {
  const r = readItem(it, def);
  const swap = b.swapTitle && b.showSubtitle && r.subtitle;
  const titleText = swap ? r.subtitle : r.title;
  const secondText = swap ? r.title : b.showSubtitle ? r.subtitle : '';
  const details = [secondText, ...(b.showMeta ? r.metas.map((m) => m.value) : [])].filter(Boolean);
  const body = cvBody(r.body, b.description);
  const side = b.rightSide || 'date';
  const dateText = b.showDate ? r.date : '';
  const date = side === 'group' ? r.group : side === 'both' ? [r.group, dateText].filter(Boolean).join(' · ') : side === 'none' ? '' : dateText;
  const datePos = p.datePosition || 'right';
  const content = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="cv-title">
          <TitleLink b={b} it={it} schema={schema} def={def}>
            {titleText}
          </TitleLink>
          {b.showBadge && r.badge && <span className="cv-muted ml-2 text-[0.85em] font-normal">· {r.badge}</span>}
          {b.showLinks && <Links r={r} />}
        </h3>
        {date && datePos === 'right' && <span className="cv-muted shrink-0 text-[0.86em] tabular-nums">{date}</span>}
      </div>
      {date && datePos === 'below' && <p className="cv-muted text-[0.84em]">{date}</p>}
      {details.length > 0 && <p className="cv-text text-[0.9em]">{details.join(' · ')}</p>}
      {b.showDetails && r.details.length > 0 && (
        <p className="cv-text text-[0.86em]">
          {r.details.map((d, i) => (
            <Fragment key={d.key}>
              {i > 0 && <br />}
              {d.label}:{' '}
              {d.key === 'email' ? <a href={`mailto:${d.value}`} className="cv-a">{d.value}</a> : d.key === 'doi' ? <a href={`https://doi.org/${d.value}`} className="cv-a">{d.value}</a> : d.value}
            </Fragment>
          ))}
        </p>
      )}
      {body && <Markdown className="cv-md mt-0.5 text-[0.88em]">{body}</Markdown>}
      {b.showTags && r.tags.length > 0 && (
        <p className="cv-muted mt-0.5 text-[0.82em]">
          {b.tagsLabel && <span className="font-semibold">{b.tagsLabel} </span>}
          {r.tags.join(' · ')}
        </p>
      )}
    </div>
  );
  return (
    <li className="flex gap-3 break-inside-avoid" style={{ marginTop: 'var(--cv-item)' }}>
      {date && datePos === 'left' && <span className="cv-muted w-[6.5rem] shrink-0 pt-[0.1em] text-[0.84em] tabular-nums">{date}</span>}
      {b.showImage && (r.image ? <SafeImage src={r.image} alt="" width={160} className="h-11 w-11 shrink-0 rounded-md border border-[#e5e5e5] bg-white object-contain p-0.5" /> : <span className="h-11 w-11 shrink-0" />)}
      {content}
    </li>
  );
}

function Line({ it, b, def, schema }) {
  const r = readItem(it, def);
  const details = [b.showSubtitle && r.subtitle, ...(b.showMeta ? r.metas.map((m) => m.value) : [])].filter(Boolean);
  return (
    <li className="break-inside-avoid pl-1" style={{ marginTop: 'calc(var(--cv-item) * 0.5)' }}>
      <span className="cv-title-inline">
        <TitleLink b={b} it={it} schema={schema} def={def}>
          {r.title}
        </TitleLink>
      </span>
      {b.showBadge && r.badge && <span className="cv-muted"> ({r.badge})</span>}
      {details.length > 0 && <span className="cv-text">, {details.join(', ')}</span>}
      {b.showDate && r.date && <span className="cv-muted"> · {r.date}</span>}
      {b.showLinks && <Links r={r} />}
      {b.description !== 'none' && cvBody(r.body, b.description) && <Markdown className="cv-md text-[0.9em]">{cvBody(r.body, b.description)}</Markdown>}
    </li>
  );
}

function Block({ block, schema, config, p }) {
  const b = normalizeCvBlock(block);
  const def = schema.collections?.[b.collection];
  const all = useCollectionItems(b.type === 'list' ? b.collection : '__none__');
  if (b.hidden) return null;
  const heading = <h2 className="cv-h2">{b.title || def?.label || ''}</h2>;
  const cls = cx('cv-block', b.pageBreak && 'cv-break');

  if (b.type === 'text') {
    if (!b.text.trim()) return null;
    return (
      <section className={cls}>
        {heading}
        <Markdown className="cv-md text-[0.9em]">{b.text}</Markdown>
      </section>
    );
  }
  if (!def) return null;
  const list = selectItems(all, {
    selection: b.selection,
    ids: b.ids,
    filterField: b.filterField,
    filterValue: b.filterValue,
    sortField: b.sortField || def.defaultSort?.field || '',
    sortDir: b.sortDir || def.defaultSort?.dir || 'asc',
    limit: b.limit,
  });
  if (!list.length) return null;

  return (
    <section className={cls}>
      {heading}
      {b.format === 'entries' && (
        <ul>
          {list.map((it) => (
            <Entry key={it.id} it={it} b={b} def={def} schema={schema} p={p} />
          ))}
        </ul>
      )}
      {(b.format === 'bullets' || b.format === 'numbered') && (
        <Fragment>
          {(() => {
            const List = b.format === 'bullets' ? 'ul' : 'ol';
            return (
              <List className={cx('cv-list pl-5', b.format === 'bullets' ? 'list-disc' : 'list-decimal')}>
                {list.map((it) => (
                  <Line key={it.id} it={it} b={b} def={def} schema={schema} />
                ))}
              </List>
            );
          })()}
        </Fragment>
      )}
      {b.format === 'citations' && (
        <ol className="cv-list list-decimal space-y-1.5 pl-5 text-[0.88em] leading-snug">
          {list.map((it) => (
            <li key={it.id} className="break-inside-avoid pl-1">
              {b.citeStyle === 'short' ? (
                <span className="cv-text">
                  <strong className="text-[#111]">{it.title}</strong>, <em>{[it.venue, it.details, it.year].filter(Boolean).join(', ')}</em>.
                  {it.doi && (
                    <>
                      {' '}DOI: <a href={`https://doi.org/${it.doi}`} className="cv-a-plain">{it.doi}</a>
                    </>
                  )}
                </span>
              ) : (
                <span className="cv-text">
                  <Highlight text={ieee(it)} name={config.person?.citeAs} />
                </span>
              )}
              {b.linkTitle && def.route && (
                <>
                  {' '}
                  <a href={absoluteUrl(itemHref(it, schema))} className="cv-a text-[0.85em]">
                    [link]
                  </a>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      {b.format === 'grouped' && (
        <dl className={cx('grid gap-y-1 text-[0.88em]', p.layout === 'sidebar' && b.column === 'side' ? 'grid-cols-1' : 'sm:grid-cols-[10rem_1fr]')}>
          {[...new Set(list.map((it) => readItem(it, def).group || 'Other'))].map((g) => (
            <div key={g} className="contents">
              <dt className="cv-title-inline mt-1 sm:mt-0">{g}</dt>
              <dd className="cv-text">
                {list
                  .filter((it) => (readItem(it, def).group || 'Other') === g)
                  .map((it) => readItem(it, def).title)
                  .join(', ')}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {b.format === 'inline' && <p className="cv-text text-[0.9em]">{list.map((it) => readItem(it, def).title).join(', ')}</p>}
    </section>
  );
}

export default function ResumeSection({ section }) {
  const raw = section.props;
  // ATS-friendly: standard font, one column, no photo (see lib/sections.js).
  const ats = raw.ats !== false;
  // The footer's date was read by ATS parsers as an extra degree ("MSc … 10/2026"), so ATS mode drops it.
  const p = ats ? { ...raw, font: raw.font === 'site' || !raw.font ? 'sans' : raw.font, layout: 'single', showPhoto: false, showFooter: false } : raw;
  const config = useConfig();
  const schema = useSchema();
  const person = config.person || {};
  const contact = config.contact || {};
  const links = (config.socials || []).filter((s) => /^https?:/.test(s.url) && !/\.pdf$/i.test(s.url));
  const host = SITE_URL.replace(/^https?:\/\//, '');
  const accent = p.accent === 'site' ? 'var(--accent)' : p.accent === 'custom' ? p.accentColor || '#1f3a8a' : '#111111';
  const density = DENSITY[p.density] || DENSITY.normal;
  const blocks = (p.blocks || []).map(normalizeCvBlock);
  const sidebar = p.layout === 'sidebar';
  const side = sidebar ? blocks.filter((b) => b.column === 'side') : [];
  const main = sidebar ? blocks.filter((b) => b.column !== 'side') : blocks;
  const photo = p.photo || person.photo;
  const centered = p.headerAlign === 'center';

  // CV-only text wins; empty falls back to Dashboard > Design > Site details.
  const name = p.name?.trim() || [person.honorific, person.name].filter(Boolean).join(' ');
  const headline = (p.headline?.trim() ? p.headline : [person.position, person.affiliation].filter(Boolean).join(' · '))
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const email = p.email?.trim() || contact.email;
  const phone = p.phone?.trim() || contact.phone;
  const location = p.location?.trim() || person.location || String(contact.address || '').split('\n')[0];
  const website = p.website?.trim() || SITE_URL;
  const websiteText = website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const extras = String(p.extraContact || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const contactItems = [
    p.showEmail !== false && email && { key: 'e', node: <a href={`mailto:${email}`} className="cv-a-plain">{email}</a> },
    p.showPhone !== false && phone && { key: 'p', node: <span>{phone}</span> },
    p.showLocation !== false && location && { key: 'l', node: <span>{location}</span> },
    p.showWebsite !== false && website && { key: 'w', node: <a href={/^https?:/.test(website) ? website : `https://${website}`} className="cv-a-plain">{websiteText}</a> },
    ...(p.showSocials !== false
      ? links.map((s) => ({
          key: s.url,
          node: (
            <a href={s.url} className="cv-a-plain inline-flex items-center gap-1">
              <Icon name={s.icon} size={12} className="no-print" />
              {s.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </a>
          ),
        }))
      : []),
    ...extras.map((t, i) => ({ key: `x${i}`, node: /^https?:\/\//.test(t) ? <a href={t} className="cv-a-plain">{t.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a> : <span>{t}</span> })),
  ].filter(Boolean);

  const summary = p.summary?.trim() && (
    <section className="cv-block">
      {p.summaryTitle !== '' && <h2 className="cv-h2">{p.summaryTitle || 'Profile'}</h2>}
      <Markdown className="cv-md text-[0.9em]">{p.summary}</Markdown>
    </section>
  );

  return (
    <div>
      <style>{`@media print { @page { size: ${p.pageSize === 'Letter' ? 'letter' : 'A4'}; } }`}</style>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-[2rem] font-semibold text-ink md:text-[2.4rem]">{p.title || 'Curriculum vitae'}</h1>
          <p className="mt-1 text-ink2">{p.intro || 'Generated live from this site, so it is always current. Download it as a PDF.'}</p>
        </div>
        <CvExport props={{ ...p, showPhoto: raw.showPhoto }} />
      </div>

      <article
        className={cx('cv-sheet mx-auto rounded-[6px] bg-white px-7 py-9 text-[#222] shadow-[0_1px_2px_rgba(0,0,0,.06),0_24px_60px_-28px_rgba(0,0,0,.45)] ring-1 ring-black/5 md:px-12 md:py-12', p.pageSize === 'Letter' ? 'max-w-[870px]' : 'max-w-[850px]')}
        data-heading={p.headingStyle || 'rule'}
        data-ats={ats ? 'true' : undefined}
        data-links={p.linkStyle || 'bold'}
        style={{
          fontFamily: FONT[p.font] || FONT.site,
          fontSize: `${(Number(p.fontScale) || 100) / 100}rem`,
          '--cv-accent': accent,
          '--cv-head-font': HEAD_FONT[p.font] || HEAD_FONT.site,
          '--cv-block': density.block,
          '--cv-item': density.item,
        }}
      >
        <header className={cx('flex gap-5 pb-4', centered ? 'flex-col items-center text-center' : p.photoSide === 'left' ? 'flex-row-reverse justify-end' : 'flex-row')} style={{ borderBottom: `2px solid var(--cv-accent)` }}>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold leading-tight tracking-tight" style={{ fontFamily: 'var(--cv-head-font)', fontSize: NAME[p.nameSize] || NAME.lg, color: p.accent === 'ink' ? '#111' : 'var(--cv-accent)' }}>
              {name}
            </h1>
            {headline.map((line, i) => (
              <p key={i} className={cx('text-[#333]', i === 0 ? 'mt-0.5 text-[1em]' : 'text-[0.92em]')}>
                {line}
              </p>
            ))}
            {contactItems.length > 0 && (
              <p className={cx('mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.82em] text-[#333]', centered && 'justify-center')}>
                {contactItems.map((c) => (
                  <Fragment key={c.key}>{c.node}</Fragment>
                ))}
              </p>
            )}
          </div>
          {p.showPhoto && photo && (
            <SafeImage
              src={photo}
              alt=""
              width={300}
              className={cx('h-[6.5rem] w-[6.5rem] shrink-0 object-cover', p.photoShape === 'circle' ? 'rounded-full' : p.photoShape === 'square' ? 'rounded-none' : 'rounded-lg', centered && 'order-first')}
            />
          )}
        </header>

        {sidebar ? (
          <div className="grid gap-x-8 sm:grid-cols-[minmax(0,30%)_1fr] print:grid-cols-[30%_1fr]">
            <aside className="min-w-0">
              {side.map((b, i) => (
                <Block key={`s${i}`} block={b} schema={schema} config={config} p={p} />
              ))}
            </aside>
            <div className="min-w-0">
              {summary}
              {main.map((b, i) => (
                <Block key={`m${i}`} block={b} schema={schema} config={config} p={p} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {summary}
            {main.map((b, i) => (
              <Block key={i} block={b} schema={schema} config={config} p={p} />
            ))}
          </>
        )}

        {p.showFooter !== false && (
          <p className="mt-8 border-t border-[#ddd] pt-2 text-[0.72em] text-[#777]">
            Generated from {host} · {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
        )}
      </article>
    </div>
  );
}

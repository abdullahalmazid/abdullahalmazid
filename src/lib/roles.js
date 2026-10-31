/**
 * Turns a collection definition + an item into role-named values, so every
 * layout can ask for "the title" or "the meta fields" without knowing that
 * publications call it `venue` and experience calls it `org`.
 */
import { toTags } from './utils';

export const ROLES = [
  { value: 'title', label: 'Title' },
  { value: 'subtitle', label: 'Subtitle' },
  { value: 'meta', label: 'Detail line' },
  { value: 'date', label: 'Date / year' },
  { value: 'group', label: 'Category' },
  { value: 'badge', label: 'Badge' },
  { value: 'body', label: 'Description' },
  { value: 'image', label: 'Image' },
  { value: 'link', label: 'Link button' },
  { value: 'tags', label: 'Tags' },
  { value: 'detail', label: 'Only in the side panel' },
];

export const FIELD_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'markdown', label: 'Formatted text' },
  { value: 'number', label: 'Number' },
  { value: 'url', label: 'Web link' },
  { value: 'image', label: 'Image' },
  { value: 'gallery', label: 'Several images' },
  { value: 'tags', label: 'Tags' },
  { value: 'select', label: 'Choice' },
  { value: 'date', label: 'Date' },
];

export function fieldsByRole(def, hidden = []) {
  const out = { title: [], subtitle: [], meta: [], date: [], group: [], badge: [], body: [], image: [], link: [], tags: [], detail: [], gallery: [] };
  for (const f of def?.fields || []) {
    if (hidden.includes(f.key)) continue;
    if (f.type === 'gallery') out.gallery.push(f);
    else (out[f.role] || out.meta).push(f);
  }
  return out;
}

const str = (v) => (v === undefined || v === null ? '' : Array.isArray(v) ? v.join(', ') : String(v));

/** Everything a layout needs from one item. */
export function readItem(item, def, hidden = []) {
  const r = fieldsByRole(def, hidden);
  const first = (list) => (list[0] ? str(item[list[0].key]) : '');
  const links = r.link
    .map((f) => ({ label: f.label, url: str(item[f.key]) }))
    .filter((l) => l.url);
  const images = [
    ...r.image.map((f) => str(item[f.key])),
    ...r.gallery.flatMap((f) => (Array.isArray(item[f.key]) ? item[f.key] : [])),
  ].filter(Boolean);
  return {
    id: item.id,
    title: first(r.title) || '(untitled)',
    subtitle: first(r.subtitle),
    metas: r.meta.map((f) => ({ key: f.key, label: f.label, value: str(item[f.key]) })).filter((m) => m.value),
    date: first(r.date),
    group: first(r.group),
    badge: first(r.badge),
    body: r.body.map((f) => str(item[f.key])).filter(Boolean).join('\n\n'),
    image: images[0] || '',
    images,
    links,
    tags: r.tags.flatMap((f) => toTags(item[f.key])),
    details: r.detail.map((f) => ({ key: f.key, label: f.label, value: str(item[f.key]) })).filter((m) => m.value),
  };
}

/** Plain-text citation, for the copy button. */
export function citationText(item) {
  const parts = [];
  if (item.authors) parts.push(item.authors);
  if (item.title) parts.push(`“${item.title}”`);
  if (item.venue) parts.push(item.venue);
  if (item.details) parts.push(item.details);
  if (item.year) parts.push(String(item.year));
  let text = parts.join(', ');
  if (item.doi) text += `. doi: ${item.doi}`;
  return `${text}.`;
}

export function bibtex(item) {
  const firstAuthor = String(item.authors || 'author').split(',')[0].trim().split(/\s+/).pop() || 'author';
  const key = `${firstAuthor.toLowerCase().replace(/[^a-z]/g, '')}${item.year || ''}`;
  const type = item.type === 'Journal' ? 'article' : item.type === 'Conference' ? 'inproceedings' : item.type === 'Patent' ? 'misc' : 'misc';
  const venueKey = type === 'article' ? 'journal' : type === 'inproceedings' ? 'booktitle' : 'howpublished';
  const authors = String(item.authors || '').split(',').map((a) => a.trim()).filter(Boolean).join(' and ');
  const lines = [
    `@${type}{${key},`,
    `  title = {${item.title || ''}},`,
    authors && `  author = {${authors}},`,
    item.venue && `  ${venueKey} = {${item.venue}},`,
    item.year && `  year = {${item.year}},`,
    item.doi && `  doi = {${item.doi}},`,
    item.link && !item.doi && `  url = {${item.link}},`,
  ].filter(Boolean);
  return `${lines.join('\n').replace(/,$/, '')}\n}`;
}

/* ---------- More citation styles ---------------------------------- */

const splitAuthors = (s) => String(s || '').split(/,| and /).map((a) => a.trim()).filter(Boolean);

/** "Abdullah Al Mazid" -> { last: 'Mazid', initials: 'A. A.' } (also handles "A. A. Mazid"). */
function nameParts(full) {
  const words = full.replace(/\s+/g, ' ').trim().split(' ');
  const last = words.pop() || '';
  const initials = words.map((w) => `${w.replace(/\./g, '')[0] || ''}.`).filter((x) => x !== '.').join(' ');
  return { last, initials };
}

/** APA 7th, conference / journal. */
export function apa(item) {
  const names = splitAuthors(item.authors).map((n) => {
    const { last, initials } = nameParts(n);
    return initials ? `${last}, ${initials}` : last;
  });
  let authors = names.join(', ');
  if (names.length > 1) authors = `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
  const parts = [];
  if (authors) parts.push(`${authors} (${item.year || 'n.d.'}).`);
  if (item.title) parts.push(`${item.title}.`);
  if (item.venue) parts.push(item.type === 'Conference' ? `In *${item.venue}*.` : `*${item.venue}*${item.details ? `, ${item.details}` : ''}.`);
  if (item.doi) parts.push(`https://doi.org/${item.doi}`);
  else if (item.link) parts.push(item.link);
  return parts.join(' ').replace(/\*/g, '');
}

/** IEEE numbered style. */
export function ieee(item) {
  const names = splitAuthors(item.authors).map((n) => {
    const { last, initials } = nameParts(n);
    return initials ? `${initials} ${last}` : last;
  });
  let authors = names.join(', ');
  if (names.length > 2) authors = `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  else if (names.length === 2) authors = names.join(' and ');
  const venue = item.venue ? (item.type === 'Conference' ? `in Proc. ${item.venue}` : item.venue) : '';
  const tail = [venue, item.details, item.year].filter(Boolean).join(', ');
  return `${authors}, “${item.title || ''},” ${tail}${item.doi ? `, doi: ${item.doi}` : ''}.`;
}

export const CITE_STYLES = [
  { id: 'apa', label: 'APA', format: apa },
  { id: 'ieee', label: 'IEEE', format: ieee },
  { id: 'plain', label: 'Plain', format: citationText },
  { id: 'bibtex', label: 'BibTeX', format: bibtex, mono: true },
];

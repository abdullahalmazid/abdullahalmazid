'use client';
/**
 * Import from the previous portfolio (my-portfolio-app2).
 *
 * That site stored each list in its own Firestore collection (publications,
 * projects, blogs, experience, education, gallery) with HTML from a rich-text
 * editor. This reads them from the same Firebase project, keeps that HTML
 * (it is sanitised when shown), maps the old fields onto the new collections and skips anything
 * whose title already exists. Nothing is deleted from the old collections, so
 * the old site keeps working until you switch domains.
 */
import { getFirebase } from './firebase';
import { slugify } from './utils';

export const LEGACY_COLLECTIONS = ['publications', 'projects', 'blogs', 'experience', 'education', 'gallery'];

/* ---------- HTML → Markdown (rich-text editor output) -------------- */

function inline(node) {
  let out = '';
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      out += n.textContent.replace(/\s+/g, ' ');
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    const inner = inline(n);
    if (tag === 'strong' || tag === 'b') out += inner.trim() ? `**${inner.trim()}**` : '';
    else if (tag === 'em' || tag === 'i') out += inner.trim() ? `_${inner.trim()}_` : '';
    else if (tag === 'code') out += `\`${n.textContent}\``;
    else if (tag === 'a') out += `[${inner.trim() || n.getAttribute('href')}](${n.getAttribute('href') || ''})`;
    else if (tag === 'br') out += '  \n';
    else if (tag === 'img') out += `![${n.getAttribute('alt') || ''}](${n.getAttribute('src') || ''})`;
    else if (tag === 'mark' || tag === 'u' || tag === 's' || tag === 'span') out += inner;
    else out += inner;
  });
  return out;
}

function block(node, depth = 0) {
  const parts = [];
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      if (n.textContent.trim()) parts.push(n.textContent.trim());
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) parts.push(`${'#'.repeat(Math.min(4, Math.max(2, Number(tag[1]))))} ${inline(n).trim()}`);
    else if (tag === 'p') {
      const t = inline(n).trim();
      if (t) parts.push(t);
    } else if (tag === 'ul' || tag === 'ol') {
      const lines = [];
      [...n.children].forEach((li, i) => {
        const marker = tag === 'ol' ? `${i + 1}.` : '-';
        const nested = [...li.children].filter((c) => /^(ul|ol)$/i.test(c.tagName));
        const clone = li.cloneNode(true);
        clone.querySelectorAll('ul,ol').forEach((x) => x.remove());
        lines.push(`${'  '.repeat(depth)}${marker} ${inline(clone).trim()}`);
        nested.forEach((x) => lines.push(block({ childNodes: [x] }, depth + 1)));
      });
      parts.push(lines.join('\n'));
    } else if (tag === 'blockquote') parts.push(block(n).split('\n').map((l) => `> ${l}`).join('\n'));
    else if (tag === 'pre') parts.push(`\`\`\`\n${n.textContent.replace(/\n$/, '')}\n\`\`\``);
    else if (tag === 'hr') parts.push('---');
    else if (tag === 'img') parts.push(inline({ childNodes: [n] }));
    else if (tag === 'div' || tag === 'section' || tag === 'article') parts.push(block(n, depth));
    else {
      const t = inline({ childNodes: [n] }).trim();
      if (t) parts.push(t);
    }
  });
  return parts.filter(Boolean).join('\n\n');
}

export function htmlToMarkdown(html) {
  const text = String(html || '').trim();
  if (!text) return '';
  if (!/<[a-z][\s\S]*>/i.test(text)) return text; // already plain text / markdown
  if (typeof DOMParser === 'undefined') return text.replace(/<[^>]+>/g, ' ');
  const doc = new DOMParser().parseFromString(`<div>${text}</div>`, 'text/html');
  return block(doc.body.firstChild).replace(/\n{3,}/g, '\n\n').trim();
}

/* ---------- Mapping ------------------------------------------------- */

const s = (v) => (v === undefined || v === null ? '' : String(v)).trim();
const tags = (v) => (Array.isArray(v) ? v.map(s) : s(v).split(',')).map((t) => t.trim()).filter(Boolean);
const doiFrom = (url) => /doi\.org\/(.+)$/i.exec(s(url))?.[1] || '';
const dateOf = (d) => {
  if (!d) return '';
  if (typeof d === 'number') return new Date(d).toISOString().slice(0, 10);
  if (d?.seconds) return new Date(d.seconds * 1000).toISOString().slice(0, 10);
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? s(d) : t.toISOString().slice(0, 10);
};

// The site renders sanitised HTML natively now, so rich text is kept as HTML
// (alignment, highlights, tables survive). Plain text passes through unchanged.
const keepRich = (v) => s(v);

const MAPPERS = {
  publications: (d) => ({
    collection: 'publications',
    title: s(d.title),
    authors: s(d.authors),
    venue: s(d.journal || d.venue || d.conference),
    year: Number(d.year) || s(d.year),
    type: /conf|proc|symposium|iccit|ieom|workshop/i.test(s(d.journal)) ? 'Conference' : 'Journal',
    doi: s(d.doi) || doiFrom(d.link),
    link: s(d.link),
    abstract: keepRich(d.abstract),
    tags: tags(d.tags || d.keywords),
  }),
  projects: (d, extra) => ({
    collection: 'projects',
    title: s(d.title),
    summary: s(d.description).replace(/<[^>]+>/g, ''),
    body: keepRich(d.details || d.content),
    stack: tags(d.tech || d.tags),
    github: s(d.github),
    demo: s(d.live || d.demo),
    cover: s(d.imageUrl || d.image),
    gallery: extra.gallery || [],
    period: s(d.year || d.date || d.duration),
  }),
  blogs: (d) => ({
    collection: 'posts',
    title: s(d.title),
    excerpt: s(d.excerpt),
    date: dateOf(d.date || d.createdAt),
    category: 'Notes',
    cover: s(d.coverImage || d.imageUrl),
    body: keepRich(d.content),
    tags: tags(d.tags),
  }),
  experience: (d) => ({
    collection: 'experience',
    role: s(d.role || d.title),
    org: s(d.company || d.org),
    period: s(d.duration || d.period),
    location: s(d.location),
    description: keepRich(d.description),
  }),
  education: (d) => ({
    collection: 'education',
    degree: s(d.title || d.degree),
    institution: s(d.institution),
    period: s(d.duration || d.year),
    grade: s(d.cgpa) ? `CGPA ${s(d.cgpa)}` : '',
    location: s(d.location),
    logo: s(d.logoUrl),
    note: keepRich(d.description),
  }),
  gallery: (d) => ({
    collection: 'gallery',
    caption: s(d.title || d.caption),
    image: s(d.imageUrl || d.image),
    description: keepRich(d.description),
  }),
};

const TITLE_KEY = { publications: 'title', projects: 'title', posts: 'title', experience: 'role', education: 'degree', gallery: 'caption' };
const norm = (t) => s(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Reads the old collections. Returns { raw: {name: docs[]}, errors: {name: message} }. */
export async function readLegacy() {
  const fb = getFirebase();
  if (!fb) throw new Error('Firebase is not connected, so the old collections cannot be read.');
  const fs = await import('firebase/firestore');
  const raw = {};
  const errors = {};
  await Promise.all(
    LEGACY_COLLECTIONS.map(async (name) => {
      try {
        const snap = await fs.getDocs(fs.collection(fb.db, name));
        raw[name] = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
      } catch (err) {
        raw[name] = [];
        errors[name] = err?.code === 'permission-denied' ? 'not readable (check firestore.rules)' : err?.message || 'failed';
      }
    })
  );
  return { raw, errors };
}

/** Maps old documents onto new items, skipping titles that already exist. */
export function planImport(raw, existingItems) {
  const existing = new Set(Object.values(existingItems).map((it) => `${it.collection}:${norm(it[TITLE_KEY[it.collection]] || it.title)}`));
  const usedIds = new Set(Object.keys(existingItems));
  const galleryByProject = {};
  (raw.gallery || []).forEach((g) => {
    if (g.relatedProjectId && g.imageUrl) (galleryByProject[g.relatedProjectId] ||= []).push(g.imageUrl);
  });
  const now = Date.now();
  const plan = { add: [], skipped: [] };
  Object.entries(raw).forEach(([name, docs]) => {
    const map = MAPPERS[name];
    if (!map) return;
    docs
      .filter((d) => !d.hidden && !d.deletedAt)
      .forEach((d, i) => {
        const item = map(d, { gallery: galleryByProject[d._id] || [] });
        const title = item[TITLE_KEY[item.collection]];
        if (!s(title) && item.collection !== 'gallery') return;
        const key = `${item.collection}:${norm(title)}`;
        if (existing.has(key)) {
          plan.skipped.push({ collection: item.collection, title });
          return;
        }
        existing.add(key);
        let id = slugify(title) || `${item.collection}-${d._id}`;
        while (usedIds.has(id)) id = `${id}-${d._id.slice(0, 4).toLowerCase()}`;
        usedIds.add(id);
        Object.keys(item).forEach((k) => (item[k] === '' || (Array.isArray(item[k]) && !item[k].length)) && delete item[k]);
        plan.add.push({
          ...item,
          id,
          order: 1000 + i * 10,
          hidden: false,
          createdAt: typeof d.createdAt === 'number' ? d.createdAt : now,
          updatedAt: now,
          review: 'Imported from the previous site: check the text and formatting.',
        });
      });
  });
  return plan;
}

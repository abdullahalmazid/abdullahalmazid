/**
 * Server-side view of the content: live Firestore when it answers, the
 * bundled seed otherwise. Used by metadata, the sitemap, RSS and the
 * server-rendered entry pages, so search engines and link previews see the
 * same content visitors do.
 */
import seed from '@/data/seed';
import { COL } from '@/lib/collections';
import { getDocREST, listREST, REST_ENABLED } from './firestore-rest';

const visible = (it) => it && !it.hidden && !it.deletedAt;

export async function getSchema() {
  const live = REST_ENABLED ? await getDocREST(`${COL.site}/schema`) : null;
  return live?.collections ? { collections: { ...seed.schema.collections, ...live.collections } } : seed.schema;
}

export async function getSiteConfig() {
  const live = REST_ENABLED ? await getDocREST(`${COL.site}/config`) : null;
  if (!live) return seed.config;
  return { ...seed.config, ...live, site: { ...seed.config.site, ...(live.site || {}) }, person: { ...seed.config.person, ...(live.person || {}) } };
}

export async function getItem(id) {
  const fromSeed = seed.items.find((i) => i.id === id) || null;
  const live = REST_ENABLED ? await getDocREST(`${COL.items}/${id}`) : null;
  const item = (live && typeof live.collection === 'string' ? live : null) || fromSeed;
  return visible(item) ? item : null;
}

export async function getPage(slug) {
  const fromSeed = seed.pages.find((p) => p.id === slug) || null;
  const live = REST_ENABLED ? await getDocREST(`${COL.pages}/${slug}`) : null;
  const page = (live && Array.isArray(live.sections) ? live : null) || fromSeed;
  return page && !page.hidden && !page.deletedAt ? page : null;
}

export async function listItems() {
  const live = REST_ENABLED ? await listREST(COL.items) : [];
  const map = new Map(seed.items.map((i) => [i.id, i]));
  // Live data wins; seed entries only fill in when Firestore is unreachable or not yet published.
  const mine = live.filter((d) => typeof d.collection === 'string');
  if (mine.length) return mine.filter(visible);
  return [...map.values()].filter(visible);
}

export async function listPages() {
  const live = REST_ENABLED ? await listREST(COL.pages) : [];
  const mine = live.filter((d) => Array.isArray(d.sections));
  const pages = mine.length ? mine : seed.pages;
  return pages.filter((p) => !p.hidden && !p.deletedAt);
}

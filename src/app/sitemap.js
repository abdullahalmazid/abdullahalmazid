/** Every public address: tabs and each entry's own page. Live data when Firestore answers. */
import { absoluteUrl, itemHref } from '@/lib/links';
import { getSchema, listItems, listPages } from '@/lib/server/content';

export const revalidate = 3600;

const when = (d) => {
  const t = d?._updated || d?.updatedAt || d?.date;
  const date = t ? new Date(t) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export default async function sitemap() {
  const [pages, items, schema] = await Promise.all([listPages(), listItems(), getSchema()]);
  return [
    ...pages.map((p) => ({ url: absoluteUrl(p.id === 'home' ? '/' : `/${p.id}`), lastModified: when(p), changeFrequency: 'monthly', priority: p.id === 'home' ? 1 : 0.8 })),
    ...items
      .filter((it) => schema.collections[it.collection]?.route)
      .map((it) => ({ url: absoluteUrl(itemHref(it, schema)), lastModified: when(it), changeFrequency: 'yearly', priority: 0.6 })),
  ];
}

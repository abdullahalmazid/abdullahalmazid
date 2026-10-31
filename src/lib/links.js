/**
 * Public addresses for tabs and entries.
 *
 * Every entry has its own page at /<route>/<id>, where <route> is the tab set
 * on its collection (schema.collections.<key>.route). Collections without a
 * route use /item/<id>; that address works for every entry.
 */
export const SITE_URL = (process.env.SITE_URL || 'https://abdullahalmazid.vercel.app').replace(/\/$/, '');

export const tabHref = (slug) => (!slug || slug === 'home' ? '/' : `/${slug}`);

export function itemHref(item, schema) {
  if (!item?.id) return '/';
  const route = schema?.collections?.[item.collection]?.route;
  return `/${route || 'item'}/${encodeURIComponent(item.id)}`;
}

export const absoluteUrl = (path = '/') => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`);

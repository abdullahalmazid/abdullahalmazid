/**
 * Structured data (schema.org JSON-LD) and metadata helpers.
 * Search engines read these from the server-rendered HTML; LinkedIn, WhatsApp
 * and Slack previews read the Open Graph tags built here.
 */
import seed from '@/data/seed';
import { absoluteUrl, itemHref, SITE_URL } from './links';
import { readItem } from './roles';

export { SITE_URL };

/** Plain text summary, cut at a word boundary. */
export function summarize(text, max = 160) {
  const plain = String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.lastIndexOf(' ', max);
  return `${plain.slice(0, cut > 40 ? cut : max)}…`;
}

export function personJsonLd(config = seed.config) {
  const p = config.person || {};
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    jobTitle: p.position,
    url: SITE_URL,
    image: p.photo ? absoluteUrl(p.photo) : undefined,
    email: config.contact?.email ? `mailto:${config.contact.email}` : undefined,
    address: p.location ? { '@type': 'PostalAddress', addressLocality: p.location } : undefined,
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Bangladesh University of Engineering and Technology' },
    knowsAbout: config.site?.keywords,
    sameAs: (config.socials || []).map((s) => s.url).filter((u) => /^https?:/.test(u)),
  };
}

/** JSON-LD for one entry, typed per collection (ScholarlyArticle, BlogPosting…). */
export function itemJsonLd(item, def, schema, config = seed.config) {
  const r = readItem(item, def);
  const url = absoluteUrl(itemHref(item, schema));
  const author = { '@type': 'Person', name: config.person?.name, url: SITE_URL };
  const base = {
    '@context': 'https://schema.org',
    '@type': def?.jsonLd || 'CreativeWork',
    name: r.title,
    headline: r.title.slice(0, 110),
    description: summarize(r.subtitle || r.body),
    url,
    mainEntityOfPage: url,
    image: r.image ? absoluteUrl(r.image) : undefined,
    keywords: r.tags.length ? r.tags.join(', ') : undefined,
  };
  if (def?.jsonLd === 'ScholarlyArticle') {
    return {
      ...base,
      author: String(item.authors || '').split(',').map((n) => ({ '@type': 'Person', name: n.trim() })).filter((a) => a.name),
      datePublished: item.year ? String(item.year) : undefined,
      isPartOf: item.venue ? { '@type': 'PublicationEvent', name: item.venue } : undefined,
      sameAs: item.doi ? `https://doi.org/${item.doi}` : undefined,
      abstract: summarize(item.abstract, 500),
    };
  }
  if (def?.jsonLd === 'BlogPosting') {
    return { ...base, author, datePublished: item.date || undefined, dateModified: item.updatedAt ? new Date(item.updatedAt).toISOString() : item.date || undefined };
  }
  return { ...base, creator: author, dateCreated: r.date || undefined };
}

export function breadcrumbJsonLd(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: absoluteUrl(t.href) })),
  };
}

/**
 * An entry's own page: /projects/autoprompt-sam, /publications/egov-lens …
 *
 * Rendered on the server from live Firestore (REST) or the seed, so the
 * title, description, Open Graph preview and JSON-LD are in the HTML that
 * Google, LinkedIn and WhatsApp read. The body then hydrates from the
 * client-side store and updates live.
 */
import ItemDetail from '@/components/drawer/ItemDetail';
import seed from '@/data/seed';
import { itemHref } from '@/lib/links';
import { readItem } from '@/lib/roles';
import { breadcrumbJsonLd, itemJsonLd, summarize } from '@/lib/seo';
import { getItem, getSchema, getSiteConfig } from '@/lib/server/content';

export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return seed.items
    .filter((it) => !it.hidden && seed.schema.collections[it.collection]?.route)
    .map((it) => ({ slug: seed.schema.collections[it.collection].route, id: it.id }));
}

async function load(id) {
  const [item, schema] = await Promise.all([getItem(decodeURIComponent(id)), getSchema()]);
  const def = item ? schema.collections[item.collection] : null;
  return { item, def, schema };
}

export async function generateMetadata({ params }) {
  const { item, def, schema } = await load(params.id);
  if (!item || !def) return { title: 'Not found', robots: { index: false } };
  const config = await getSiteConfig();
  const r = readItem(item, def);
  const description = summarize(r.subtitle || r.body || config.site.description);
  const url = itemHref(item, schema);
  const image = r.image || config.person?.photo;
  return {
    title: r.title,
    description,
    alternates: { canonical: url },
    keywords: r.tags,
    openGraph: {
      type: def.jsonLd === 'BlogPosting' || def.jsonLd === 'ScholarlyArticle' ? 'article' : 'website',
      title: r.title,
      description,
      url,
      images: image ? [{ url: image, alt: r.title }] : undefined,
      ...(item.date ? { publishedTime: item.date } : {}),
      ...(def.jsonLd === 'BlogPosting' ? { authors: [config.person?.name] } : {}),
    },
    twitter: { card: r.image ? 'summary_large_image' : 'summary', title: r.title, description, images: image ? [image] : undefined },
  };
}

export default async function EntryPage({ params }) {
  const { item, def, schema } = await load(params.id);
  const config = item ? await getSiteConfig() : null;
  const jsonLd =
    item && def
      ? [
          itemJsonLd(item, def, schema, config),
          breadcrumbJsonLd([
            { name: 'Home', href: '/' },
            ...(def.route ? [{ name: def.label, href: `/${def.route}` }] : []),
            { name: readItem(item, def).title, href: itemHref(item, schema) },
          ]),
        ]
      : null;
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <ItemDetail id={decodeURIComponent(params.id)} fallback={item && def ? { item, def } : null} standalone />
    </>
  );
}

/** RSS 2.0 feed of every collection marked `article: true` (the blog). */
import { absoluteUrl, itemHref } from '@/lib/links';
import { readItem } from '@/lib/roles';
import { summarize } from '@/lib/seo';
import { getSchema, getSiteConfig, listItems } from '@/lib/server/content';

export const revalidate = 3600;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const [items, schema, config] = await Promise.all([listItems(), getSchema(), getSiteConfig()]);
  const posts = items
    .filter((it) => schema.collections[it.collection]?.article)
    .map((it) => ({ it, r: readItem(it, schema.collections[it.collection]) }))
    .sort((a, b) => String(b.it.date || '').localeCompare(String(a.it.date || '')))
    .slice(0, 50);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(config.site.title)} · Writing</title>
<link>${absoluteUrl('/')}</link>
<description>${esc(config.site.description)}</description>
<language>${esc(config.site.language || 'en')}</language>
<atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml"/>
${posts
  .map(({ it, r }) => {
    const url = absoluteUrl(itemHref(it, schema));
    const date = it.date ? new Date(it.date) : null;
    return `<item>
<title>${esc(r.title)}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
${date && !Number.isNaN(date.getTime()) ? `<pubDate>${date.toUTCString()}</pubDate>` : ''}
<description>${esc(summarize(r.subtitle || r.body, 400))}</description>
${r.tags.map((t) => `<category>${esc(t)}</category>`).join('')}
</item>`;
  })
  .join('\n')}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 's-maxage=3600, stale-while-revalidate' } });
}

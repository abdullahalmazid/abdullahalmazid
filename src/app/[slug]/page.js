import PageView from '@/components/page/PageView';
import seed from '@/data/seed';
import { getPage, getSiteConfig } from '@/lib/server/content';
import { breadcrumbJsonLd } from '@/lib/seo';

// Pre-render every bundled tab so links can prefetch them and switching tabs
// is instant. Tabs added later from the dashboard render on demand; their
// metadata comes from live Firestore when it answers.
export function generateStaticParams() {
  return seed.pages.filter((p) => p.id !== 'home').map((p) => ({ slug: p.id }));
}
export const dynamicParams = true;
export const revalidate = 300;

export async function generateMetadata({ params }) {
  const [page, config] = await Promise.all([getPage(params.slug), getSiteConfig()]);
  if (!page) return {};
  const title = page.seo?.title || page.title;
  const description = page.seo?.description || page.header?.subtitle || config.site?.description;
  return {
    title,
    description,
    alternates: { canonical: `/${params.slug}` },
    openGraph: { title, description, url: `/${params.slug}` },
  };
}

export default function TabPage({ params }) {
  const page = seed.pages.find((p) => p.id === params.slug);
  return (
    <>
      {page && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Home', href: '/' }, { name: page.title, href: `/${page.id}` }])) }}
        />
      )}
      <PageView slug={params.slug} />
    </>
  );
}

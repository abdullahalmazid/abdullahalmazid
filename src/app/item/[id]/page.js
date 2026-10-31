/** /item/<id>: works for every entry, including collections without a tab. */
import EntryPage, { generateMetadata as entryMetadata } from '../../[slug]/[id]/page';

export const revalidate = 300;
export const dynamicParams = true;

export function generateMetadata({ params }) {
  return entryMetadata({ params: { slug: 'item', id: params.id } });
}

export default function ItemPage({ params }) {
  return <EntryPage params={{ slug: 'item', id: params.id }} />;
}

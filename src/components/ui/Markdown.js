'use client';
/** Markdown with internal links routed through Next and external ones in a new tab. */
import { nodeText, uniqueSlug } from '@/lib/article';
import { needsRich } from '@/lib/richText';
import dynamic from 'next/dynamic';
import { cx, isExternal } from '@/lib/utils';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// HTML, math and highlighted code: loaded only on pages that use them.
const RichMarkdown = dynamic(() => import('./RichMarkdown'));

const components = {
  a: ({ href = '', children, node, target, rel, ...rest }) => {
    if (href.startsWith('/') && !href.startsWith('//')) return <Link href={href} {...rest}>{children}</Link>;
    if (href.startsWith('#')) return <a href={href} {...rest}>{children}</a>;
    return (
      <a {...rest} href={href} target={isExternal(href) && !href.startsWith('mailto:') ? '_blank' : undefined} rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ src, alt, node, ...rest }) => <img {...rest} src={src} alt={alt || ''} loading="lazy" referrerPolicy="no-referrer" />,
};

/** Headings with ids matching lib/article tableOfContents(), for in-page links. */
function anchored(seen) {
  const make = (Tag) =>
    function Heading({ children: c, node, id: _id, ...rest }) {
      const id = uniqueSlug(nodeText(c), seen);
      return (
        <Tag {...rest} id={id} className={cx('group scroll-mt-24', rest.className)}>
          {c}
          <a href={`#${id}`} className="ml-2 text-muted no-underline opacity-0 transition-opacity group-hover:opacity-100" aria-label="Link to this heading">
            #
          </a>
        </Tag>
      );
    };
  return { h2: make('h2'), h3: make('h3') };
}

export default function Markdown({ children, className = '', inline = false, withAnchors = false }) {
  const text = String(children ?? '');
  if (!text.trim()) return null;
  const rich = needsRich(text);
  if (inline) {
    if (rich) {
      return (
        <span className={cx('md md-inline', className)}>
          <RichMarkdown text={text} components={components} inline />
        </span>
      );
    }
    return (
      <span className={cx('md md-inline', className)}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...components, p: ({ children: c }) => <>{c}</> }}>
          {text}
        </ReactMarkdown>
      </span>
    );
  }
  return (
    <div className={cx('md', className)}>
      {rich ? (
        <RichMarkdown text={text} components={withAnchors ? { ...components, ...anchored({}) } : components} />
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={withAnchors ? { ...components, ...anchored({}) } : components}>
          {text}
        </ReactMarkdown>
      )}
    </div>
  );
}

'use client';
/**
 * Full renderer, loaded only for texts that need it (see lib/richText.js):
 * HTML (alone or inside Markdown), LaTeX math with KaTeX, and syntax-
 * highlighted code blocks. Everything passes through a sanitiser first.
 */
import 'katex/dist/katex.min.css';
import { hasMath, isHtmlDocument, isTrustedEmbed, sanitizeSchema } from '@/lib/richText';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, useMemo } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeParse from 'rehype-parse';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { unified } from 'unified';

/** iframes only from trusted embed hosts; anything else becomes a plain link. */
function Iframe({ src, title, width, height, ...rest }) {
  if (!isTrustedEmbed(src)) {
    return src ? (
      <a href={src} target="_blank" rel="noopener noreferrer">
        {title || src}
      </a>
    ) : null;
  }
  const ratio = width && height && !String(width).includes('%') ? `${Number(width)}/${Number(height)}` : '16/9';
  return (
    <span className="md-embed" style={{ aspectRatio: ratio }}>
      <iframe src={src} title={title || 'Embedded content'} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen {...rest} />
    </span>
  );
}

/**
 * Normalise math delimiters for remark-math:
 *   $$ x $$ on one line  → a display block
 *   \[ x \]               → display block
 *   \( x \)               → inline $x$
 * Fenced code is left alone.
 */
function normaliseMath(text) {
  return text
    .split(/(^```[\s\S]*?^```|^~~~[\s\S]*?^~~~)/m)
    .map((part, i) =>
      i % 2
        ? part
        : part
            .replace(/^[ \t]*\$\$([^\n]+?)\$\$[ \t]*$/gm, (_, m) => `\n$$\n${m.trim()}\n$$\n`)
            .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `\n$$\n${m.trim()}\n$$\n`)
            .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m.trim()}$`)
    )
    .join('');
}

const katexOptions = { throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' };

function HtmlDocument({ html, components }) {
  const tree = useMemo(() => {
    const processor = unified().use(rehypeParse, { fragment: true }).use(rehypeSanitize, sanitizeSchema).use(rehypeHighlight, { detect: false, ignoreMissing: true });
    return processor.runSync(processor.parse(html));
  }, [html]);
  return toJsxRuntime(tree, { Fragment, jsx, jsxs, components, passKeys: true, passNode: false });
}

export default function RichMarkdown({ text, components, inline = false }) {
  const all = { ...components, iframe: Iframe };
  if (isHtmlDocument(text)) {
    return <HtmlDocument html={text} components={inline ? { ...all, p: ({ children }) => <>{children}</> } : all} />;
  }
  const math = hasMath(text);
  return (
    <ReactMarkdown
      remarkPlugins={math ? [remarkGfm, [remarkMath, { singleDollarTextMath: true }]] : [remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], ...(math ? [[rehypeKatex, katexOptions]] : []), [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
      components={inline ? { ...all, p: ({ children }) => <>{children}</> } : all}
    >
      {math ? normaliseMath(text) : text}
    </ReactMarkdown>
  );
}

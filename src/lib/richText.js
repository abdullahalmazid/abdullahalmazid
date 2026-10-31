/**
 * Rich text rules shared by the renderers.
 *
 * Text fields accept Markdown, HTML, or a mix (HTML inside Markdown). The
 * renderer picks a path per text:
 *   - plain Markdown            → light renderer (GFM: tables, task lists…)
 *   - HTML / math / code blocks → full renderer (sanitised HTML, KaTeX, syntax highlighting)
 *
 * HTML is sanitised: scripts, event handlers (onclick…), <style>, forms and
 * javascript: links are removed. iframes are kept only from trusted embed
 * hosts (YouTube, Vimeo, Google Maps/Docs/Drive, CodePen, CodeSandbox,
 * Figma, Loom, Kaggle, Spotify, SoundCloud, OneDrive).
 */
import { defaultSchema } from 'rehype-sanitize';

const HTML_TAG = /<\/?(p|div|span|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|section|article|figure|figcaption|img|br|hr|strong|b|em|i|u|s|blockquote|pre|code|a|iframe|video|audio|details|summary|mark|sup|sub|kbd|small|center)\b[^>]*>/i;
const MATH = /\$\$[\s\S]+?\$\$|(^|[^\\$])\$[^\s$][^$\n]*?\$(?!\d)|\\\(|\\\[/;
const FENCE = /^\s*(```|~~~)/m;

export const hasHtml = (text) => HTML_TAG.test(text);
export const hasMath = (text) => MATH.test(text);
export const needsRich = (text) => hasHtml(text) || hasMath(text) || FENCE.test(text);

/** A whole document written in HTML (from a rich-text editor, Word, Google Docs…), rather than Markdown with a little HTML inside. */
export function isHtmlDocument(text) {
  const t = String(text || '').trim();
  if (!t.startsWith('<') || !hasHtml(t)) return false;
  // Markdown markers outside tags mean it is Markdown with HTML mixed in.
  const outside = t.replace(/<[^>]+>/g, '\n');
  return !/^\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```)/m.test(outside);
}

const TRUSTED_EMBEDS = [
  /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\//,
  /^https:\/\/player\.vimeo\.com\/video\//,
  /^https:\/\/(www\.)?google\.com\/maps\//,
  /^https:\/\/maps\.google\.com\//,
  /^https:\/\/(docs|drive)\.google\.com\//,
  /^https:\/\/codepen\.io\//,
  /^https:\/\/codesandbox\.io\/embed\//,
  /^https:\/\/(www\.)?figma\.com\/embed/,
  /^https:\/\/(www\.)?loom\.com\/embed\//,
  /^https:\/\/(www\.)?kaggle\.com\//,
  /^https:\/\/open\.spotify\.com\/embed\//,
  /^https:\/\/w\.soundcloud\.com\/player\//,
  /^https:\/\/onedrive\.live\.com\/embed/,
];
export const isTrustedEmbed = (src) => TRUSTED_EMBEDS.some((r) => r.test(String(src || '')));

const common = ['className', 'style', 'id', 'title', 'align', 'dir', 'lang', 'role', 'ariaLabel', 'ariaHidden', 'dataTip'];

export const sanitizeSchema = {
  ...defaultSchema,
  // Keep ids as written, so in-page links (#section) work.
  clobber: [],
  clobberPrefix: '',
  tagNames: [
    ...defaultSchema.tagNames,
    'iframe', 'video', 'audio', 'source', 'track', 'figure', 'figcaption', 'mark', 'u', 'abbr', 'cite', 'small',
    'center', 'caption', 'colgroup', 'col', 'span', 'div', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main',
    'time', 'address', 'dfn', 'var', 'samp', 'bdi', 'wbr', 'picture',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes['*'] || []), ...common],
    a: [...(defaultSchema.attributes.a || []), 'target', 'rel', 'download'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'srcSet', 'sizes'],
    iframe: ['src', 'width', 'height', 'allow', 'allowFullScreen', 'frameBorder', 'loading', 'referrerPolicy'],
    video: ['src', 'controls', 'poster', 'width', 'height', 'autoPlay', 'muted', 'loop', 'playsInline', 'preload'],
    audio: ['src', 'controls', 'loop', 'preload'],
    source: ['src', 'type', 'srcSet', 'media'],
    track: ['src', 'kind', 'srcLang', 'label', 'default'],
    td: ['colSpan', 'rowSpan', 'align', 'style'],
    th: ['colSpan', 'rowSpan', 'align', 'scope', 'style'],
    ol: ['start', 'reversed', 'type'],
    col: ['span', 'width'],
    time: ['dateTime'],
    input: ['type', 'checked', 'disabled'], // GFM task lists
    code: [['className', /^language-./, 'math-inline', 'math-display']],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ['http', 'https', 'data'],
    href: ['http', 'https', 'mailto', 'tel'],
  },
};
// `code` gets the shared attributes too (className etc.).
sanitizeSchema.attributes.code = [...common, ...sanitizeSchema.attributes.code];

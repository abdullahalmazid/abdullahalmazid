/** Helpers for long-form entries: reading time and a table of contents. */
import { slugify } from './utils';

const stripTags = (t) => String(t || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');

export function readingMinutes(markdown) {
  const words = stripTags(markdown).replace(/[`#*_>\-[\]()!]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** ## and ### headings, with the ids <Markdown withAnchors> gives them. */
export function tableOfContents(markdown) {
  const out = [];
  const seen = {};
  const text = String(markdown || '');
  // HTML documents: <h2>/<h3> tags, in order.
  if (/^\s*</.test(text) && /<h[23][\s>]/i.test(text)) {
    const re = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let m;
    while ((m = re.exec(text))) {
      const label = stripTags(m[2]).replace(/\s+/g, ' ').trim();
      if (label) out.push({ level: Number(m[1]), text: label, id: uniqueSlug(label, seen) });
    }
    return out;
  }
  let fence = false;
  for (const line of String(markdown || '').split('\n')) {
    if (/^```/.test(line.trim())) fence = !fence;
    if (fence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (!m) continue;
    const text = m[2].replace(/[*_`]/g, '').trim();
    out.push({ level: m[1].length, text, id: uniqueSlug(text, seen) });
  }
  return out;
}

export function uniqueSlug(text, seen) {
  const base = slugify(text) || 'section';
  seen[base] = (seen[base] || 0) + 1;
  return seen[base] > 1 ? `${base}-${seen[base]}` : base;
}

/** Plain text of a React heading's children. */
export function nodeText(children) {
  if (children == null) return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(nodeText).join('');
  return nodeText(children.props?.children);
}

/**
 * CV sections (the `blocks` of a CV / résumé section).
 *
 * A block is either a list pulled from a collection, or free text (for
 * Languages, Interests…). Every option has a default, so older saved CVs keep
 * working when options are added.
 */
export const CV_FORMATS = [
  { value: 'entries', label: 'Entries', hint: 'Title, details and date on each line, like a classic CV.' },
  { value: 'bullets', label: 'Bullet list', hint: '• Title, details (date)' },
  { value: 'numbered', label: 'Numbered list', hint: '1. Title, details (date)' },
  { value: 'citations', label: 'Citations', hint: 'IEEE-style references, your name in bold.' },
  { value: 'grouped', label: 'One line per category', hint: 'Area: item, item, item. Best for skills.' },
  { value: 'inline', label: 'Comma list', hint: 'item, item, item on one line.' },
];

export const CV_DESCRIPTION = [
  { value: 'none', label: 'Hide' },
  { value: 'first', label: 'First paragraph' },
  { value: 'bullets', label: 'Bullet points only' },
  { value: 'full', label: 'Full text' },
];

export function newCvBlock(type = 'list', collection = 'projects', title = '') {
  return normalizeCvBlock(type === 'text' ? { type, title: title || 'Languages', text: '- Bengali (native)\n- English (professional)' } : { type, collection, title });
}

export function normalizeCvBlock(raw = {}) {
  const b = { ...raw };
  // Older saves used `style` and `showBody`.
  const format = b.format || b.style || 'entries';
  return {
    type: b.type === 'text' ? 'text' : 'list',
    collection: b.collection || 'projects',
    title: b.title ?? '',
    hidden: Boolean(b.hidden),
    column: b.column === 'side' ? 'side' : 'main',
    pageBreak: Boolean(b.pageBreak),
    // Entries
    selection: ['all', 'filter', 'manual'].includes(b.selection) ? b.selection : b.filterField ? 'filter' : 'all',
    ids: Array.isArray(b.ids) ? b.ids : [],
    filterField: b.filterField || '',
    filterValue: b.filterValue ?? '',
    sortField: b.sortField || '',
    sortDir: b.sortDir === 'desc' ? 'desc' : b.sortDir === 'asc' ? 'asc' : '',
    limit: Number(b.limit) || 0,
    // Show
    showSubtitle: b.showSubtitle !== false,
    showMeta: b.showMeta !== false,
    showDate: b.showDate !== false,
    showBadge: b.showBadge !== false,
    description: CV_DESCRIPTION.some((d) => d.value === b.description) ? b.description : b.showBody ? 'first' : 'none',
    showTags: Boolean(b.showTags),
    tagsLabel: b.tagsLabel ?? '',
    showImage: Boolean(b.showImage),
    showLinks: Boolean(b.showLinks),
    linkTitle: b.linkTitle !== false,
    showDetails: Boolean(b.showDetails), // detail-role fields: email, DOI, my role…
    swapTitle: Boolean(b.swapTitle), // second line (organisation) on top, e.g. university above degree
    rightSide: ['date', 'group', 'both', 'none'].includes(b.rightSide) ? b.rightSide : 'date',
    citeStyle: b.citeStyle === 'short' ? 'short' : 'ieee',
    // Format
    format: CV_FORMATS.some((f) => f.value === format) ? format : 'entries',
    // Free text
    text: b.text ?? '',
  };
}

/** First paragraph, list items only, or everything, from a Markdown/HTML body. */
export function cvBody(body, mode) {
  const text = String(body || '').trim();
  if (!text || mode === 'none') return '';
  if (mode === 'full') return text;
  if (mode === 'bullets') {
    const items = text.split('\n').filter((l) => /^\s*([-*+]|\d+\.)\s+/.test(l));
    if (items.length) return items.map((l) => l.replace(/^\s*(\d+\.)\s+/, '- ')).join('\n');
    // No list in the text: one bullet per sentence of the first paragraph.
    return (text.split(/\n\s*\n/)[0].match(/[^.!?]+[.!?]+(\s|$)/g) || [text]).map((x) => `- ${x.trim()}`).join('\n');
  }
  return text.split(/\n\s*\n/).find((p) => !/^\s*([-*+]|\d+\.|#)/.test(p)) || text.split(/\n\s*\n/)[0];
}

/** First line of every LaTeX CV this site generates; /api/latex only compiles these. */
export const LATEX_MARKER = '% generated-by: aam-cv';

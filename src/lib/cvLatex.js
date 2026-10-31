/**
 * CV → LaTeX.
 *
 * Builds a complete, self-contained .tex document from the CV section's
 * settings and the site's content: the same sections, hand-picked entries,
 * sort order, fields and formats as the on-screen CV.
 *
 * The output is made for applicant-tracking systems: one column, standard
 * Type 1 fonts (Helvetica or Times clones), and \pdfgentounicode so every
 * glyph maps back to real text when the PDF is parsed. Compile with pdflatex
 * (the site's /api/latex route, Overleaf, or any TeX install).
 */
import { selectItems } from '@/components/sections/CollectionSection';
import { cvBody, LATEX_MARKER, normalizeCvBlock } from './cv';
import { absoluteUrl, itemHref, SITE_URL } from './links';
import { ieee, readItem } from './roles';

export { LATEX_MARKER };

/* ---------- Escaping ------------------------------------------------ */

// Symbols use math fonts (always vector Type 1 with Unicode mapping); text-companion
// (TS1) glyphs can fall back to bitmaps with no text mapping on some TeX installs.
const UNICODE = {
  '–': '--', '—': '---', '·': '\\textperiodcentered{}', '•': '$\\bullet$', '→': '$\\rightarrow$', '←': '$\\leftarrow$',
  '“': '``', '”': "''", '‘': '`', '’': "'", '…': '\\ldots{}', '×': '$\\times$', '°': '$^{\\circ}$', '±': '$\\pm$',
  '≈': '$\\approx$', '≥': '$\\geq$', '≤': '$\\leq$', '≠': '$\\neq$', 'μ': '$\\mu$', 'α': '$\\alpha$', 'β': '$\\beta$', 'σ': '$\\sigma$',
  '€': 'EUR ', '£': '\\pounds{}', '৳': 'BDT ', '™': '(TM)', '©': '(c)', '®': '(R)',
  '\u00a0': '~', '\u200b': '',
};

export function tex(text) {
  return String(text ?? '')
    .replace(/[\\{}&%$#_~^]/g, (c) => ({ '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '_': '\\_', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}' })[c])
    .replace(/[–—·•→←“”‘’…×°±≈≥≤≠μαβσ€£৳™©®\u00a0\u200b]/g, (c) => UNICODE[c])
    // pdflatex cannot set scripts outside Latin; drop them rather than fail the build.
    .replace(/[^\x00-\u024f]/g, '');
}

const url = (u) => String(u || '').replace(/[%#\\{}]/g, (c) => `\\${c}`);

/** Inline Markdown (bold, italic, code, links) → LaTeX. */
function inline(md, linkCmd) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|(^|[^\w])_([^_]+)_(?!\w)/g;
  let last = 0;
  let m;
  while ((m = re.exec(md))) {
    out.push(tex(md.slice(last, m.index)));
    if (m[1]) out.push(`${linkCmd}{${url(m[2])}}{${tex(m[1])}}`);
    else if (m[3] || m[4]) out.push(`\\textbf{${tex(m[3] || m[4])}}`);
    else if (m[5]) out.push(`\\texttt{${tex(m[5])}}`);
    else if (m[6]) out.push(`\\textit{${tex(m[6])}}`);
    else if (m[8]) out.push(`${tex(m[7])}\\textit{${tex(m[8])}}`);
    last = re.lastIndex;
  }
  out.push(tex(md.slice(last)));
  return out.join('');
}

/** Block Markdown (paragraphs, lists, headings; HTML reduced to text) → LaTeX. */
export function mdToLatex(md, linkCmd = '\\cvlink') {
  let text = String(md || '').trim();
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) {
    text = text
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<\/(p|div|h\d|ul|ol|li|tr|table)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '_$2_')
      .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');
  }
  const lines = text.split('\n');
  const out = [];
  let list = null; // 'itemize' | 'enumerate'
  let para = [];
  const flushPara = () => {
    if (para.length) out.push(`${inline(para.join(' '), linkCmd)}\\par`);
    para = [];
  };
  const closeList = () => {
    if (list) out.push(`\\end{${list}}`);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^\s*#{1,6}\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushPara();
      const kind = bullet ? 'itemize' : 'enumerate';
      if (list !== kind) {
        closeList();
        out.push(`\\begin{${kind}}`);
        list = kind;
      }
      out.push(`  \\item ${inline((bullet || numbered)[1], linkCmd)}`);
    } else if (heading) {
      flushPara();
      closeList();
      out.push(`\\textbf{${inline(heading[1], linkCmd)}}\\par`);
    } else if (!line.trim()) {
      flushPara();
      closeList();
    } else if (/^\s*```/.test(line)) {
      // Code fences are rare in a CV; keep the text, drop the fence.
    } else {
      closeList();
      para.push(line.trim());
    }
  }
  flushPara();
  closeList();
  return out.join('\n');
}

/* ---------- Document ------------------------------------------------ */

function hex(color, fallback = '111111') {
  const c = String(color || '').replace('#', '');
  return /^[0-9a-f]{6}$/i.test(c) ? c.toUpperCase() : fallback;
}

/** Bold the owner's name in a citation, written in full or as initials. */
function boldName(escaped, name) {
  if (!name) return escaped;
  const words = name.trim().split(/\s+/);
  const short = `${words.slice(0, -1).map((w) => `${w[0]}.`).join(' ')} ${words[words.length - 1]}`;
  for (const n of [name, short]) {
    const e = tex(n);
    if (escaped.includes(e)) return escaped.split(e).join(`\\textbf{${e}}`);
  }
  return escaped;
}

function entryLatex(it, b, def, schema, p) {
  const r = readItem(it, def);
  const href = b.linkTitle && def.route ? absoluteUrl(itemHref(it, schema)) : '';
  const title = href ? `\\cvtitlelink{${url(href)}}{${tex(r.title)}}` : `\\textbf{${tex(r.title)}}`;
  const badge = b.showBadge && r.badge ? ` {\\small\\color{muted} \\textperiodcentered{} ${tex(r.badge)}}` : '';
  const links = b.showLinks && r.links.length ? ` {\\small ${r.links.map((l) => `\\cvlink{${url(l.url)}}{${tex(l.label)}}`).join(' \\textperiodcentered{} ')}}` : '';
  const date = b.showDate && r.date ? tex(r.date) : '';
  const details = [b.showSubtitle && r.subtitle, ...(b.showMeta ? r.metas.map((m) => m.value) : [])].filter(Boolean).map(tex).join(' \\textperiodcentered{} ');
  const body = mdToLatex(cvBody(r.body, b.description));
  const tags = b.showTags && r.tags.length ? `{\\small\\color{muted} ${b.tagsLabel ? `\\textbf{${tex(b.tagsLabel)}} ` : ''}${r.tags.map(tex).join(' \\textperiodcentered{} ')}}\\par` : '';
  const pos = p.datePosition || 'right';

  const head = pos === 'right' && date ? `${title}${badge}${links}\\hfill{\\small ${date}}` : `${title}${badge}${links}`;
  const lines = [`\\noindent ${head}\\par`];
  if (date && pos === 'below') lines.push(`{\\small\\color{muted} ${date}}\\par`);
  if (details) lines.push(`${details}\\par`);
  if (body) lines.push(body);
  if (tags) lines.push(tags);
  const block = lines.join('\n');
  if (pos === 'left' && date) {
    return `\\noindent\\begin{minipage}[t]{6.2em}{\\small\\color{muted} ${date}}\\end{minipage}%\n\\begin{minipage}[t]{\\dimexpr\\linewidth-6.2em\\relax}\n${block}\n\\end{minipage}\\par\\vspace{\\cvitemgap}`;
  }
  return `\\begin{samepage}\n${block}\n\\end{samepage}\\vspace{\\cvitemgap}`;
}

function lineLatex(it, b, def, schema) {
  const r = readItem(it, def);
  const href = b.linkTitle && def.route ? absoluteUrl(itemHref(it, schema)) : '';
  const title = href ? `\\cvtitlelink{${url(href)}}{${tex(r.title)}}` : `\\textbf{${tex(r.title)}}`;
  const details = [b.showSubtitle && r.subtitle, ...(b.showMeta ? r.metas.map((m) => m.value) : [])].filter(Boolean).map(tex).join(', ');
  const parts = [title];
  if (b.showBadge && r.badge) parts.push(` (${tex(r.badge)})`);
  if (details) parts.push(`, ${details}`);
  if (b.showDate && r.date) parts.push(` \\textperiodcentered{} ${tex(r.date)}`);
  const body = mdToLatex(cvBody(r.body, b.description));
  return `  \\item ${parts.join('')}${body ? `\\par\n${body}` : ''}`;
}

function blockLatex(raw, { schema, items, config, p }) {
  const b = normalizeCvBlock(raw);
  if (b.hidden) return '';
  const def = schema.collections?.[b.collection];
  const heading = `\\section*{${tex(b.title || def?.label || '')}}`;
  const pre = b.pageBreak ? '\\newpage\n' : '';
  if (b.type === 'text') {
    const body = mdToLatex(b.text);
    return body ? `${pre}${heading}\n${body}` : '';
  }
  if (!def) return '';
  const all = Object.values(items).filter((it) => it.collection === b.collection && !it.hidden);
  const ordered = [...all].sort((a, c) => (a.order ?? 0) - (c.order ?? 0));
  const list = selectItems(ordered, {
    selection: b.selection,
    ids: b.ids,
    filterField: b.filterField,
    filterValue: b.filterValue,
    sortField: b.sortField || def.defaultSort?.field || '',
    sortDir: b.sortDir || def.defaultSort?.dir || 'asc',
    limit: b.limit,
  });
  if (!list.length) return '';

  let body = '';
  if (b.format === 'entries') body = list.map((it) => entryLatex(it, b, def, schema, p)).join('\n');
  else if (b.format === 'bullets' || b.format === 'numbered') {
    const env = b.format === 'bullets' ? 'itemize' : 'enumerate';
    body = `\\begin{${env}}\n${list.map((it) => lineLatex(it, b, def, schema)).join('\n')}\n\\end{${env}}`;
  } else if (b.format === 'citations') {
    body = `\\begin{enumerate}\n${list
      .map((it) => {
        const link = b.linkTitle && def.route ? ` \\cvlink{${url(absoluteUrl(itemHref(it, schema)))}}{[link]}` : '';
        return `  \\item ${boldName(tex(ieee(it)), config.person?.citeAs)}${link}`;
      })
      .join('\n')}\n\\end{enumerate}`;
  } else if (b.format === 'grouped') {
    // Plain "Area: items" lines (tables scramble label/value order in ATS text extraction).
    const groups = [...new Set(list.map((it) => readItem(it, def).group || 'Other'))];
    body = groups
      .map((g) => `\\textbf{${tex(g)}:} ${list.filter((it) => (readItem(it, def).group || 'Other') === g).map((it) => tex(readItem(it, def).title)).join(', ')}\\par\\vspace{1pt}`)
      .join('\n');
  } else if (b.format === 'inline') {
    body = `${list.map((it) => tex(readItem(it, def).title)).join(', ')}\\par`;
  }
  return `${pre}${heading}\n${body}`;
}

/**
 * The whole document. `props` are the CV section's settings (already
 * normalised by the section), `items` the store's items map.
 */
export function buildCvLatex(args) {
  return (args.props?.latexStyle || 'boxed') === 'minimal' ? buildMinimal(args) : buildBoxed(args);
}

function buildMinimal({ props: p, config, schema, items }) {
  const person = config.person || {};
  const contact = config.contact || {};
  const name = p.name?.trim() || [person.honorific, person.name].filter(Boolean).join(' ');
  const headline = (p.headline?.trim() ? p.headline : [person.position, person.affiliation].filter(Boolean).join(' · ')).split('\n').map((l) => l.trim()).filter(Boolean);
  const email = p.email?.trim() || contact.email;
  const phone = p.phone?.trim() || contact.phone;
  const location = p.location?.trim() || person.location || String(contact.address || '').split('\n')[0];
  const website = p.website?.trim() || SITE_URL;
  const short = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const socials = (config.socials || []).filter((s) => /^https?:/.test(s.url) && !/\.pdf$/i.test(s.url));
  const extras = String(p.extraContact || '').split('\n').map((l) => l.trim()).filter(Boolean);

  const contacts = [
    p.showEmail !== false && email && `\\href{mailto:${url(email)}}{${tex(email)}}`,
    p.showPhone !== false && phone && tex(phone),
    p.showLocation !== false && location && tex(location),
    p.showWebsite !== false && website && `\\href{${url(/^https?:/.test(website) ? website : `https://${website}`)}}{${tex(short(website))}}`,
    ...(p.showSocials !== false ? socials.map((s) => `\\href{${url(s.url)}}{${tex(short(s.url))}}`) : []),
    ...extras.map((t) => (/^https?:\/\//.test(t) ? `\\href{${url(t)}}{${tex(short(t))}}` : tex(t))),
  ].filter(Boolean);

  const accent = p.accent === 'custom' ? hex(p.accentColor, '1F3A8A') : p.accent === 'site' ? hex(p.accentHex, '2557E8') : '111111';
  const size = (Number(p.fontScale) || 100) >= 110 ? '11pt' : (Number(p.fontScale) || 100) <= 92 ? '10pt' : '10pt';
  const stretch = (Number(p.fontScale) || 100) / 100;
  const gaps = { compact: ['6pt', '3pt', '2pt'], normal: ['10pt', '4pt', '5pt'], airy: ['14pt', '6pt', '8pt'] }[p.density] || ['10pt', '4pt', '5pt'];
  const font = p.font === 'serif' ? '\\usepackage{mathptmx}' : '\\usepackage[scaled=0.92]{helvet}\n\\renewcommand{\\familydefault}{\\sfdefault}';
  const nameSize = { md: '\\LARGE', lg: '\\huge', xl: '\\Huge' }[p.nameSize] || '\\huge';
  const centered = p.headerAlign === 'center';
  const linkStyle = {
    bold: '\\newcommand{\\cvlink}[2]{\\href{#1}{\\textbf{#2}}}',
    underline: '\\newcommand{\\cvlink}[2]{\\href{#1}{\\underline{#2}}}',
    accent: '\\newcommand{\\cvlink}[2]{\\href{#1}{\\textcolor{accent}{#2}}}',
    plain: '\\newcommand{\\cvlink}[2]{\\href{#1}{#2}}',
  }[p.linkStyle || 'bold'];
  const titleLink = {
    bold: '\\newcommand{\\cvtitlelink}[2]{\\href{#1}{\\textbf{#2}}}',
    underline: '\\newcommand{\\cvtitlelink}[2]{\\href{#1}{\\textbf{\\underline{#2}}}}',
    accent: '\\newcommand{\\cvtitlelink}[2]{\\href{#1}{\\textbf{\\textcolor{accent}{#2}}}}',
    plain: '\\newcommand{\\cvtitlelink}[2]{\\href{#1}{\\textbf{#2}}}',
  }[p.linkStyle || 'bold'];
  const headingFormat = {
    rule: '\\titleformat{\\section}{\\color{accent}\\normalsize\\bfseries}{}{0pt}{\\MakeUppercase}[{\\color{rulegray}\\titlerule}]',
    band: '\\titleformat{\\section}{\\normalsize\\bfseries}{}{0pt}{\\colorbox{accent!9}{\\parbox{\\dimexpr\\linewidth-2\\fboxsep}{\\color{accent}\\MakeUppercase{#1}}}}',
    bar: '\\titleformat{\\section}{\\color{accent}\\normalsize\\bfseries}{}{0pt}{\\textcolor{accent}{\\rule[-2pt]{2.5pt}{11pt}}\\hspace{6pt}\\MakeUppercase}',
    plain: '\\titleformat{\\section}{\\color{accent}\\normalsize\\bfseries}{}{0pt}{\\MakeUppercase}',
  }[p.headingStyle || 'rule'];

  const summary = p.summary?.trim() ? `${p.summaryTitle !== '' ? `\\section*{${tex(p.summaryTitle || 'Profile')}}\n` : ''}${mdToLatex(p.summary)}` : '';
  const blocks = (p.blocks || []).map((b) => blockLatex(b, { schema, items, config, p })).filter(Boolean);

  return `${LATEX_MARKER}
% CV of ${tex(name)}, generated from ${short(SITE_URL)}.
% Edit freely, then compile with pdflatex (e.g. on Overleaf).
\\documentclass[${size},${p.pageSize === 'Letter' ? 'letterpaper' : 'a4paper'}]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{textcomp}
${font}
\\usepackage[${p.pageSize === 'Letter' ? 'letterpaper' : 'a4paper'},top=11mm,bottom=11mm,left=13mm,right=13mm]{geometry}
\\usepackage[dvipsnames]{xcolor}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks,pdftitle={${tex(name)} - CV},pdfauthor={${tex(name)}},pdfcreator={${short(SITE_URL)}}]{hyperref}
% Every glyph maps back to Unicode text, so ATS parsers read the PDF exactly.
\\input{glyphtounicode}
\\pdfgentounicode=1

\\definecolor{accent}{HTML}{${accent}}
\\definecolor{muted}{HTML}{555555}
\\definecolor{rulegray}{HTML}{BBBBBB}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\linespread{${(1.0 * stretch).toFixed(2)}}
\\raggedright
\\newlength{\\cvitemgap}\\setlength{\\cvitemgap}{${gaps[2]}}
${headingFormat}
\\titlespacing*{\\section}{0pt}{${gaps[0]}}{${gaps[1]}}
\\setlist{nosep,leftmargin=1.3em,topsep=1pt,itemsep=1pt}
${linkStyle}
${titleLink}

\\begin{document}

${centered ? '\\begin{center}' : ''}
{${nameSize}\\bfseries ${p.accent === 'ink' ? '' : '\\color{accent}'}${tex(name)}}\\par\\vspace{3pt}
${headline.map((l, i) => (i === 0 ? `{\\large ${tex(l)}}\\par` : `{${tex(l)}}\\par`)).join('\n')}
\\vspace{4pt}
{\\small ${contacts.map((c, i) => `\\mbox{${c}${i < contacts.length - 1 ? '\\enspace\\textbar' : ''}}`).join('\\hspace{0.6em plus 0.2em}')}}\\par
${centered ? '\\end{center}' : ''}
\\vspace{2pt}{\\color{accent}\\hrule height 1.2pt}

${summary}

${blocks.join('\n\n')}

\\end{document}
`;
}

/* ================================================================== */
/* Boxed style: framed sections with a black title tab, framed header */
/* with photo, Latin Modern, institution / date rows.                  */
/* ================================================================== */

/** The header photo source (CV photo, else profile photo), or '' when the PDF has no photo. */
function photoSource(p, config) {
  if (p.latexStyle === 'minimal' || p.latexPhoto === false) return '';
  return p.photo || config.person?.photo || '';
}

/** Absolute URL of the photo, or '' (Cloudinary images are requested as JPEG). */
export function latexPhotoUrl(p, config) {
  const src = photoSource(p, config);
  if (!src || src.startsWith('data:')) return '';
  const abs = absoluteUrl(src);
  return abs.includes('res.cloudinary.com') ? abs.replace('/upload/', '/upload/f_jpg,w_600,c_limit/') : abs;
}

/**
 * Files the document expects next to it: the photo, as a public URL for the
 * compiler to fetch, or (for an image stored inside the site data) its bytes.
 */
export function latexAssets(p, config) {
  const src = photoSource(p, config);
  const data = /^data:image\/(jpeg|jpg|png);base64,(.+)$/i.exec(src || '');
  if (data) return [{ path: data[1].toLowerCase() === 'png' ? 'photo.png' : 'photo.jpg', file: data[2] }];
  const url = latexPhotoUrl(p, config);
  return url ? [{ path: /\.png($|\?)/i.test(url) ? 'photo.png' : 'photo.jpg', url }] : [];
}

const rightOf = (b, r) =>
  ({ date: r.date, group: r.group, both: [r.group, r.date].filter(Boolean).join(' \u00b7 '), none: '' })[b.rightSide || 'date'] || '';

function boxedEntry(it, b, def, schema) {
  const r = readItem(it, def);
  const href = b.linkTitle && def.route ? absoluteUrl(itemHref(it, schema)) : '';
  const titleText = b.swapTitle && b.showSubtitle && r.subtitle ? r.subtitle : r.title;
  const secondText = b.swapTitle && b.showSubtitle && r.subtitle ? r.title : b.showSubtitle ? r.subtitle : '';
  const top = href ? `\\cvtitlelink{${url(href)}}{${tex(titleText)}}` : `\\textbf{${tex(titleText)}}`;
  const links = b.showLinks && r.links.length ? ` {\\small ${r.links.map((l) => `\\cvlink{${url(l.url)}}{${tex(l.label)}}`).join(' \\textperiodcentered{} ')}}` : '';
  const right = rightOf(b, { ...r, date: b.showDate ? r.date : '' });
  // A long second line (a project summary) reads better as a normal paragraph under the row.
  const longSecond = !b.swapTitle && secondText.length > 80;
  const left2 = [longSecond ? '' : secondText, ...(b.showMeta ? r.metas.map((m) => m.value) : [])].filter(Boolean).map(tex).join(' \\textperiodcentered{} ');
  const right2 = b.showBadge && r.badge ? tex(r.badge) : '';
  const rows = [`${top}${links} & \\textit{${tex(right)}} \\\\`];
  // \textcolor (not \color) keeps both cells on the same baseline in a tabularx row.
  if (left2 || right2) rows.push(`\\textcolor{cvgray}{${left2}} & \\textcolor{cvgray}{${right2}} \\\\`);
  const out = [`\\begin{tabularx}{\\linewidth}{@{}X r@{}}\n${rows.join('\n')}\n\\end{tabularx}\\par`];
  if (b.showDetails && r.details.length) {
    out.push(
      r.details
        .map((d) => {
          const v = d.key === 'email' ? `\\href{mailto:${url(d.value)}}{${tex(d.value)}}` : d.key === 'doi' ? `\\href{https://doi.org/${url(d.value)}}{${tex(d.value)}}` : tex(d.value);
          return `${tex(d.label)}: ${v}`;
        })
        .join('\\\\\n') + '\\par'
    );
  }
  if (longSecond) out.push(`${tex(secondText)}\\par`);
  const body = mdToLatex(cvBody(r.body, b.description));
  if (body) out.push(`\\vspace{1pt}${body}`);
  if (b.showTags && r.tags.length) out.push(`{\\small\\color{cvgray} ${b.tagsLabel ? `\\textbf{${tex(b.tagsLabel)}} ` : ''}${r.tags.map(tex).join(', ')}}\\par`);
  return out.join('\n');
}

function shortCitation(it, b, def, schema) {
  const venue = [it.venue, it.details, it.year].filter(Boolean).map(String).join(', ');
  const doi = it.doi ? ` DOI: \\href{https://doi.org/${url(it.doi)}}{${tex(it.doi)}}` : it.link ? ` \\href{${url(it.link)}}{${tex(it.link.replace(/^https?:\/\//, ''))}}` : '';
  return `  \\item \\textbf{${tex(it.title)}}, \\textit{${tex(venue)}}.${doi}`;
}

function boxedBlock(raw, { schema, items, config, p }) {
  const b = normalizeCvBlock(raw);
  if (b.hidden) return '';
  const def = schema.collections?.[b.collection];
  const title = tex(b.title || def?.label || '');
  // Short sections never split; long ones (5+ entries) may continue on the next page instead of leaving a gap.
  const env = (count) => (p.keepSections === false || count > 4 ? 'cvsectionflow' : 'cvsection');
  const wrap = (inner, count = 1) => `${b.pageBreak ? '\\newpage\n' : ''}\\begin{${env(count)}}{${title}}\n${inner}\n\\end{${env(count)}}`;
  if (b.type === 'text') {
    const body = mdToLatex(b.text);
    return body ? wrap(body) : '';
  }
  if (!def) return '';
  const all = Object.values(items).filter((it) => it.collection === b.collection && !it.hidden).sort((a, c) => (a.order ?? 0) - (c.order ?? 0));
  const list = selectItems(all, {
    selection: b.selection,
    ids: b.ids,
    filterField: b.filterField,
    filterValue: b.filterValue,
    sortField: b.sortField || def.defaultSort?.field || '',
    sortDir: b.sortDir || def.defaultSort?.dir || 'asc',
    limit: b.limit,
  });
  if (!list.length) return '';
  let body = '';
  if (b.format === 'entries') body = list.map((it) => boxedEntry(it, b, def, schema)).join('\n\\vspace{\\cvitemgap}\n');
  else if (b.format === 'bullets' || b.format === 'numbered') {
    const env = b.format === 'bullets' ? 'itemize' : 'enumerate';
    body = `\\begin{${env}}\n${list.map((it) => lineLatex(it, b, def, schema)).join('\n')}\n\\end{${env}}`;
  } else if (b.format === 'citations') {
    body = `\\begin{enumerate}[label={[\\arabic*]}]\n${list
      .map((it) => {
        if (b.citeStyle === 'short') return shortCitation(it, b, def, schema);
        const link = b.linkTitle && def.route ? ` \\cvlink{${url(absoluteUrl(itemHref(it, schema)))}}{[link]}` : '';
        return `  \\item ${boldName(tex(ieee(it)), config.person?.citeAs)}${link}`;
      })
      .join('\n')}\n\\end{enumerate}`;
  } else if (b.format === 'grouped') {
    const groups = [...new Set(list.map((it) => readItem(it, def).group || 'Other'))];
    body = groups
      .map((g) => `\\textbf{${tex(g)}:} ${list.filter((it) => (readItem(it, def).group || 'Other') === g).map((it) => tex(readItem(it, def).title)).join(', ')}.`)
      .join('\\\\[3pt]\n');
  } else if (b.format === 'inline') {
    body = list.map((it) => tex(readItem(it, def).title)).join(' \\courseseparator\n');
  }
  return wrap(body, b.format === 'entries' || b.format === 'citations' ? list.length : 1);
}

function buildBoxed({ props: p, config, schema, items }) {
  const person = config.person || {};
  const contact = config.contact || {};
  const name = p.name?.trim() || [person.honorific, person.name].filter(Boolean).join(' ');
  const headline = (p.headline?.trim() ? p.headline : [person.position, person.affiliation].filter(Boolean).join(' · ')).split('\n').map((l) => l.trim()).filter(Boolean);
  const email = p.email?.trim() || contact.email;
  const phone = p.phone?.trim() || contact.phone;
  const location = p.location?.trim() || person.location || String(contact.address || '').split('\n')[0];
  const website = p.website?.trim() || SITE_URL;
  const short = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const socials = (config.socials || []).filter((s) => /^https?:/.test(s.url) && !/\.pdf$/i.test(s.url));
  const extras = String(p.extraContact || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const line1 = [p.showLocation !== false && location && tex(location), p.showPhone !== false && phone && tex(phone)].filter(Boolean);
  const line2 = [
    p.showEmail !== false && email && `\\href{mailto:${url(email)}}{${tex(email)}}`,
    p.showWebsite !== false && website && `\\href{${url(/^https?:/.test(website) ? website : `https://${website}`)}}{${tex(short(website))}}`,
    ...(p.showSocials !== false ? socials.map((s) => `\\href{${url(s.url)}}{${tex(short(s.url))}}`) : []),
    ...extras.map((t) => (/^https?:\/\//.test(t) ? `\\href{${url(t)}}{${tex(short(t))}}` : tex(t))),
  ].filter(Boolean);
  const join = (arr) => arr.map((c, i) => (i < arr.length - 1 ? `\\mbox{${c}}\\contactsep\\allowbreak` : `\\mbox{${c}}`)).join('');

  const blue = p.accent === 'custom' ? hex(p.accentColor, '004378') : p.accent === 'site' ? hex(p.accentHex, '004378') : '004378';
  const tab = p.accent === 'ink' ? '000000' : blue;
  const size = (Number(p.fontScale) || 100) >= 104 ? '11pt' : '10pt';
  const gap = { compact: ['8pt', '3pt'], normal: ['12pt', '5pt'], airy: ['16pt', '8pt'] }[p.density] || ['12pt', '5pt'];
  const nameSize = { md: '\\LARGE', lg: '\\huge', xl: '\\Huge' }[p.nameSize] || '\\Huge';
  const photo = Boolean(photoSource(p, config));
  const lf = p.latexFont || 'lmodern';
  const font = lf === 'helvet' ? '\\usepackage[scaled=0.92]{helvet}\n\\renewcommand{\\familydefault}{\\sfdefault}' : lf === 'times' ? '\\usepackage{mathptmx}' : '\\IfFileExists{lmodern.sty}{\\usepackage{lmodern}}{}';
  const linkStyle = {
    bold: '\\newcommand{\\cvlink}[2]{\\href{#1}{\\textbf{#2}}}',
    underline: '\\newcommand{\\cvlink}[2]{\\href{#1}{\\underline{#2}}}',
    accent: '\\newcommand{\\cvlink}[2]{\\href{#1}{\\textcolor{cvblue}{#2}}}',
    plain: '\\newcommand{\\cvlink}[2]{\\href{#1}{#2}}',
  }[p.linkStyle || 'bold'];
  const titleLink = p.linkStyle === 'underline' ? '\\newcommand{\\cvtitlelink}[2]{\\href{#1}{\\textbf{\\underline{#2}}}}' : p.linkStyle === 'accent' ? '\\newcommand{\\cvtitlelink}[2]{\\href{#1}{\\textbf{\\textcolor{cvblue}{#2}}}}' : '\\newcommand{\\cvtitlelink}[2]{\\href{#1}{\\textbf{#2}}}';

  const summary = p.summary?.trim() ? `\\begin{cvsection}{${tex(p.summaryTitle || 'Profile')}}\n${mdToLatex(p.summary)}\n\\end{cvsection}` : '';
  const blocks = (p.blocks || []).map((b) => boxedBlock(b, { schema, items, config, p })).filter(Boolean);
  const paper = p.pageSize === 'Letter' ? 'letterpaper' : 'a4paper';

  return `${LATEX_MARKER}
% CV of ${tex(name)}, generated from ${short(SITE_URL)} (boxed style).
% Edit freely, then compile with pdflatex. For the header photo, put an image named photo.jpg next to this file.
\\documentclass[${size},${paper}]{article}

\\usepackage[${paper},top=1.35cm,bottom=1.35cm,left=1.45cm,right=1.45cm]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
${font}
\\usepackage{microtype}
\\usepackage{xcolor}
\\usepackage{tabularx}
\\usepackage{enumitem}
\\usepackage[most]{tcolorbox}
\\usepackage{graphicx}
\\usepackage{xurl}
\\usepackage[hidelinks,pdftitle={${tex(name)} - CV},pdfauthor={${tex(name)}}]{hyperref}
% Every glyph maps back to Unicode text, so ATS parsers read the PDF exactly.
\\input{glyphtounicode}
\\pdfgentounicode=1

\\definecolor{cvblue}{HTML}{${blue}}
\\definecolor{cvtab}{HTML}{${tab}}
\\definecolor{cvgray}{RGB}{80,80,80}
\\urlstyle{same}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\newlength{\\cvitemgap}\\setlength{\\cvitemgap}{${gap[1]}}

% Section: frame with the title on a tab across the top border.
% cvsection never splits across pages; cvsectionflow (long sections) may continue on the next page.
\\tcbset{cvsec/.style={enhanced, sharp corners, colback=white, colframe=black, boxrule=0.6pt,
  left=6pt, right=6pt, top=11pt, bottom=6pt, before skip=${gap[0]}, after skip=0pt,
  fonttitle=\\bfseries, coltitle=white,
  attach boxed title to top left={xshift=8pt, yshift=-\\tcboxedtitleheight/2},
  boxed title style={sharp corners, colback=cvtab, colframe=cvtab, boxrule=0pt, left=5pt, right=5pt, top=2pt, bottom=2pt}}}
\\newtcolorbox{cvsection}[1]{cvsec, title={#1}}
\\newtcolorbox{cvsectionflow}[1]{cvsec, breakable, title={#1}}
\\newtcolorbox{cvheader}{%
  enhanced, sharp corners, colback=white, colframe=black, boxrule=0.6pt,
  left=8pt, right=8pt, top=6pt, bottom=6pt, before skip=0pt, after skip=0pt
}
\\setlist[enumerate]{leftmargin=2em, topsep=1pt, itemsep=4pt, parsep=0pt, partopsep=0pt}
\\setlist[itemize]{leftmargin=1.4em, topsep=1pt, itemsep=2pt, parsep=0pt, partopsep=0pt}
\\newcommand{\\contactsep}{\\hspace{0.6em}{\\color{cvblue}\\textbar}\\hspace{0.6em}}
\\newcommand{\\courseseparator}{\;\\textcolor{cvblue}{\\textbar}\;}
${linkStyle}
${titleLink}

\\begin{document}

\\begin{cvheader}
\\noindent
\\begin{minipage}[c]{${photo ? '0.75' : '1'}\\linewidth}${p.headerAlign === 'center' ? '\\centering' : ''}
  {${nameSize}\\bfseries ${p.accent === 'ink' ? '' : '\\color{cvblue}'}\\MakeUppercase{${tex(name)}}}\\\\[4pt]
${headline.map((l) => `  ${tex(l)}\\\\[2pt]`).join('\n')}
  \\vspace{3pt}
${line1.length ? `  ${join(line1)}\\\\[2pt]\n` : ''}${line2.length ? `  ${join(line2)}\n` : ''}\\end{minipage}${
    photo
      ? `
\\hfill
\\begin{minipage}[c]{0.19\\linewidth}
  \\raggedleft
  \\IfFileExists{photo.jpg}{\\includegraphics[width=2.8cm,height=3.3cm,keepaspectratio]{photo.jpg}}{\\IfFileExists{photo.png}{\\includegraphics[width=2.8cm,height=3.3cm,keepaspectratio]{photo.png}}{}}
\\end{minipage}`
      : ''
  }
\\end{cvheader}

${summary}

${blocks.join('\n\n')}

\\end{document}
`;
}

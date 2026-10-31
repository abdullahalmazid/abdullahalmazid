'use client';
/**
 * Pasted HTML, shown one of two ways:
 *
 *  inline   - part of the page: uses the site's fonts and colours, is
 *             indexed by search engines. Sanitised: no <style>, no scripts.
 *  isolated - a full HTML page with its own <style>, <link> and <script>
 *             (charts, animations, a design exported from another tool).
 *             Rendered in a sandboxed frame that grows to fit its content,
 *             so its CSS cannot break the menu or other sections, and its
 *             scripts cannot read the site, its cookies or the signed-in
 *             editor. The site's colours and fonts are passed in as CSS
 *             variables (var(--accent), var(--font-body)…) and follow the
 *             light/dark switch.
 *
 *  auto     - isolated when the code has <style>, <script>, <link> or a full
 *             <html> document; inline otherwise.
 */
import Markdown from '@/components/ui/Markdown';
import { fontsHref, luminance, themeVars } from '@/lib/themes';
import { useActiveTheme } from '@/lib/useActiveTheme';
import { cx, uid } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';

export const needsIsolation = (code) => /<(style|script|link|html|head|body|canvas|svg[^>]*\bonload)\b/i.test(String(code || ''));

export function resolveHtmlMode(mode, code) {
  if (mode === 'inline' || mode === 'isolated') return mode;
  return needsIsolation(code) ? 'isolated' : 'inline';
}

const stripScripts = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

function buildDoc(code, { id, vars, fonts, theme, scripts }) {
  const user = scripts ? code : stripScripts(code);
  const varsCss = Object.entries(vars).map(([k, v]) => `${k}:${v};`).join('');
  const base = theme
    ? `<link rel="stylesheet" href="${fonts}"><style>:root{${varsCss}color-scheme:${luminance(vars['--bg-primary']) < 0.5 ? 'dark' : 'light'}}html,body{margin:0;background:transparent;color:var(--text-primary);font-family:var(--font-body);font-size:var(--base-size);line-height:1.6}a{color:var(--accent)}img,video,iframe{max-width:100%}*{box-sizing:border-box}</style>`
    : `<style>html,body{margin:0}img,video,iframe{max-width:100%}</style>`;
  // Reports the content height so the frame can grow and shrink with it.
  const resize = `<script>(function(){var last=0;function send(){var h=Math.ceil(Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0));if(Math.abs(h-last)>1){last=h;parent.postMessage({aamFrame:${JSON.stringify(id)},h:h},'*');}}addEventListener('load',send);if(window.ResizeObserver){new ResizeObserver(send).observe(document.documentElement);}setInterval(send,800);send();})();</script>`;
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">${base}`;
  if (/<html[\s>]/i.test(user)) {
    let doc = /<head[\s>]/i.test(user) ? user.replace(/<head([^>]*)>/i, `<head$1>${head}`) : user.replace(/<html([^>]*)>/i, `<html$1><head>${head}</head>`);
    doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, `${resize}</body>`) : `${doc}${resize}`;
    return doc.startsWith('<!') ? doc : `<!doctype html>${doc}`;
  }
  return `<!doctype html><html><head>${head}</head><body>${user}${resize}</body></html>`;
}

function IsolatedHtml({ code, theme = true, scripts = true, minHeight = 0, title = 'Embedded content', className }) {
  const frame = useRef(null);
  const id = useMemo(() => uid('f'), []);
  const active = useActiveTheme();
  const [height, setHeight] = useState(Number(minHeight) || 120);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const doc = useMemo(
    () => (ready ? buildDoc(String(code || ''), { id, vars: themeVars(active), fonts: fontsHref(active.fonts), theme, scripts }) : ''),
    [ready, code, id, active, theme, scripts]
  );

  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== frame.current?.contentWindow || e.data?.aamFrame !== id) return;
      const h = Number(e.data.h);
      if (h > 0 && h < 50000) setHeight(Math.max(Number(minHeight) || 0, h));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [id, minHeight]);

  return (
    <iframe
      ref={frame}
      title={title}
      srcDoc={doc || undefined}
      // No allow-same-origin: the frame cannot reach this site's storage, cookies or editor session.
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals"
      loading="lazy"
      className={cx('block w-full border-0 bg-transparent', className)}
      style={{ height, colorScheme: 'normal' }}
    />
  );
}

export default function HtmlContent({ code, mode = 'auto', theme = true, scripts = true, minHeight = 0, className = '' }) {
  const text = String(code || '');
  if (!text.trim()) return null;
  if (resolveHtmlMode(mode, text) === 'isolated') {
    return <IsolatedHtml code={text} theme={theme} scripts={scripts} minHeight={minHeight} className={className} />;
  }
  // Inline: sanitised and rendered as part of the page (Markdown also works here).
  return <Markdown className={className}>{text}</Markdown>;
}

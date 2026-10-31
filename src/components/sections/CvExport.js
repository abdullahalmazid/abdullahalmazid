'use client';
/**
 * CV download.
 *   Download CV (PDF) - builds the .tex from the current CV and compiles it on
 *                       /api/latex. Everyone sees this one button. Ctrl+P on
 *                       the CV page does the same, so a printed CV is always
 *                       the LaTeX one.
 *   Open in Overleaf  - (editors) the same .tex in a new Overleaf project, to
 *                       tailor one application without changing the website.
 *                       Overleaf receives the .tex only: upload photo.jpg there.
 *   .tex              - (editors) the source file.
 */
import { useAdmin } from '@/context/AdminContext';
import { buildCvLatex, latexAssets } from '@/lib/cvLatex';
import { useConfig, useItemsMap, useSchema } from '@/lib/store';
import { themeColors } from '@/lib/themes';
import { Download, FileCode2, Loader2, SquarePen } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

function save(blob, name) {
  const href = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}

export default function CvExport({ props }) {
  const config = useConfig();
  const schema = useSchema();
  const items = useItemsMap();
  const { isAdmin } = useAdmin();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const base = `${(props.name?.trim() || config.person?.name || 'CV').replace(/[^\w]+/g, '_')}_CV`;

  const source = useCallback(
    () => buildCvLatex({ props: { ...props, accentHex: themeColors(config.theme)['--accent'] }, config, schema, items }),
    [props, config, schema, items]
  );

  const pdf = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const id = toast.loading('Preparing your CV…');
    try {
      const res = await fetch('/api/latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tex: source(), files: latexAssets(props, config) }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Could not create the PDF (${res.status}).`);
      save(await res.blob(), `${base}.pdf`);
      toast.success('CV downloaded', { id });
    } catch (err) {
      toast.error(`${err.message} Please try again in a moment.`, { id, duration: 7000 });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [source, props, config, base]);

  // Ctrl+P / ⌘P on the CV page downloads the LaTeX PDF instead of printing the web page.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        pdf();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pdf]);

  const overleaf = () => {
    const form = Object.assign(document.createElement('form'), { method: 'POST', action: 'https://www.overleaf.com/docs', target: '_blank' });
    for (const [name, value] of Object.entries({ encoded_snip: encodeURIComponent(source()), snip_name: base, engine: 'pdflatex' })) {
      form.appendChild(Object.assign(document.createElement('input'), { type: 'hidden', name, value }));
    }
    document.body.appendChild(form);
    form.submit();
    form.remove();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={pdf} disabled={busy} className="btn btn-solid">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download CV (PDF)
      </button>
      {isAdmin && (
        <>
          <button type="button" onClick={overleaf} className="btn btn-outline" data-tip="Open in Overleaf|The LaTeX source in a new Overleaf project. Tailor it for one job without changing your website.">
            <SquarePen size={16} /> Open in Overleaf
          </button>
          <button type="button" onClick={() => save(new Blob([source()], { type: 'application/x-tex' }), `${base}.tex`)} className="btn btn-outline" data-tip=".tex file|The LaTeX source, to compile anywhere.">
            <FileCode2 size={16} /> .tex
          </button>
        </>
      )}
    </div>
  );
}

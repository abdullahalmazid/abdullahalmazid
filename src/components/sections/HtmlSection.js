'use client';
/** A section made of pasted HTML (see components/ui/HtmlContent for the two display modes). */
import HtmlContent, { resolveHtmlMode } from '@/components/ui/HtmlContent';

export default function HtmlSection({ section, editMode }) {
  const p = section.props;
  const mode = resolveHtmlMode(p.mode, p.code);
  return (
    <div>
      {editMode && p.mode === 'auto' && (
        <p className="ui mb-2 text-[11.5px] text-slate-500">
          Shown {mode === 'isolated' ? 'isolated (own CSS and scripts)' : 'inline (site styles)'}. Change it under Content, Display.
        </p>
      )}
      <HtmlContent code={p.code} mode={p.mode} theme={p.useSiteTheme !== false} scripts={p.allowScripts !== false} minHeight={p.minHeight} />
    </div>
  );
}

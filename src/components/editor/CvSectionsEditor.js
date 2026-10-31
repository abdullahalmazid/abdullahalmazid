'use client';
/**
 * Editor for the sections of a CV.
 *
 * Each CV section is a card: drag order with the arrows, hide it without
 * deleting it, and open it to choose
 *   Entries - which list, which entries (all / filtered / hand-picked in
 *             your own order), sort and how many
 *   Show    - which parts of each entry appear (details, dates, description,
 *             tools, image, links)
 *   Format  - entries, bullets, numbers, citations, one line per category;
 *             main or side column; start on a new page
 */
import Icon from '@/components/ui/Icon';
import { CV_DESCRIPTION, CV_FORMATS, newCvBlock, normalizeCvBlock } from '@/lib/cv';
import { useCollectionItems, useSchema } from '@/lib/store';
import { clone, cx, move } from '@/lib/utils';
import { ArrowDown, ArrowUp, ChevronDown, Copy, Eye, EyeOff, Plus, Trash2, Type } from 'lucide-react';
import { useState } from 'react';
import { FieldList, ItemsPicker, MarkdownField, Segmented } from './Fields';

function Summary({ b, def }) {
  const label = def?.label && def.label !== b.title ? `${def.label} · ` : '';
  const items = useCollectionItems(b.type === 'list' ? b.collection : '__none__');
  if (b.type === 'text') return <>Free text</>;
  const count = b.selection === 'manual' ? b.ids.length : b.limit ? Math.min(b.limit, items.length) : items.length;
  const fmt = CV_FORMATS.find((f) => f.value === b.format)?.label || b.format;
  return (
    <>
      {label}
      {count} {count === 1 ? 'entry' : 'entries'} · {fmt}
      {b.selection === 'manual' && ' · picked'}
    </>
  );
}

const SUBTABS = [
  { id: 'entries', label: 'Entries' },
  { id: 'show', label: 'Show' },
  { id: 'format', label: 'Format' },
];

function BlockBody({ b, set, sidebar }) {
  const schema = useSchema();
  const [tab, setTab] = useState('entries');
  const collections = Object.entries(schema.collections || {});
  const def = schema.collections?.[b.collection];
  const sortable = (def?.fields || []).filter((f) => !['image', 'gallery', 'markdown'].includes(f.type));

  if (b.type === 'text') {
    return (
      <div className="space-y-3 p-3">
        <FieldList
          fields={[
            { key: 'title', label: 'Heading', type: 'text', full: true },
            ...(sidebar ? [{ key: 'column', label: 'Column', type: 'segmented', options: [{ value: 'main', label: 'Main' }, { value: 'side', label: 'Side' }] }] : []),
            { key: 'pageBreak', label: 'Start on a new page when printed', type: 'toggle' },
          ]}
          value={b}
          onChange={set}
        />
        <div>
          <p className="ui-label">Text</p>
          <MarkdownField value={b.text} onChange={(text) => set({ ...b, text })} rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-3">
        <Segmented forceButtons options={SUBTABS.map((t) => ({ value: t.id, label: t.label }))} value={tab} onChange={setTab} />
      </div>

      {tab === 'entries' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <p className="ui-label">Heading</p>
              <input className="ui-input" value={b.title} placeholder={def?.label} onChange={(e) => set({ ...b, title: e.target.value })} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="ui-label">From the list</p>
              <select className="ui-input" value={b.collection} onChange={(e) => set({ ...b, collection: e.target.value, ids: [], filterField: '', filterValue: '', sortField: '' })}>
                {collections.map(([key, c]) => (
                  <option key={key} value={key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="ui-label">Which entries</p>
            <Segmented
              forceButtons
              options={[
                { value: 'all', label: 'All' },
                { value: 'filter', label: 'Only some' },
                { value: 'manual', label: 'Pick & order' },
              ]}
              value={b.selection}
              onChange={(selection) => set({ ...b, selection })}
            />
            <p className="ui-help">
              {b.selection === 'manual'
                ? 'Choose entries and arrange them: the first one is shown on top.'
                : b.selection === 'filter'
                  ? 'Only entries where a field has a value, e.g. Category = Machine learning.'
                  : 'Every entry in the list, in the order below.'}
            </p>
          </div>

          {b.selection === 'manual' && <ItemsPicker root={b} from="collection" value={b.ids} onChange={(ids) => set({ ...b, ids })} />}

          {b.selection === 'filter' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="ui-label">Field</p>
                <select className="ui-input" value={b.filterField} onChange={(e) => set({ ...b, filterField: e.target.value, filterValue: '' })}>
                  <option value="">Choose…</option>
                  {sortable.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="ui-label">Equals</p>
                {(() => {
                  const f = sortable.find((x) => x.key === b.filterField);
                  return f?.options?.length ? (
                    <select className="ui-input" value={b.filterValue} onChange={(e) => set({ ...b, filterValue: e.target.value })}>
                      <option value="">Choose…</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input className="ui-input" value={b.filterValue} onChange={(e) => set({ ...b, filterValue: e.target.value })} />
                  );
                })()}
              </div>
            </div>
          )}

          {b.selection !== 'manual' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <p className="ui-label">Sort by</p>
                <select className="ui-input" value={b.sortField} onChange={(e) => set({ ...b, sortField: e.target.value })}>
                  <option value="">List’s default</option>
                  <option value="order">Your order in Content</option>
                  {sortable.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="ui-label">Direction</p>
                <select className="ui-input" value={b.sortDir} disabled={!b.sortField} onChange={(e) => set({ ...b, sortDir: e.target.value })}>
                  <option value="">Default</option>
                  <option value="asc">A → Z / oldest first</option>
                  <option value="desc">Z → A / newest first</option>
                </select>
              </div>
              <div>
                <p className="ui-label">Show at most</p>
                <input type="number" min={0} className="ui-input" value={b.limit || ''} placeholder="All" onChange={(e) => set({ ...b, limit: Number(e.target.value) || 0 })} />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'show' && (
        <div className="space-y-4">
          <div>
            <p className="ui-label">Description</p>
            <Segmented forceButtons options={CV_DESCRIPTION} value={b.description} onChange={(description) => set({ ...b, description })} />
            <p className="ui-help">“Bullet points only” keeps the list items of a description (or one bullet per sentence).</p>
          </div>
          <FieldList
            fields={[
              { key: 'showSubtitle', label: 'Second line (organisation, venue, summary…)', type: 'toggle' },
              { key: 'showMeta', label: 'Detail line (location, authors, context…)', type: 'toggle' },
              { key: 'showDate', label: 'Date / year', type: 'toggle' },
              { key: 'showBadge', label: 'Badge (grade, result…)', type: 'toggle' },
              { key: 'showTags', label: 'Tags (tools, stack, keywords)', type: 'toggle' },
              { key: 'showImage', label: 'Image or logo', type: 'toggle', help: 'A small picture beside each entry.' },
              { key: 'showLinks', label: 'Link buttons (Code, Demo, Paper…)', type: 'toggle' },
              { key: 'showDetails', label: 'Extra fields (email, DOI, my role…)', type: 'toggle', help: 'Shown as “Label: value” lines, e.g. a referee’s email.' },
              { key: 'swapTitle', label: 'Organisation first', type: 'toggle', help: 'Puts the second line on top: e.g. the university in bold, the degree below.' },
              { key: 'linkTitle', label: 'Title links to its page on the site', type: 'toggle' },
            ]}
            value={b}
            onChange={set}
          />
          {b.showTags && (
            <div>
              <p className="ui-label">Label before tags</p>
              <input className="ui-input" value={b.tagsLabel} placeholder="e.g. Tools:" onChange={(e) => set({ ...b, tagsLabel: e.target.value })} />
            </div>
          )}
        </div>
      )}

      {tab === 'format' && (
        <div className="space-y-4">
          <div>
            <p className="ui-label">Show the entries as</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {CV_FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => set({ ...b, format: f.value })}
                  className={cx('rounded-lg border px-3 py-2 text-left transition', b.format === f.value ? 'border-[#0d7a6f] bg-[#ddf1ee]/60 ring-1 ring-[#0d7a6f]/30' : 'border-slate-200 hover:border-slate-400')}
                >
                  <span className="block text-[12.5px] font-semibold text-slate-800">{f.label}</span>
                  <span className="block text-[11.5px] leading-snug text-slate-500">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <FieldList
            fields={[
              ...(b.format === 'entries'
                ? [{ key: 'rightSide', label: 'Right side of the title line', type: 'segmented', options: [{ value: 'date', label: 'Date' }, { value: 'group', label: 'Category' }, { value: 'both', label: 'Both' }, { value: 'none', label: 'Nothing' }] }]
                : []),
              ...(b.format === 'citations'
                ? [{ key: 'citeStyle', label: 'Citation style', type: 'segmented', options: [{ value: 'ieee', label: 'IEEE (authors first)' }, { value: 'short', label: 'Title first + DOI' }] }]
                : []),
              ...(sidebar ? [{ key: 'column', label: 'Column', type: 'segmented', options: [{ value: 'main', label: 'Main' }, { value: 'side', label: 'Side' }] }] : []),
              { key: 'pageBreak', label: 'Start on a new page when printed', type: 'toggle' },
            ]}
            value={b}
            onChange={set}
          />
          {!sidebar && <p className="ui-help">Tip: choose “Two columns” under Look to put short sections (skills, languages) in a side column.</p>}
        </div>
      )}
    </div>
  );
}

export default function CvSectionsEditor({ value, onChange, root }) {
  const schema = useSchema();
  const list = (Array.isArray(value) ? value : []).map(normalizeCvBlock);
  const [open, setOpen] = useState(null);
  const sidebar = root?.props?.layout === 'sidebar';
  const update = (i, next) => onChange(list.map((x, j) => (j === i ? next : x)));
  const add = (block) => {
    onChange([...list, block]);
    setOpen(list.length);
  };

  return (
    <div className="space-y-2">
      <p className="ui-help !mt-0">Top to bottom as on the CV. Click a section to choose its entries and format. The eye hides it without deleting.</p>
      {list.map((b, i) => {
        const def = schema.collections?.[b.collection];
        const isOpen = open === i;
        return (
          <div key={i} className={cx('rounded-xl border bg-white transition', isOpen ? 'border-[#0d7a6f]/50 shadow-sm' : 'border-slate-200', b.hidden && 'opacity-60')}>
            <div className="flex items-center gap-1 py-1.5 pl-2 pr-1.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500">{i + 1}</span>
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 px-1.5 text-left" aria-expanded={isOpen}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#0d7a6f]/10 text-[#0d7a6f]">
                  {b.type === 'text' ? <Type size={14} /> : <Icon name={def?.icon} size={14} fallback={<Icon name="FileText" size={14} />} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-slate-900">
                    {b.title || def?.label || 'Untitled'}
                    {b.hidden && <span className="ml-1.5 font-normal text-slate-400">(hidden)</span>}
                    {sidebar && b.column === 'side' && <span className="ml-1.5 rounded bg-slate-100 px-1 text-[10.5px] font-medium text-slate-500">side</span>}
                  </span>
                  <span className="block truncate text-[11.5px] text-slate-500">
                    <Summary b={b} def={def} />
                  </span>
                </span>
                <ChevronDown size={15} className={cx('shrink-0 text-slate-400 transition-transform', !isOpen && '-rotate-90')} />
              </button>
              <button type="button" className="ui-icon-btn !h-7 !w-7" onClick={() => update(i, { ...b, hidden: !b.hidden })} aria-label={b.hidden ? 'Show on the CV' : 'Hide from the CV'} data-tip={b.hidden ? 'Show|Put this section back on the CV.' : 'Hide|Keep it here but leave it off the CV.'}>
                {b.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button type="button" className="ui-icon-btn !h-7 !w-7" disabled={i === 0} onClick={() => (onChange(move(list, i, i - 1)), setOpen(isOpen ? i - 1 : open))} aria-label="Move up">
                <ArrowUp size={13} />
              </button>
              <button type="button" className="ui-icon-btn !h-7 !w-7" disabled={i === list.length - 1} onClick={() => (onChange(move(list, i, i + 1)), setOpen(isOpen ? i + 1 : open))} aria-label="Move down">
                <ArrowDown size={13} />
              </button>
            </div>
            {isOpen && (
              <div className="border-t border-slate-100">
                <BlockBody b={b} set={(next) => update(i, next)} sidebar={sidebar} />
                <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2">
                  <button type="button" className="ui-btn !py-1 !text-[12px]" onClick={() => (onChange([...list.slice(0, i + 1), clone(b), ...list.slice(i + 1)]), setOpen(i + 1))}>
                    <Copy size={13} /> Duplicate
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn-danger ml-auto !py-1 !text-[12px]"
                    onClick={() => window.confirm(`Remove “${b.title || def?.label}” from the CV?`) && (onChange(list.filter((_, j) => j !== i)), setOpen(null))}
                  >
                    <Trash2 size={13} /> Remove section
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <select
          className="ui-input !border-dashed"
          value=""
          onChange={(e) => e.target.value && add(newCvBlock('list', e.target.value, schema.collections?.[e.target.value]?.label || ''))}
          aria-label="Add a section from a list"
        >
          <option value="">+ Add a list…</option>
          {Object.entries(schema.collections || {}).map(([key, c]) => (
            <option key={key} value={key}>
              {c.label}
            </option>
          ))}
        </select>
        <button type="button" className="ui-btn !border-dashed" onClick={() => add(newCvBlock('text'))}>
          <Plus size={14} /> Add free text
        </button>
      </div>
    </div>
  );
}

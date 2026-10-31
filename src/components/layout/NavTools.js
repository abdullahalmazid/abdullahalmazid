'use client';
/** Menu-bar tools: search (⌘K) and the visitor's light/dark switch. */
import { setColorChoice, useColorChoice } from '@/lib/colorMode';
import { useConfig } from '@/lib/store';
import { cx } from '@/lib/utils';
import { Moon, Search, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { openPalette } from './CommandPalette';

export default function NavTools() {
  const config = useConfig();
  const theme = config.theme || {};
  const { choice, system } = useColorChoice();
  const [mac, setMac] = useState(true);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)), []);

  const toggle = theme.visitorToggle && theme.darkPreset;
  const fallback = (theme.defaultMode || 'system') === 'system' ? system : theme.defaultMode;
  const dark = (choice || fallback) === 'dark';
  const showSearch = config.nav?.search !== false;
  if (!toggle && !showSearch) return null;

  const btn = 'grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink2 transition-colors hover:border-accent hover:text-accent';
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {showSearch && (
        <>
          <button type="button" onClick={openPalette} className={cx(btn, 'lg:hidden')} aria-label="Search">
            <Search size={17} />
          </button>
          <button
            type="button"
            onClick={openPalette}
            className="hidden h-10 items-center gap-2 rounded-full border border-line pl-3 pr-1.5 text-[0.85rem] text-muted transition-colors hover:border-accent hover:text-ink lg:inline-flex"
            aria-label="Search the site"
          >
            <Search size={15} />
            <span className="xl:pr-6">Search</span>
            <kbd className="rounded-full bg-bg2 px-2 py-0.5 font-mono text-[0.7rem] text-ink2">{mac ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
        </>
      )}
      {toggle && (
        <button
          type="button"
          onClick={() => setColorChoice(dark ? 'light' : 'dark')}
          className={btn}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      )}
    </div>
  );
}

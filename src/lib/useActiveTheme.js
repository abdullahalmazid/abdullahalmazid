'use client';
/** The theme currently on screen: the saved theme, switched to its dark palette when the visitor (or their device) prefers dark. */
import { useMemo } from 'react';
import { useColorChoice } from './colorMode';
import { useConfig } from './store';
import { themeForMode } from './themes';

export function useActiveTheme() {
  const config = useConfig();
  const { choice, system } = useColorChoice();
  const theme = config.theme || {};
  const dark =
    Boolean(theme.visitorToggle && theme.darkPreset) &&
    (choice ? choice === 'dark' : (theme.defaultMode || 'system') === 'system' ? system === 'dark' : theme.defaultMode === 'dark');
  return useMemo(() => themeForMode(theme, dark ? 'dark' : 'light'), [theme, dark]);
}

'use client';
/**
 * Visitor light/dark preference.
 *
 * The choice lives in this browser only ('light' | 'dark' | null = follow the
 * device). Components read the resolved mode with useColorMode(); Boot applies
 * the matching theme to <html>.
 */
import { useSyncExternalStore } from 'react';
import { MODE_KEY } from './themes';
import { safeLocalStorage } from './utils';

const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

function subscribe(listener) {
  listeners.add(listener);
  const mq = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : null;
  mq?.addEventListener?.('change', listener);
  const onStorage = (e) => e.key === MODE_KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    mq?.removeEventListener?.('change', listener);
    window.removeEventListener('storage', onStorage);
  };
}

const read = () => {
  const v = safeLocalStorage()?.getItem(MODE_KEY);
  return v === 'light' || v === 'dark' ? v : '';
};
const systemDark = () => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

/** The visitor's stored choice ('' = none) and the device preference. */
export function useColorChoice() {
  const choice = useSyncExternalStore(subscribe, read, () => '');
  const system = useSyncExternalStore(subscribe, systemDark, () => 'light');
  return { choice, system };
}

export function setColorChoice(value) {
  const ls = safeLocalStorage();
  try {
    if (value === 'light' || value === 'dark') ls?.setItem(MODE_KEY, value);
    else ls?.removeItem(MODE_KEY);
  } catch {
    /* private mode: the choice lasts for this page view only */
  }
  emit();
}

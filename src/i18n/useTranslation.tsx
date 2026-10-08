import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_LOCALE, LOCALES, resolveLocale } from '@/i18n/index';
import type { I18nDictionary, Locale } from '@/i18n/types';
import { getJsonStorage, setJsonStorage } from '@/lib/storage';

const STORAGE_KEY = 'hue-chef-locale';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DeepKey<I18nDictionary> | string, params?: Record<string, unknown>) => string;
  dict: I18nDictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

type DeepKey<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends (...args: never[]) => unknown
          ? K
          : T[K] extends object
          ? `${K}.${DeepKey<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function renderTemplate(value: unknown, params?: Record<string, unknown>): string {
  if (typeof value === 'function') {
    try {
      return String(value(...Object.values(params ?? {})));
    } catch {
      return String(value);
    }
  }
  if (typeof value !== 'string') {
    return String(value ?? '');
  }
  if (!params) return value;
  let out = value;
  for (const [k, v] of Object.entries(params)) {
    out = out.split(`{${k}}`).join(String(v ?? ''));
  }
  return out;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = getJsonStorage<Locale>(STORAGE_KEY);
    const initial = resolveLocale(stored);
    if (initial !== DEFAULT_LOCALE) setLocaleState(initial);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    const resolved = resolveLocale(next);
    setLocaleState(resolved);
    setJsonStorage<Locale>(STORAGE_KEY, resolved);
  }, []);

  const dict = LOCALES[locale];

  const t = useCallback(
    (key: string, params?: Record<string, unknown>): string => {
      const val = getByPath(dict, key);
      if (val === undefined) {
        const fallback = getByPath(LOCALES[DEFAULT_LOCALE], key);
        if (fallback === undefined) return key;
        return renderTemplate(fallback, params);
      }
      return renderTemplate(val, params);
    },
    [dict],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, dict }),
    [locale, setLocale, t, dict],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return ctx;
}

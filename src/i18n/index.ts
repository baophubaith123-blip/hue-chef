import { vi } from '@/i18n/locales/vi';
import { en } from '@/i18n/locales/en';
import type { I18nDictionary, Locale } from '@/i18n/types';

export const LOCALES: Record<Locale, I18nDictionary> = {
  vi,
  en,
};

export const DEFAULT_LOCALE: Locale = 'vi';

export function resolveLocale(raw: unknown): Locale {
  if (raw === 'vi' || raw === 'en') return raw;
  return DEFAULT_LOCALE;
}

export type { I18nDictionary, Locale };

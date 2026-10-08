import type { ReactNode } from 'react';

import { LanguageProvider, useTranslation } from '@/i18n/useTranslation';
import type { Locale } from '@/i18n/types';

export function LanguageContextProvider({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

export { useTranslation };
export type { Locale };

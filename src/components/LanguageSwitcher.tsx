import { useTheme } from '@/contexts/ThemeContext';
import type { Locale } from '@/i18n/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const options: { key: Locale; labelKey: 'vi' | 'en' }[] = [
    { key: 'vi', labelKey: 'vi' },
    { key: 'en', labelKey: 'en' },
  ];

  return (
    <div
      className={styles.wrap}
      role="group"
      aria-label={t('language.switch')}
      title={t('language.switch')}
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`${styles.btn} ${locale === opt.key ? styles.btnActive : ''}`}
          onClick={() => setLocale(opt.key)}
          aria-pressed={locale === opt.key}
        >
          {t(`language.${opt.labelKey}`)}
        </button>
      ))}
      <button
        type="button"
        className={`${styles.btn} ${theme === 'dark' ? styles.btnActive : ''}`}
        onClick={toggleTheme}
        aria-pressed={theme === 'dark'}
        title={t('theme.toggle')}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>
    </div>
  );
}

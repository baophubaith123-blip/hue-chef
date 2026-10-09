import { Link } from 'react-router-dom';

import { useTranslation } from '@/i18n/useTranslation';

import styles from './Footer.module.css';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.made}>
            <span className={styles.madeIcon} aria-hidden="true">❤️</span>
            {t('footer.madeIn')}
          </span>
          <span>{t('footer.copyright', { year } as Record<string, unknown>)}</span>
          <span>{t('footer.author')}</span>
        </div>
        <nav className={styles.links} aria-label="Footer">
          <Link to="/help" className={styles.link}>{t('header.help')}</Link>
          <Link to="/feedback" className={styles.link}>{t('header.feedback')}</Link>
          <Link to="/about" className={styles.link}>{t('header.about')}</Link>
        </nav>
      </div>
    </footer>
  );
}

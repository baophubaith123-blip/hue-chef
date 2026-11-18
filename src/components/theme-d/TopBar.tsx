import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useTranslation } from '@/i18n/useTranslation';
import styles from '@/components/theme-d/TopBar.module.css';

interface TopBarProps {
  children?: ReactNode;
}

/**
 * Theme D public top bar — plum band, big gold "Vào game" first, then
 * Giới thiệu → Trợ giúp → Góp ý (Phase 20 order, Theme D skin).
 */
export function TopBar({ children }: TopBarProps) {
  const { t } = useTranslation();
  return (
    <header className={styles.bar}>
      <Link to="/" className={styles.brand} aria-label={t('header.logo')}>
        <img className={styles.brandImg} src="/images/noi-noi.jpg" alt="" aria-hidden width={40} height={40} />
        <span className={styles.brandName}>{t('header.logo')}</span>
      </Link>
      <nav className={styles.nav} aria-label={t('header.logo')}>
        <Link to="/login" className={styles.enterGame}>
          🎮 {t('header.enterGame')}
        </Link>
        <Link to="/about" className={styles.link}>
          {t('header.about')}
        </Link>
        <Link to="/help" className={styles.link}>
          {t('header.help')}
        </Link>
        <Link to="/feedback" className={styles.link}>
          {t('header.feedback')}
        </Link>
        {children}
      </nav>
    </header>
  );
}

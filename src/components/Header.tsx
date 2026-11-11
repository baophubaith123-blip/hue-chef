import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { getDefaultPathForRole } from '@/features/auth/types';
import { useTranslation } from '@/i18n/useTranslation';

import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationBell } from './NotificationBell';

import styles from './Header.module.css';

export function Header() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        <Link
          to={user ? getDefaultPathForRole(user.role) : '/'}
          className={styles.brand}
          aria-label={t('header.logo')}
        >
          <span className={styles.brandIcon} aria-hidden="true">🍜</span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>{t('header.logo')}</span>
            <span className={styles.brandSub}>Hue Cuisine Game</span>
          </span>
        </Link>

        <Link
          to={user ? getDefaultPathForRole(user.role) : '/login'}
          className={styles.enterGameBtn}
        >
          🎮 {t('header.enterGame')}
        </Link>

        <nav className={styles.links} aria-label="Utility">
          <Link to="/about" className={styles.link}>{t('header.about')}</Link>
          <Link to="/help" className={styles.link}>{t('header.help')}</Link>
          <Link to="/feedback" className={styles.link}>{t('header.feedback')}</Link>
        </nav>

        <div className={styles.rightGroup}>
          {user ? <NotificationBell /> : null}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

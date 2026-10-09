import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
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
        <Link to={user ? (user.role === 'admin' ? '/admin' : user.role === 'editor' ? '/editor' : user.role === 'support' ? '/support' : '/') : '/'} className={styles.brand} aria-label={t('header.logo')}>
          <span className={styles.brandIcon} aria-hidden="true">🍜</span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>{t('header.logo')}</span>
            <span className={styles.brandSub}>Hue Cuisine Game</span>
          </span>
        </Link>

        <div className={styles.rightGroup}>
          <nav className={styles.links} aria-label="Utility">
            <Link to="/help" className={styles.link}>{t('header.help')}</Link>
            <Link to="/about" className={styles.link}>{t('header.about')}</Link>
            <Link to="/feedback" className={styles.link}>{t('header.feedback')}</Link>
          </nav>
          {user ? <NotificationBell /> : null}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

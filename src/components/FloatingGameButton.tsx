import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { getDefaultPathForRole } from '@/features/auth/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './FloatingGameButton.module.css';

/**
 * Fixed round Nồi Nồi button pinned to the bottom-right corner — drops the
 * visitor straight into the game from any scroll position.
 * Shown on the landing page and the about page.
 */
export function FloatingGameButton() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <Link
      to={user ? getDefaultPathForRole(user.role) : '/login'}
      className={styles.floatingPlay}
      aria-label={t('header.enterGame')}
      title={t('header.enterGame')}
    >
      <img src="/images/noi-noi.jpg" alt="" className={styles.floatingPlayImg} />
      <span className={styles.floatingPlayLabel}>{t('header.enterGame')}</span>
    </Link>
  );
}

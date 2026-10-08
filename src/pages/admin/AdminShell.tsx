import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/common/RoleShell.module.css';

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const { getPendingRecipes } = useRecipes();
  const pendingCount = getPendingRecipes().length;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandAccent}>🛡</span>
          <h1 className={styles.title}>Hue Chef · {t('roles.admin')}</h1>
        </div>
        <nav className={styles.nav} aria-label="Admin">
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/admin"
            end
          >
            {t('nav.dashboard')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, styles.navLinkCta, isActive ? styles.navLinkActive : '']
                .filter(Boolean)
                .join(' ')
            }
            to="/admin/review"
          >
            {t('nav.reviewQueue')}
            {pendingCount > 0 ? (
              <span className={styles.badgeAccent} aria-label={`${pendingCount} pending`}>
                {pendingCount}
              </span>
            ) : null}
          </NavLink>
          <Button variant="secondary" onClick={logout}>
            {t('common.signOut')}
          </Button>
        </nav>
      </header>
      {children}
    </div>
  );
}

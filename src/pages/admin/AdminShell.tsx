import { useMemo, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
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
  const admin = useAdmin();
  const pendingCount = getPendingRecipes().length;

  const openAppeals = useMemo(() => {
    try {
      const stats = admin.getDashboardStats();
      return stats.openAppealCount;
    } catch {
      return 0;
    }
  }, [admin]);

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
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/admin/broadcast"
          >
            📣 {t('nav.broadcast')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/admin/users"
          >
            {t('nav.users')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/admin/recipes"
          >
            {t('nav.recipes')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/admin/achievements"
          >
            {t('nav.achievements')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/admin/ingredients"
          >
            {t('nav.ingredients')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/admin/appeals"
          >
            {t('nav.appeals')}
            {openAppeals > 0 ? (
              <span className={styles.badgeAccent} aria-label={`${openAppeals} open`}>
                {openAppeals}
              </span>
            ) : null}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/admin/audit-log"
          >
            {t('nav.auditLog')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/admin/settings"
          >
            {t('nav.settings')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/admin/backup"
          >
            {t('nav.backup')}
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

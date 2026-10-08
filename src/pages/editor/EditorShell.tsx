import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/common/RoleShell.module.css';

interface EditorShellProps {
  children: ReactNode;
}

export function EditorShell({ children }: EditorShellProps) {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const { getRecipesByEditor } = useRecipes();
  const pendingCount = user?.id ? getRecipesByEditor(user.id).filter((r) => r.status === 'pending').length : 0;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandAccent}>🍜</span>
          <h1 className={styles.title}>Hue Chef · {t('roles.editor')}</h1>
        </div>
        <nav className={styles.nav} aria-label="Editor">
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/editor"
            end
          >
            {t('nav.dashboard')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/editor/recipes"
          >
            {t('nav.myRecipes')}
            {pendingCount > 0 ? (
              <span className={styles.badgeAccent} aria-label={`${pendingCount} pending`}>
                {pendingCount}
              </span>
            ) : null}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, styles.navLinkCta, isActive ? styles.navLinkActive : '']
                .filter(Boolean)
                .join(' ')
            }
            to="/editor/recipes/new"
          >
            ＋ {t('nav.newRecipe')}
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

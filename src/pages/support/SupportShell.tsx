import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useAppeals } from '@/contexts/AppealContext';
import { useSupport } from '@/contexts/SupportContext';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/common/RoleShell.module.css';

interface SupportShellProps {
  children: ReactNode;
}

export function SupportShell({ children }: SupportShellProps) {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const { listAppeals } = useAppeals();
  const { listThreadsForSupport } = useSupport();

  const openAppeals = listAppeals({ status: 'open' });
  const activeChats = user?.id ? listThreadsForSupport().filter((th) => !th.closed) : [];

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandAccent}>💬</span>
          <h1 className={styles.title}>Hue Chef · {t('roles.support')}</h1>
        </div>
        <nav className={styles.nav} aria-label="Support">
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/support"
            end
          >
            📊 {t('nav.dashboard')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/support/appeals"
          >
            ⚖️ {t('nav.appeals')}
            {openAppeals.length > 0 ? (
              <span
                className={styles.badgeAccent}
                aria-label={`${openAppeals.length} open appeals`}
              >
                {openAppeals.length}
              </span>
            ) : null}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, styles.navLinkCta, isActive ? styles.navLinkActive : '']
                .filter(Boolean)
                .join(' ')
            }
            to="/support/chat"
          >
            💬 {t('nav.chat')}
            {activeChats.length > 0 ? (
              <span className={styles.badgeAccent} aria-label={`${activeChats.length} active chats`}>
                {activeChats.length}
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

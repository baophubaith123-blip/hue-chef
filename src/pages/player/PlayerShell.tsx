import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useMail } from '@/contexts/MailContext';
import { WarningPopup } from '@/features/mail/components/WarningPopup';
import { BanNoticePopup } from '@/features/mail/components/BanNoticePopup';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/player/PlayerShell.module.css';

interface PlayerShellProps {
  children: ReactNode;
}

export function PlayerShell({ children }: PlayerShellProps) {
  const { user, logout } = useAuth();
  const { getUnreadCount } = useMail();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [warningShown, setWarningShown] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const userId = user?.id;
  const unread = userId ? getUnreadCount(userId) : 0;
  const warningCount = user?.warningCount ?? 0;
  const isBanned = user?.status === 'banned';

  useEffect(() => {
    if (warningCount > 0 && !warningShown) {
      setShowWarning(true);
      setWarningShown(true);
    }
  }, [warningCount, warningShown]);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          {import.meta.env.VITE_APP_NAME}
        </Link>
        <nav className={styles.nav} aria-label="Player">
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/"
            end
          >
            🏠 {t('nav.home')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/recipes"
          >
            🍲 {t('nav.recipes')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/achievements"
          >
            🏆 {t('nav.achievements')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/collection"
          >
            📔 {t('nav.collection')}
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            to="/inbox"
          >
            📬 {t('mail.inbox')}
            {unread > 0 ? (
              <span className={styles.badgeAccent} aria-label={`${unread} unread`}>
                {unread}
              </span>
            ) : null}
          </NavLink>
          <span className={styles.navLink}>{user?.name}</span>
          <Button
            variant="secondary"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            {t('auth.logout')}
          </Button>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      {showWarning && warningCount > 0 ? (
        <WarningPopup
          isOpen
          count={warningCount}
          onClose={() => setShowWarning(false)}
          onAfterAutoBan={() => navigate('/login', { replace: true })}
        />
      ) : null}
      <BanNoticePopup
        isOpen={isBanned}
        onAfterLogout={() => navigate('/login', { replace: true })}
      />
    </div>
  );
}

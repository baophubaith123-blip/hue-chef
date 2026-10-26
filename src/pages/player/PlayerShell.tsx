import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { AchievementIcon } from '@/components/AchievementIcon';
import { Button } from '@/components/Button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NotificationBell } from '@/components/NotificationBell';
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
  const { t, dict } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [warningShown, setWarningShown] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Determine current breadcrumb
  const breadcrumbCurrent = useMemo(() => {
    const p = location.pathname;
    if (p === '/home') return null;
    if (p.startsWith('/recipes/')) return dict.nav.recipes;
    if (p === '/recipes') return dict.nav.recipes;
    if (p.startsWith('/cooking/')) return t('cooking.pot');
    if (p === '/leaderboard') return dict.nav.leaderboard;
    if (p === '/achievements') return dict.nav.achievements;
    if (p === '/collection') return dict.nav.collection;
    if (p.startsWith('/inbox')) return dict.nav.inbox;
    if (p.startsWith('/profile')) return dict.nav.profile;
    return null;
  }, [location.pathname, dict, t]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.layout}>
      {mobileMenuOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar (Imperial Hue Plum) */}
      <aside
        className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}
        aria-label="Sidebar navigation"
      >
        <Link className={styles.brand} to="/home">
          <div className={styles.brandIcon} aria-hidden="true">🍜</div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Huế Chef</span>
            <span className={styles.brandSubtitle}>Đậm đà · Ẩm thực Cố Đô</span>
          </div>
        </Link>

        <nav className={styles.nav} aria-label="Player menu">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            end
          >
            <span className={styles.navIcon}>🏠</span>
            <span className={styles.navLabel}>{t('nav.home')}</span>
          </NavLink>

          <NavLink
            to="/recipes"
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
          >
            <span className={styles.navIcon}>🍲</span>
            <span className={styles.navLabel}>{t('nav.recipes')}</span>
          </NavLink>

          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
          >
            <span className={styles.navIcon}>🏆</span>
            <span className={styles.navLabel}>{t('nav.leaderboard')}</span>
          </NavLink>

          <NavLink
            to="/achievements"
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
          >
            <span className={styles.navIcon}>🎖️</span>
            <span className={styles.navLabel}>{t('nav.achievements')}</span>
          </NavLink>

          <NavLink
            to="/collection"
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
          >
            <span className={styles.navIcon}>📔</span>
            <span className={styles.navLabel}>{t('nav.collection')}</span>
          </NavLink>

          <NavLink
            to="/inbox"
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
          >
            <span className={styles.navIcon}>📬</span>
            <span className={styles.navLabel}>{t('nav.inbox')}</span>
            {unread > 0 ? (
              <span className={styles.badgeAccent} aria-label={`${unread} unread`}>
                {unread}
              </span>
            ) : null}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
          >
            <span className={styles.navIcon}>⚙️</span>
            <span className={styles.navLabel}>{t('nav.profile')}</span>
          </NavLink>

          <NavLink
            to="/"
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
            }
            end
          >
            <span className={styles.navIcon}>ℹ️</span>
            <span className={styles.navLabel}>{t('nav.about')}</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className={styles.sidebarFooter}>
          <Link to="/profile" className={styles.userCard}>
            <div className={styles.userAvatarWrapper}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className={styles.userAvatar} />
              ) : (
                <div className={styles.userAvatarInitials}>
                  {user?.name?.charAt(0).toUpperCase() || 'P'}
                </div>
              )}
              {user?.equippedAchievementId ? (
                <div className={styles.badgeOverlay}>
                  <AchievementIcon badgeId={user.equippedAchievementId} size="xs" />
                </div>
              ) : null}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name || 'Người chơi'}</div>
              <span className={styles.userLevel}>Lv.{user?.level || 1}</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContainer}>
        {/* Top bar with Breadcrumbs, Coins, Gems, Actions */}
        <header className={styles.topBar}>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <div className={styles.breadcrumb}>
            <Link to="/home" className={styles.breadcrumbLink}>
              {dict.nav.home}
            </Link>
            {breadcrumbCurrent && (
              <>
                <span>›</span>
                <span className={styles.breadcrumbCurrent}>{breadcrumbCurrent}</span>
              </>
            )}
          </div>

          <div className={styles.topBarActions}>
            <NotificationBell />
            <LanguageSwitcher />
            <Button variant="secondary" className={styles.logoutBtn} onClick={handleLogout}>
              {t('auth.logout')}
            </Button>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>

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

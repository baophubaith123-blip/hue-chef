import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NotificationBell } from '@/components/NotificationBell';
import { AudioControls } from '@/components/theme-d/AudioControls';
import { CoinPill } from '@/components/theme-d/CoinPill';
import { FestivalGarland } from '@/components/theme-d/FestivalGarland';
import { useAuth } from '@/contexts/AuthContext';
import { WarningPopup } from '@/features/mail/components/WarningPopup';
import { BanNoticePopup } from '@/features/mail/components/BanNoticePopup';
import { OnlineSyncMount } from '@/features/online/components/OnlineSyncMount';
import { useNextRecipe } from '@/features/recipes/hooks/useNextRecipe';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/player/SceneShell.module.css';

interface SceneShellProps {
  active: 'home' | 'recipes';
  children: ReactNode;
}

/**
 * Full-screen festival scene frame (Gói Mẫu Căn Chỉnh): plum scene
 * background, garland, wallet plaque on top and a fixed wooden bottom
 * navigation bar with a big centre play button — shared by the home
 * page and the recipe scene so both sit in the same illustrated world
 * as the approved Theme D target drawing. Session behaviour (warning /
 * ban popups, online sync) mirrors PlayerShell exactly.
 */
export function SceneShell({ active, children }: SceneShellProps) {
  const { user, logout } = useAuth();
  const { t, dict } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { nextRecipe } = useNextRecipe();

  const [warningShown, setWarningShown] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const userId = user?.id;
  const warningCount = user?.warningCount ?? 0;
  const isBanned = user?.status === 'banned';

  useEffect(() => {
    if (warningCount > 0 && !warningShown) {
      setShowWarning(true);
      setWarningShown(true);
    }
  }, [warningCount, warningShown]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handlePlayCenter = () => {
    if (nextRecipe) {
      navigate(`/cooking/${nextRecipe.id}`);
    } else {
      navigate('/recipes');
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    [styles.navCell, isActive ? styles.navCellActive : ''].filter(Boolean).join(' ');

  return (
    <div className={styles.scene}>
      <FestivalGarland className={styles.garland} />

      <header className={styles.topBar}>
        <Link to="/home" className={styles.brandSign}>
          Hue Chef
        </Link>

        <div className={styles.topBarActions}>
          <Link to="/recipes" className={styles.coinLink} title={dict.shop.walletTitle}>
            <CoinPill amount={user?.coins ?? 0} currency="xu" />
          </Link>
          <CoinPill amount={user?.cok ?? 0} currency="cok" />
          <AudioControls />
          <NotificationBell />
          <LanguageSwitcher />
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            {t('auth.logout')}
          </button>
        </div>
      </header>

      <OnlineSyncMount userId={userId ?? null} />

      <main className={styles.content}>
        <div key={location.pathname} className="page-transition">
          {children}
        </div>
      </main>

      <nav className={styles.bottomNav} aria-label="Player menu">
        <NavLink to="/home" className={navLinkClass} end>
          <span className={styles.navIcon} aria-hidden="true">🏠</span>
          <span className={styles.navLabel}>{dict.nav.home}</span>
        </NavLink>

        <NavLink to="/recipes" className={navLinkClass}>
          <span className={styles.navIcon} aria-hidden="true">🍲</span>
          <span className={styles.navLabel}>{dict.nav.recipes}</span>
        </NavLink>

        <button
          type="button"
          className={styles.playBtn}
          onClick={handlePlayCenter}
          aria-label={dict.scene.playCenter}
          data-active={active === 'home' || active === 'recipes' ? 'true' : undefined}
        >
          <span aria-hidden="true">▶</span>
        </button>

        <NavLink to="/achievements" className={navLinkClass}>
          <span className={styles.navIcon} aria-hidden="true">🎖️</span>
          <span className={styles.navLabel}>{dict.nav.achievements}</span>
        </NavLink>

        <NavLink to="/profile" className={navLinkClass}>
          <span className={styles.navIcon} aria-hidden="true">👤</span>
          <span className={styles.navLabel}>{dict.nav.profile}</span>
        </NavLink>
      </nav>

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

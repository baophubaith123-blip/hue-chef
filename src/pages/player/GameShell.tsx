import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NotificationBell } from '@/components/NotificationBell';
import { AudioControls } from '@/components/theme-d/AudioControls';
import { CoinPill } from '@/components/theme-d/CoinPill';
import { GAME_ART, gameIcon } from '@/components/theme-d/game-assets';
import { useAuth } from '@/contexts/AuthContext';
import { useMail } from '@/contexts/MailContext';
import { WarningPopup } from '@/features/mail/components/WarningPopup';
import { BanNoticePopup } from '@/features/mail/components/BanNoticePopup';
import { OnlineSyncMount } from '@/features/online/components/OnlineSyncMount';
import { useNextRecipe } from '@/features/recipes/hooks/useNextRecipe';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/player/GameShell.module.css';

interface GameShellProps {
  /** 'scene' = children paint their own boards on the scene (home/recipes);
   *  'board' = children sit inside one fitted parchment board (other pages). */
  variant?: 'scene' | 'board';
  children: ReactNode;
}

const ROOT_TABS = ['/home', '/recipes', '/achievements', '/profile'];

interface Destination {
  to: string;
  icon: string;
  emoji: string;
  label: string;
  badge?: number;
}

/** Animated wallet number: eases toward the new balance, jumps instantly
 *  when the player prefers reduced motion. */
function useAnimatedNumber(value: number): number {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = value;
    if (reduceMotion || from === value) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const duration = 600;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, reduceMotion]);

  return display;
}

/**
 * Game shell (Gói Game-Shell): the whole player area lives inside one
 * festival scene — plum night background, garland, HUD plaques on top,
 * wooden bottom navigation and a pause-style game menu. No sidebar, no
 * web navbar, no breadcrumb. Every destination of the old sidebar is
 * reachable in at most two taps (bottom bar or menu grid).
 */
export function GameShell({ variant = 'board', children }: GameShellProps) {
  const { user, logout } = useAuth();
  const { getUnreadCount } = useMail();
  const { t, dict } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { nextRecipe } = useNextRecipe();
  const reduceMotion = useReducedMotion();

  const [menuOpen, setMenuOpen] = useState(false);
  const [warningShown, setWarningShown] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [flyCoins, setFlyCoins] = useState<number[]>([]);

  const userId = user?.id;
  const unread = userId ? getUnreadCount(userId) : 0;
  const warningCount = user?.warningCount ?? 0;
  const isBanned = user?.status === 'banned';

  const coins = user?.coins ?? 0;
  const animatedCoins = useAnimatedNumber(coins);
  const prevCoinsRef = useRef(coins);
  const walletRef = useRef<HTMLSpanElement>(null);

  const hour = new Date().getHours();
  const isEvening = hour >= 18 || hour < 5;

  useEffect(() => {
    if (warningCount > 0 && !warningShown) {
      setShowWarning(true);
      setWarningShown(true);
    }
  }, [warningCount, warningShown]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Coin flight: when the balance grows, a few painted coins fly from the
  // lower centre of the screen into the wallet plaque.
  useEffect(() => {
    const prev = prevCoinsRef.current;
    prevCoinsRef.current = coins;
    if (reduceMotion || coins <= prev || prev === 0) return;
    const ids = [0, 1, 2, 3, 4].map((i) => Date.now() + i);
    setFlyCoins(ids);
    const wallet = walletRef.current;
    ids.forEach((id, i) => {
      window.setTimeout(() => {
        const el = document.getElementById(`fly-coin-${id}`);
        if (!el || !wallet) return;
        const target = wallet.getBoundingClientRect();
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight - 120;
        const dx = target.left + target.width / 2 - startX;
        const dy = target.top + target.height / 2 - startY;
        el.animate(
          [
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            {
              transform: `translate(${dx * 0.5}px, ${dy - 140}px) scale(0.9)`,
              opacity: 1,
              offset: 0.55,
            },
            { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.6 },
          ],
          { duration: 750, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
        );
      }, i * 70);
    });
    const clear = window.setTimeout(() => setFlyCoins([]), 1600);
    return () => window.clearTimeout(clear);
  }, [coins, reduceMotion]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const handleBack = useCallback(() => {
    if (location.key && location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  }, [location.key, navigate]);

  const handlePlayCenter = useCallback(() => {
    if (nextRecipe) {
      navigate(`/cooking/${nextRecipe.id}`);
    } else {
      navigate('/recipes');
    }
  }, [nextRecipe, navigate]);

  const destinations: Destination[] = useMemo(
    () => [
      { to: '/map', icon: 'map', emoji: '🗺️', label: dict.nav.map },
      { to: '/album', icon: 'album', emoji: '📖', label: dict.nav.album },
      { to: '/skills', icon: 'skills', emoji: '🌳', label: dict.nav.skills },
      { to: '/quests', icon: 'quest', emoji: '📜', label: dict.nav.quests },
      { to: '/survival', icon: 'survival', emoji: '🔥', label: dict.nav.survival },
      { to: '/mystery', icon: 'mystery', emoji: '🎁', label: dict.nav.mystery },
      { to: '/online', icon: 'online', emoji: '⚔️', label: dict.nav.online },
      { to: '/stall', icon: 'stall', emoji: '🏪', label: dict.nav.stall },
      { to: '/leaderboard', icon: 'trophy', emoji: '🏆', label: dict.nav.leaderboard },
      { to: '/collection', icon: 'album', emoji: '📔', label: dict.nav.collection },
      { to: '/inbox', icon: 'inbox', emoji: '📬', label: dict.nav.inbox, badge: unread },
      { to: '/achievements', icon: 'star', emoji: '🎖️', label: dict.nav.achievements },
    ],
    [dict, unread],
  );

  const isRootTab = ROOT_TABS.includes(location.pathname);
  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    [styles.navCell, isActive ? styles.navCellActive : ''].filter(Boolean).join(' ');

  const renderDestIcon = (dest: Destination) => {
    const url = gameIcon(dest.icon);
    return url ? (
      <img src={url} alt="" className={styles.destIcon} draggable={false} />
    ) : (
      <span className={styles.destEmoji} aria-hidden="true">
        {dest.emoji}
      </span>
    );
  };

  return (
    <div
      className={`${styles.shell} game-scope ${isEvening ? styles.evening : ''} ${
        tabVisible ? '' : styles.paused
      }`}
    >
      <div className={styles.garland} aria-hidden="true">
        <img src={GAME_ART.garlandStrip} alt="" className={styles.garlandImg} draggable={false} />
      </div>
      <div className={styles.particles} aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={styles.particle} />
        ))}
      </div>

      <header className={styles.hud}>
        <div className={styles.hudLeft}>
          {!isRootTab ? (
            <button
              type="button"
              className={styles.medallionBtn}
              onClick={handleBack}
              aria-label={dict.game.back}
              title={dict.game.back}
            >
              <span aria-hidden="true">←</span>
            </button>
          ) : null}
          <button
            type="button"
            className={styles.medallionBtn}
            onClick={() => setMenuOpen(true)}
            aria-label={dict.game.openMenu}
            title={dict.game.menu}
            data-testid="game-menu-btn"
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>

        <div className={styles.hudRight}>
          <span ref={walletRef} className={styles.walletWrap}>
            <Link to="/recipes" className={styles.coinLink} title={dict.shop.walletTitle}>
              <CoinPill amount={animatedCoins} currency="xu" />
            </Link>
          </span>
          <CoinPill amount={user?.cok ?? 0} currency="cok" />
          <span className={`${styles.hudControl} ${styles.hudAudio}`}>
            <AudioControls compact />
          </span>
          <span className={styles.hudControl}>
            <NotificationBell />
          </span>
          <Link to="/profile" className={styles.avatarBtn} aria-label={dict.nav.profile}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" className={styles.avatarImg} />
            ) : (
              <span className={styles.avatarInitials}>
                {user?.name?.charAt(0).toUpperCase() || '👨‍🍳'}
              </span>
            )}
          </Link>
        </div>
      </header>

      <OnlineSyncMount userId={userId ?? null} />

      <main className={styles.content}>
        <motion.div
          key={location.pathname}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={styles.pageMotion}
        >
          {variant === 'board' ? <div className={styles.board}>{children}</div> : children}
        </motion.div>
      </main>

      <nav className={styles.bottomNav} aria-label="Player menu">
        <NavLink to="/home" className={navLinkClass} end>
          <span className={styles.navIcon} aria-hidden="true">
            {gameIcon('home') ? <img src={gameIcon('home')} alt="" /> : '🏠'}
          </span>
          <span className={styles.navLabel}>{dict.nav.home}</span>
        </NavLink>

        <NavLink to="/recipes" className={navLinkClass}>
          <span className={styles.navIcon} aria-hidden="true">
            {gameIcon('recipes') ? <img src={gameIcon('recipes')} alt="" /> : '🍲'}
          </span>
          <span className={styles.navLabel}>{dict.nav.recipes}</span>
        </NavLink>

        <motion.button
          type="button"
          className={styles.playBtn}
          onClick={handlePlayCenter}
          aria-label={dict.scene.playCenter}
          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          whileHover={reduceMotion ? undefined : { scale: 1.06 }}
        >
          <img src={GAME_ART.btnPlay} alt="" className={styles.playImg} draggable={false} />
        </motion.button>

        <NavLink to="/achievements" className={navLinkClass}>
          <span className={styles.navIcon} aria-hidden="true">
            {gameIcon('trophy') ? <img src={gameIcon('trophy')} alt="" /> : '🎖️'}
          </span>
          <span className={styles.navLabel}>{dict.nav.achievements}</span>
        </NavLink>

        <NavLink to="/profile" className={navLinkClass}>
          <span className={styles.navIcon} aria-hidden="true">
            {gameIcon('profile') ? <img src={gameIcon('profile')} alt="" /> : '👤'}
          </span>
          <span className={styles.navLabel}>{dict.nav.profile}</span>
        </NavLink>
      </nav>

      {flyCoins.map((id) => (
        <span key={id} id={`fly-coin-${id}`} className={styles.flyCoin} aria-hidden="true">
          {gameIcon('coin-xu') ? <img src={gameIcon('coin-xu')} alt="" /> : '🪙'}
        </span>
      ))}

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className={styles.menuBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              className={styles.menuPanel}
              role="dialog"
              aria-modal="true"
              aria-label={dict.game.menu}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.menuHead}>
                <h2 className={styles.menuTitle}>{dict.game.menu}</h2>
                <button
                  type="button"
                  className={styles.medallionBtn}
                  onClick={() => setMenuOpen(false)}
                  aria-label={dict.game.close}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>

              <p className={styles.menuSectionLabel}>{dict.game.destinations}</p>
              <div className={styles.destGrid}>
                {destinations.map((dest) => (
                  <Link key={dest.to} to={dest.to} className={styles.destCell}>
                    <span className={styles.destIconWrap}>
                      {renderDestIcon(dest)}
                      {dest.badge ? <span className={styles.destBadge}>{dest.badge}</span> : null}
                    </span>
                    <span className={styles.destLabel}>{dest.label}</span>
                  </Link>
                ))}
              </div>

              <p className={styles.menuSectionLabel}>{dict.game.settings}</p>
              <div className={styles.settingsRow}>
                <AudioControls />
                <LanguageSwitcher />
              </div>

              <p className={styles.menuSectionLabel}>{dict.game.accountSection}</p>
              <div className={styles.accountRow}>
                <Link to="/profile" className={styles.accountLink}>
                  {gameIcon('profile') ? (
                    <img src={gameIcon('profile')} alt="" className={styles.accountIcon} />
                  ) : (
                    <span aria-hidden="true">👤</span>
                  )}
                  {dict.nav.profile}
                </Link>
                <Link to="/about" className={styles.accountLink}>
                  {gameIcon('info') ? (
                    <img src={gameIcon('info')} alt="" className={styles.accountIcon} />
                  ) : (
                    <span aria-hidden="true">ℹ️</span>
                  )}
                  {dict.nav.about}
                </Link>
                <Link to="/help" className={styles.accountLink}>
                  {gameIcon('help') ? (
                    <img src={gameIcon('help')} alt="" className={styles.accountIcon} />
                  ) : (
                    <span aria-hidden="true">❓</span>
                  )}
                  {t('help.title')}
                </Link>
                <Link to="/feedback" className={styles.accountLink}>
                  {gameIcon('feedback') ? (
                    <img src={gameIcon('feedback')} alt="" className={styles.accountIcon} />
                  ) : (
                    <span aria-hidden="true">✉️</span>
                  )}
                  {t('feedback.title')}
                </Link>
                <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                  {gameIcon('logout') ? (
                    <img src={gameIcon('logout')} alt="" className={styles.accountIcon} />
                  ) : (
                    <span aria-hidden="true">🚪</span>
                  )}
                  {t('auth.logout')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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

import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AudioControls } from '@/components/theme-d/AudioControls';
import { NOI_NOI_FLAT } from '@/components/theme-d/game-assets';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultPathForRole } from '@/features/auth/types';
import { useTranslation } from '@/i18n/useTranslation';
import { TitleScene } from '@/pages/common/TitleScene';

import styles from '@/pages/common/TitleScreen.module.css';

/**
 * Title screen (Gói Game-Shell): replaces the web landing page. One
 * festival scene, the painted sign, a big golden PLAY button and wooden
 * tag buttons — like a game's title screen. Signed-out players go to
 * the login panel (same scene); signed-in players continue straight
 * into their area.
 */
export default function TitleScreen() {
  const { t, dict } = useTranslation();
  const { user, logout, playAsGuest } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const handlePlay = () => {
    if (user) {
      navigate(getDefaultPathForRole(user.role));
    } else {
      // Instant guest play (Bảo's chốt): no form first — a local guest
      // profile is created on the spot and the game opens.
      playAsGuest(dict.game.guestName);
      navigate('/home');
    }
  };

  const spring = reduceMotion
    ? { duration: 0.15 }
    : { type: 'spring' as const, stiffness: 320, damping: 24 };

  return (
    <TitleScene>
      <div className={styles.cornerPlaque}>
        <AudioControls compact />
        <LanguageSwitcher />
      </div>

      <motion.div
        className={styles.actions}
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.button
          type="button"
          className={styles.playBig}
          onClick={handlePlay}
          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          transition={spring}
          data-testid="title-play"
        >
          <span className={styles.playTriangle} aria-hidden="true">
            ▶
          </span>
          {user ? t('landing.ctaContinue') : t('landing.ctaStart')}
        </motion.button>

        <div className={styles.tagRow}>
          <Link to="/about" className={styles.tagBtn}>
            {dict.nav.about}
          </Link>
          <Link to="/help" className={styles.tagBtn}>
            {t('help.title')}
          </Link>
          <Link to="/feedback" className={styles.tagBtn}>
            {t('feedback.title')}
          </Link>
          {user?.guest ? (
            <>
              <Link to="/login" className={styles.tagBtn}>
                {t('auth.login')}
              </Link>
              <Link to="/register" className={styles.tagBtn}>
                {t('auth.register')}
              </Link>
            </>
          ) : user ? (
            <button
              type="button"
              className={`${styles.tagBtn} ${styles.tagBtnBrick}`}
              onClick={() => logout()}
            >
              {t('auth.logout')}
            </button>
          ) : (
            <Link to="/register" className={styles.tagBtn}>
              {t('auth.register')}
            </Link>
          )}
        </div>
      </motion.div>

      <img
        src={NOI_NOI_FLAT.wave}
        alt=""
        className={styles.mascot}
        draggable={false}
        aria-hidden="true"
      />
      <p className={styles.tagline}>{t('landing.heroSubtitle')}</p>
    </TitleScene>
  );
}

import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

import { WoodPanel } from '@/components/theme-d/WoodPanel';
import { GAME_ICONS, NOI_NOI_FLAT } from '@/components/theme-d/game-assets';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/player/GuestGate.module.css';

/**
 * "Cần tài khoản" game panel (Gói Game-Shell, guest scope): shown in
 * place of any player area a guest may not enter — the guest never
 * navigates inside; the panel offers login / register, and signing in
 * merges the guest progress (H9 union law) and unlocks everything.
 * The shell is the Án A hanging wooden board (WoodPanel); the motion
 * wrapper keeps the entry animation and the guest-gate test id.
 */
export function GuestGate() {
  const { t, dict } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={styles.wrap}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      aria-label={dict.game.accountRequired}
      data-testid="guest-gate"
    >
      <WoodPanel
        title={dict.game.accountRequired}
        titleLevel="h2"
        className={styles.gatePanel}
        bodyClassName={styles.gateBody}
      >
        <div className={styles.inner}>
          <img src={NOI_NOI_FLAT.sleep} alt="" className={styles.mascot} draggable={false} />
          <span className={styles.lockBadge} aria-hidden="true">
            {GAME_ICONS.lock ? <img src={GAME_ICONS.lock} alt="" /> : '🔒'}
          </span>
          <p className={styles.body}>{dict.game.accountRequiredBody}</p>
          <div className={styles.actions}>
            <Link to="/login" className={styles.loginBtn}>
              {t('auth.login')}
            </Link>
            <Link to="/register" className={styles.registerBtn}>
              {t('auth.register')}
            </Link>
          </div>
        </div>
      </WoodPanel>
    </motion.section>
  );
}

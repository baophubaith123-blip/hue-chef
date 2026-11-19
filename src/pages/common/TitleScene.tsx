import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { GAME_ART } from '@/components/theme-d/game-assets';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/pages/common/TitleScene.module.css';

interface TitleSceneProps {
  children: ReactNode;
  /** Smaller sign for auth panels. */
  compact?: boolean;
}

/**
 * Title scene (Gói Game-Shell): the festival night scene that replaces
 * the web landing page — painted hanging sign with the game title set in
 * real text over the plank, garland, drifting sparks. Shared by the
 * title screen and the auth panels so signing in never leaves the game
 * world.
 */
export function TitleScene({ children, compact = false }: TitleSceneProps) {
  const { dict } = useTranslation();
  const hour = new Date().getHours();
  const isEvening = hour >= 18 || hour < 5;

  return (
    <div className={`${styles.scene} game-scope ${isEvening ? styles.evening : ''}`}>
      <div className={styles.garland} aria-hidden="true">
        <img src={GAME_ART.garlandStrip} alt="" className={styles.garlandImg} draggable={false} />
      </div>
      <div className={styles.particles} aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className={styles.particle} />
        ))}
      </div>

      <div className={`${styles.signWrap} ${compact ? styles.signCompact : ''}`}>
        <img src={GAME_ART.signTitle} alt="" className={styles.signImg} draggable={false} />
        <div className={styles.signText}>
          <span className={styles.signTitle}>Hue Chef</span>
          <span className={styles.signSub}>{dict.dashboard.heroTitleHue}</span>
        </div>
      </div>

      <div className={styles.content}>{children}</div>
    </div>
  );
}

interface PublicSceneProps {
  children: ReactNode;
}

/**
 * Public info pages (about / help / feedback) inside the game world:
 * same scene, content on one fitted parchment board, a wooden back
 * medallion to the title screen. No web header/footer.
 */
export function PublicScene({ children }: PublicSceneProps) {
  const { dict } = useTranslation();
  return (
    <div className={`${styles.scene} game-scope`}>
      <div className={styles.garland} aria-hidden="true">
        <img src={GAME_ART.garlandStrip} alt="" className={styles.garlandImg} draggable={false} />
      </div>
      <div className={styles.pubWrap}>
        <div className={styles.pubHead}>
          <Link to="/" className={styles.backBtn} aria-label={dict.game.back} title={dict.game.back}>
            <span aria-hidden="true">←</span>
          </Link>
          <Link to="/" className={styles.pubBrand}>
            Hue Chef
          </Link>
        </div>
        <div className={styles.pubBoard}>{children}</div>
      </div>
    </div>
  );
}

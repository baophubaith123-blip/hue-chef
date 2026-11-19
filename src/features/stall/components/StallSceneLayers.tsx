import type { DecorKind } from '@/features/stall/lib/support';

import styles from '@/features/stall/components/StallSceneLayers.module.css';

/**
 * The stall scene's upgrade layers (Gói H6, mục 8.3 + 5.6): ONE layer
 * system for both progressions Bảo asked to keep unified — the stall
 * LEVEL paints the structure (awning → lanterns → yard → imperial
 * trim), the player's DECORATION paints the personal ornaments on
 * top. Everything is drawn over the painted scene with CSS shapes in
 * Theme D colours; no text lives in the art (words stay code).
 * Upgrading is meant to be visible at a glance: level 5 must not look
 * like level 1.
 */
export function StallSceneLayers({
  level,
  decor,
}: {
  level: number;
  decor: DecorKind[];
}) {
  const has = (kind: DecorKind) => decor.includes(kind);
  return (
    <div className={styles.layers} aria-hidden>
      {/* Level 2: the awning — the stall gets a roof of its own. */}
      {level >= 2 ? <div className={styles.awning} /> : null}
      {/* Level 3: lantern strings over the yard. */}
      {level >= 3 ? (
        <div className={styles.lanternString}>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={styles.lanternDot} style={{ animationDelay: `${i * 0.35}s` }} />
          ))}
        </div>
      ) : null}
      {/* Level 4: a wider, flowered yard. */}
      {level >= 4 ? (
        <>
          <span className={`${styles.yardPot} ${styles.yardPotLeft}`}>🌼</span>
          <span className={`${styles.yardPot} ${styles.yardPotRight}`}>🌺</span>
          <div className={styles.yardTrim} />
        </>
      ) : null}
      {/* Level 5: imperial trim — deep red banner, gold double border. */}
      {level >= 5 ? (
        <>
          <div className={styles.imperialBanner} />
          <span className={`${styles.imperialLantern} ${styles.imperialLanternLeft}`}>🏮</span>
          <span className={`${styles.imperialLantern} ${styles.imperialLanternRight}`}>🏮</span>
        </>
      ) : null}
      {/* Player decoration (ý tưởng 17), same layer family. */}
      {has('lanterns') ? (
        <>
          <span className={`${styles.decorLantern} ${styles.decorLanternLeft}`}>🏮</span>
          <span className={`${styles.decorLantern} ${styles.decorLanternRight}`}>🏮</span>
        </>
      ) : null}
      {has('flowers') ? (
        <>
          <span className={`${styles.decorFlowers} ${styles.decorFlowersLeft}`}>🌸</span>
          <span className={`${styles.decorFlowers} ${styles.decorFlowersRight}`}>🌷</span>
        </>
      ) : null}
      {has('goldSign') ? <div className={styles.goldSign} /> : null}
      {has('plant') ? <span className={styles.decorPlant}>🪴</span> : null}
    </div>
  );
}

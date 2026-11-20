import type { CSSProperties } from 'react';

import styles from '@/features/stall/components/StoveFlame.module.css';

interface StoveFlameProps {
  size?: number;
  className?: string;
}

/**
 * Pure-CSS stove flame + smoke (Đợt 3 quầy): three layered teardrops
 * flickering over a stove, three smoke wisps rising and fading.
 * Decorative only — aria-hidden, pointer-events none via CSS.
 */
export function StoveFlame({ size = 46, className }: StoveFlameProps) {
  const style = {
    width: size,
    height: size,
    '--flame-size': `${size}px`,
  } as CSSProperties;
  return (
    <div className={`${styles.flameWrap} ${className ?? ''}`} style={style} aria-hidden="true">
      <span className={`${styles.smoke} ${styles.smoke1}`} />
      <span className={`${styles.smoke} ${styles.smoke2}`} />
      <span className={`${styles.smoke} ${styles.smoke3}`} />
      <span className={`${styles.drop} ${styles.outer}`} />
      <span className={`${styles.drop} ${styles.mid}`} />
      <span className={`${styles.drop} ${styles.core}`} />
    </div>
  );
}

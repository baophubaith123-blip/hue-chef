import { NOI_NOI_POSES } from '@/components/theme-d/assets';
import type { NoiNoiPose } from '@/components/theme-d/assets';
import styles from '@/components/theme-d/NoiNoi.module.css';

interface NoiNoiProps {
  pose: NoiNoiPose;
  speech?: string;
  size?: number;
  alt: string;
  className?: string;
}

/** Theme D mascot — Nồi Nồi by pose/expression, with optional speech bubble (Kế hoạch 1, Phần 2.2). */
export function NoiNoi({ pose, speech, size = 180, alt, className = '' }: NoiNoiProps) {
  return (
    <figure className={`${styles.wrap} ${className}`} style={{ width: size }}>
      {speech ? <figcaption className={styles.bubble}>{speech}</figcaption> : null}
      <img
        className={styles.img}
        src={NOI_NOI_POSES[pose]}
        alt={alt}
        width={size}
        height={size}
        draggable={false}
      />
    </figure>
  );
}

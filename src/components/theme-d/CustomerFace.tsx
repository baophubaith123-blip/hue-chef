import { CUSTOMER_FACES } from '@/components/theme-d/assets';
import type { CustomerMood, CustomerTier } from '@/components/theme-d/assets';
import styles from '@/components/theme-d/CustomerFace.module.css';

interface CustomerFaceProps {
  tier: CustomerTier;
  mood: CustomerMood;
  size?: number;
  alt: string;
  patiencePercent?: number;
  patienceLabel?: string;
  className?: string;
}

/**
 * Theme D customer face — 3 tiers × 6 moods (kế hoạch hợp nhất, mục 2.7),
 * with an optional patience bar whose colour follows the mood.
 */
export function CustomerFace({ tier, mood, size = 96, alt, patiencePercent, patienceLabel, className = '' }: CustomerFaceProps) {
  const clamped = patiencePercent === undefined ? undefined : Math.min(100, Math.max(0, patiencePercent));
  return (
    <div className={`${styles.wrap} ${styles[tier]} ${className}`} style={{ width: size }}>
      <div className={styles.frame}>
        <img className={styles.img} src={CUSTOMER_FACES[tier][mood]} alt={alt} width={size} height={size} draggable={false} />
        {tier === 'vip' ? <span className={styles.aura} aria-hidden /> : null}
      </div>
      {clamped !== undefined ? (
        <div
          className={styles.patience}
          role="meter"
          aria-label={patienceLabel ?? alt}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clamped)}
        >
          <span
            className={`${styles.patienceFill} ${clamped <= 25 ? styles.patienceLow : clamped <= 55 ? styles.patienceMid : ''}`}
            style={{ width: `${clamped}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

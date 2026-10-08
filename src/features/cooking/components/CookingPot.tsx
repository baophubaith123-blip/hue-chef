import { useDragDrop } from '@/features/cooking/hooks/useDragDrop';

import styles from '@/features/cooking/components/CookingPot.module.css';

interface CookingPotProps {
  disabled?: boolean;
  onDropOnPot: (ingredientId: string) => void;
  shake?: boolean;
  sparkle?: boolean;
  placedCount: number;
}

export function CookingPot({
  disabled = false,
  onDropOnPot,
  shake = false,
  sparkle = false,
  placedCount,
}: CookingPotProps) {
  const { potActive, potDropZoneProps } = useDragDrop({ onDropOnPot });

  return (
    <section className={styles.column} aria-label="Cooking pot">
      <h2 className={styles.title}>Pot</h2>
      <div
        className={[
          styles.pot,
          potActive && !disabled ? styles.potActive : '',
          shake ? styles.potShake : '',
          sparkle ? styles.potSparkle : '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...(disabled ? {} : potDropZoneProps)}
      >
        <div className={styles.potInner}>
          <span className={styles.potEmoji} aria-hidden>
            🍲
          </span>
          <p className={styles.potHint}>
            {disabled ? 'Session ended' : 'Drop ingredients here'}
          </p>
          <p className={styles.potCount}>{placedCount} in pot</p>
        </div>
      </div>
    </section>
  );
}

import { getIngredientById } from '@/data/ingredients';
import { useDragDrop } from '@/features/cooking/hooks/useDragDrop';

import styles from '@/features/cooking/components/CookingPot.module.css';

interface CookingPotProps {
  disabled?: boolean;
  onDropOnPot: (ingredientId: string) => void;
  shake?: boolean;
  sparkle?: boolean;
  potIngredients: string[];
  actionButtonLabel: string | null;
  onExecuteAction: () => void;
}

export function CookingPot({
  disabled = false,
  onDropOnPot,
  shake = false,
  sparkle = false,
  potIngredients,
  actionButtonLabel,
  onExecuteAction,
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
          {potIngredients.length > 0 ? (
            <div className={styles.chips}>
              {potIngredients.map((id, index) => {
                const ing = getIngredientById(id);
                return (
                  <span key={`${id}-${index}`} className={styles.chip}>
                    {ing?.name || id}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className={styles.potCount}>Pot is empty</p>
          )}
        </div>
      </div>

      {!disabled && actionButtonLabel ? (
        <button
          type="button"
          className={styles.actionButton}
          onClick={onExecuteAction}
        >
          ✨ {actionButtonLabel}
        </button>
      ) : null}
    </section>
  );
}

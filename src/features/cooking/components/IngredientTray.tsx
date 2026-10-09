import type { DragEvent } from 'react';

import { getIngredientById } from '@/data/ingredients';

import styles from '@/features/cooking/components/IngredientTray.module.css';

interface IngredientTrayProps {
  trayIngredientIds: string[];
  disabled?: boolean;
  placedIngredientIds: string[];
  draggingId: string | null;
  getTrayItemProps: (ingredientId: string) => {
    draggable?: boolean;
    onDragStart?: (event: DragEvent<HTMLElement>) => void;
    onDragEnd?: () => void;
  };
}

export function IngredientTray({
  trayIngredientIds,
  disabled = false,
  placedIngredientIds,
  draggingId,
  getTrayItemProps,
}: IngredientTrayProps) {
  const remainingCount = trayIngredientIds.filter(
    (id) => !placedIngredientIds.includes(id),
  ).length;

  return (
    <section className={styles.tray} aria-label="Ingredient tray">
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Ingredients</h2>
        <span className={styles.remainingBadge}>Remaining: {remainingCount}</span>
      </div>
      <ul className={styles.list}>
        {trayIngredientIds.map((ingredientId) => {
          const ingredient = getIngredientById(ingredientId);
          if (!ingredient) {
            return null;
          }
          const isUsed = placedIngredientIds.includes(ingredientId);
          const dragProps = disabled || isUsed ? {} : getTrayItemProps(ingredientId);
          return (
            <li key={ingredientId}>
              <button
                type="button"
                className={[
                  styles.chip,
                  isUsed ? styles.chipUsed : '',
                  draggingId === ingredientId ? styles.chipDragging : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={disabled || isUsed}
                {...dragProps}
              >
                <div className={styles.chipHeader}>
                  <span className={styles.chipName}>{ingredient.name}</span>
                  {!isUsed ? <span className={styles.itemBadge}>1</span> : null}
                </div>
                <span className={styles.chipMeta}>{ingredient.category}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

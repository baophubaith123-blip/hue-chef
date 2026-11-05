import type { DragEvent } from 'react';

import { getIngredientById } from '@/data/ingredients';
import { useTranslation } from '@/i18n/useTranslation';

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
  onSelectIngredient?: (ingredientId: string) => void;
}

export function IngredientTray({
  trayIngredientIds,
  disabled = false,
  placedIngredientIds,
  draggingId,
  getTrayItemProps,
  onSelectIngredient,
}: IngredientTrayProps) {
  const { t, dict } = useTranslation();

  const remainingCount = trayIngredientIds.filter(
    (id) => !placedIngredientIds.includes(id),
  ).length;

  return (
    <section className={styles.tray} aria-label={t('cooking.ingredients')}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>{t('cooking.ingredients')}</h2>
        <span className={styles.remainingBadge}>
          {t('cooking.remaining', { count: remainingCount })}
        </span>
      </div>
      <ul className={`${styles.list} scroll-slim`}>
        {trayIngredientIds.map((ingredientId, index) => {
          const ingredient = getIngredientById(ingredientId);
          if (!ingredient) {
            return null;
          }
          const isUsed = placedIngredientIds.includes(ingredientId);
          const dragProps = disabled || isUsed ? {} : getTrayItemProps(ingredientId);
          const categoryLabel =
            dict.cooking.categories[ingredient.category] ?? ingredient.category;

          return (
            <li key={ingredientId} className={`anim-fade-up anim-delay-${(index % 8) + 1}`}>
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
                onClick={() => {
                  if (!disabled && !isUsed) {
                    onSelectIngredient?.(ingredientId);
                  }
                }}
                {...dragProps}
              >
                <span
                  className={[styles.medal, styles[`cat-${ingredient.category}`] ?? '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden
                >
                  {ingredient.fallbackEmoji}
                </span>
                <span className={styles.chipTexts}>
                  <span className={styles.chipName}>{ingredient.name}</span>
                  <span className={styles.chipMeta}>{categoryLabel}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

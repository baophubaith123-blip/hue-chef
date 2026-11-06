import type { DragEvent } from 'react';

import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { getIngredientById } from '@/data/ingredients';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/cooking/components/IngredientTray.module.css';

interface IngredientTrayProps {
  trayIngredientIds: string[];
  disabled?: boolean;
  placedIngredientIds: string[];
  /** Ingredients the current step needs — their cards glow with a NEED tag. */
  requiredIngredientIds?: string[];
  /** Display amounts for real recipe ingredients (decoys have none). */
  amountByIngredientId?: Record<string, string>;
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
  requiredIngredientIds = [],
  amountByIngredientId = {},
  draggingId,
  getTrayItemProps,
  onSelectIngredient,
}: IngredientTrayProps) {
  const { t } = useTranslation();
  const { ingredientCategoryLabel } = useTaxonomy();

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
          const isNeeded = !isUsed && requiredIngredientIds.includes(ingredientId);
          const dragProps = disabled || isUsed ? {} : getTrayItemProps(ingredientId);
          const categoryLabel = ingredientCategoryLabel(ingredient.category);
          const amount = amountByIngredientId[ingredientId];

          return (
            <li key={ingredientId} className={`anim-fade-up anim-delay-${(index % 8) + 1}`}>
              <button
                type="button"
                className={[
                  styles.chip,
                  isUsed ? styles.chipUsed : '',
                  isNeeded ? styles.chipNeeded : '',
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
                <span className={styles.eyes} aria-hidden>
                  <span className={styles.eyeDot} />
                  <span className={styles.eyeDot} />
                </span>
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
                  <span className={styles.chipMeta}>
                    {categoryLabel}
                    {amount ? ` · ${amount}` : ''}
                  </span>
                  {isNeeded ? (
                    <span className={styles.neededTag}>{t('cooking.neededThisStep')}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { useState } from 'react';
import type { DragEvent } from 'react';

import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { getIngredientById } from '@/data/ingredients';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/cooking/components/IngredientTray.module.css';

interface IngredientTrayProps {
  trayIngredientIds: string[];
  disabled?: boolean;
  placedIngredientIds: string[];
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

  // Tray paging (presentation only): at most 3 trays, chips already in
  // the pot keep their locked state on every tray.
  const [trayPage, setTrayPage] = useState(0);
  const trayPageSize =
    trayIngredientIds.length > 14
      ? Math.ceil(trayIngredientIds.length / 3)
      : Math.max(1, trayIngredientIds.length);
  const trayPageCount = Math.max(1, Math.ceil(trayIngredientIds.length / trayPageSize));
  const safeTrayPage = Math.min(trayPage, trayPageCount - 1);
  const visibleIngredientIds = trayIngredientIds.slice(
    safeTrayPage * trayPageSize,
    safeTrayPage * trayPageSize + trayPageSize,
  );

  return (
    <section className={styles.tray} aria-label={t('cooking.ingredients')}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>{t('cooking.ingredients')}</h2>
        <span className={styles.remainingBadge}>
          {t('cooking.remaining', { count: remainingCount })}
        </span>
      </div>
      <ul className={`${styles.list} scroll-slim`}>
        {visibleIngredientIds.map((ingredientId, index) => {
          const ingredient = getIngredientById(ingredientId);
          if (!ingredient) {
            return null;
          }
          const isUsed = placedIngredientIds.includes(ingredientId);
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
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {trayPageCount > 1 ? (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pagerBtn}
            aria-label={t('cooking.pagerPrev')}
            disabled={safeTrayPage === 0}
            onClick={() => setTrayPage(safeTrayPage - 1)}
          >
            ◀
          </button>
          <div className={styles.pagerCenter}>
            <span className={styles.pagerSign}>
              🧺 {t('cooking.trayPage', { current: safeTrayPage + 1, total: trayPageCount })}
            </span>
            <span className={styles.pagerDots}>
              {Array.from({ length: trayPageCount }, (_, i) => (
                <span
                  key={i}
                  className={i === safeTrayPage ? styles.pagerDotActive : styles.pagerDot}
                />
              ))}
            </span>
          </div>
          <button
            type="button"
            className={styles.pagerBtn}
            aria-label={t('cooking.pagerNext')}
            disabled={safeTrayPage >= trayPageCount - 1}
            onClick={() => setTrayPage(safeTrayPage + 1)}
          >
            ▶
          </button>
        </div>
      ) : null}
    </section>
  );
}

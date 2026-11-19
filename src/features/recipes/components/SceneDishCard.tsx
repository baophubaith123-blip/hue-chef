import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ImageWithFallback } from '@/components/ImageWithFallback';
import { DishGradeFrame } from '@/components/theme-d/DishGradeFrame';
import { dishArtFor } from '@/components/theme-d/dish-art';
import { gameIcon } from '@/components/theme-d/game-assets';
import { useAuth } from '@/contexts/AuthContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import type { Recipe } from '@/data/types';
import { difficultyName, difficultyStars } from '@/features/recipes/lib/difficulty';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { formatDuration } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/recipes/components/SceneDishCard.module.css';

interface SceneDishCardProps {
  recipe: Recipe;
  /** When set, the dish is locked for the current player: show this price. */
  lockedPrice?: number;
}

/**
 * Theme D scene dish card for the recipe catalogue scene (Gói Mẫu Căn
 * Chỉnh): a paper card inside the dish's grade frame, illustrated dish
 * art (never the old photo), a round difficulty medallion on the art's
 * top-left corner and a wooden plaque at the foot — lock + price when
 * the dish is not owned yet, base score when it is playable.
 */
export function SceneDishCard({ recipe, lockedPrice }: SceneDishCardProps) {
  const { dict } = useTranslation();
  const { recipeCategoryLabel } = useTaxonomy();
  const { user } = useAuth();

  const categoryLabel = recipeCategoryLabel(recipe.category);
  const tierName = difficultyName(dict.recipe.difficultyNames, recipe.difficulty);
  const grade = dishGradeFor(recipe);
  const gradeLabel = dict.recipe.gradeNames[grade - 1] ?? '';
  const isLocked = lockedPrice !== undefined;

  // The player's own best stars for this dish (same rule as RecipeCard:
  // the frame shows the dish's fixed grade, these stars are the player's).
  const bestStars = useMemo(() => {
    const entries = (user?.cookedRecipes ?? []).filter((entry) => entry.recipeId === recipe.id);
    return entries.reduce((max, entry) => Math.max(max, entry.stars), 0);
  }, [user?.cookedRecipes, recipe.id]);

  return (
    <DishGradeFrame grade={grade} gradeLabel={gradeLabel} className={styles.frameWrap}>
      <article className={`${styles.card} ${isLocked ? styles.cardLocked : ''}`}>
        <Link
          to={`/recipes/${recipe.id}`}
          className={styles.imageLink}
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className={styles.imageWrap}>
            <ImageWithFallback
              className={styles.image}
              src={dishArtFor(recipe)}
              alt={recipe.name}
              fallbackTitle={recipe.name}
              loading="lazy"
            />
            <div className={styles.difficultyBadge}>
              <span className={styles.difficultyStars}>{difficultyStars(recipe.difficulty)}</span>
              <span className={styles.difficultyName}>{tierName}</span>
            </div>
            <div className={styles.timeBadge}>
              {gameIcon('clock') ? (
                <img src={gameIcon('clock')} alt="" className={styles.badgeIcon} />
              ) : (
                <span aria-hidden="true">⏱</span>
              )}{' '}
              {formatDuration(recipe.duration)}
            </div>
            {isLocked ? <div className={styles.lockVeil} aria-hidden="true" /> : null}
          </div>
        </Link>

        <div className={styles.body}>
          <h3 className={styles.title}>
            <Link to={`/recipes/${recipe.id}`} className={styles.titleLink}>
              {recipe.name}
            </Link>
          </h3>

          <div className={styles.metaRow}>
            <span className={styles.categoryBadge}>{categoryLabel}</span>
            <span className={styles.gradeName}>{gradeLabel}</span>
          </div>

          {bestStars > 0 ? (
            <p className={styles.yourStars}>{dict.recipe.yourStars(bestStars)}</p>
          ) : null}

          <div className={`${styles.plaque} ${isLocked ? styles.plaqueLocked : ''}`}>
            {isLocked ? (
              <>
                {gameIcon('lock') ? (
                  <img src={gameIcon('lock')} alt="" className={styles.plaqueIcon} />
                ) : (
                  <span aria-hidden="true">🔒</span>
                )}
                <span>{lockedPrice.toLocaleString()} xu</span>
              </>
            ) : (
              <>
                {gameIcon('star') ? (
                  <img src={gameIcon('star')} alt="" className={styles.plaqueIcon} />
                ) : (
                  <span aria-hidden="true">⭐</span>
                )}
                <span>{recipe.baseScore.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>
      </article>
    </DishGradeFrame>
  );
}

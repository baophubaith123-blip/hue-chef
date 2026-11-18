import { useMemo, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTaxonomy } from '@/contexts/TaxonomyContext';

import type { Recipe } from '@/data/types';
import { formatDuration } from '@/lib/format';
import { difficultyName, difficultyStars } from '@/features/recipes/lib/difficulty';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n/useTranslation';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { DishGradeFrame } from '@/components/theme-d/DishGradeFrame';
import styles from '@/features/recipes/components/RecipeCard.module.css';

interface RecipeCardProps {
  recipe: Recipe;
  /** When set, the dish is locked for the current player: show this price. */
  lockedPrice?: number;
}

export function RecipeCard({ recipe, lockedPrice }: RecipeCardProps) {
  const { dict } = useTranslation();
  const { recipeCategoryLabel } = useTaxonomy();
  const { user } = useAuth();
  const [tilt, setTilt] = useState<{ rotateX: number; rotateY: number } | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setTilt({
      rotateX: Math.max(-6, Math.min(6, rotateX)),
      rotateY: Math.max(-6, Math.min(6, rotateY)),
    });
  };

  const handleMouseLeave = () => {
    setTilt(null);
  };

  const categoryLabel = recipeCategoryLabel(recipe.category);
  const tierName = difficultyName(dict.recipe.difficultyNames, recipe.difficulty);
  const grade = dishGradeFor(recipe);
  const gradeLabel = dict.recipe.gradeNames[grade - 1] ?? '';

  // The player's own best stars for this dish, shown INSIDE the grade
  // frame (chốt M3: the frame is the dish's grade; the stars are the
  // player's own skill on that dish — two different facts, two places).
  const bestStars = useMemo(() => {
    const entries = (user?.cookedRecipes ?? []).filter((entry) => entry.recipeId === recipe.id);
    return entries.reduce((max, entry) => Math.max(max, entry.stars), 0);
  }, [user?.cookedRecipes, recipe.id]);

  return (
    <DishGradeFrame grade={grade} gradeLabel={gradeLabel} className={styles.frameWrap}>
      <article
        className={styles.card}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          tilt
            ? {
                transform: `perspective(1000px) rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg) translateY(-4px)`,
                transition: 'transform 0.08s ease-out',
              }
            : {
                transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)',
                transition: 'transform 0.35s ease-out',
              }
        }
      >
        <Link to={`/recipes/${recipe.id}`} className={styles.imageLink} tabIndex={-1} aria-hidden="true">
          <div className={styles.imageWrap}>
            <ImageWithFallback
              className={styles.image}
              src={recipe.image}
              alt={recipe.name}
              fallbackTitle={recipe.name}
              loading="lazy"
            />
            <div className={styles.timeBadge}>
              ⏱ {formatDuration(recipe.duration)}
            </div>
            {lockedPrice !== undefined ? (
              <div className={styles.lockBadge}>
                🔒 {lockedPrice.toLocaleString()} xu
              </div>
            ) : null}
            <div className={styles.difficultyBadge}>
              <span className={styles.difficultyStars}>{difficultyStars(recipe.difficulty)}</span>
              <span>{tierName}</span>
            </div>
          </div>
        </Link>

        <div className={styles.body}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>
              <Link to={`/recipes/${recipe.id}`} className={styles.titleLink}>
                {recipe.name}
              </Link>
            </h3>
            <span className={styles.gradeBadge}>{gradeLabel}</span>
          </div>

          <p className={styles.description}>{recipe.description}</p>

          {bestStars > 0 ? <p className={styles.yourStars}>{dict.recipe.yourStars(bestStars)}</p> : null}

          <div className={styles.cardFooter}>
            <span className={styles.categoryBadge}>{categoryLabel}</span>
            <div className={styles.scoreBox}>
              <span aria-hidden>⭐</span>
              <span>{recipe.baseScore.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </article>
    </DishGradeFrame>
  );
}

import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTaxonomy } from '@/contexts/TaxonomyContext';

import type { Recipe } from '@/data/types';
import { formatDuration } from '@/lib/format';
import { difficultyName, difficultyStars } from '@/features/recipes/lib/difficulty';
import { useTranslation } from '@/i18n/useTranslation';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import styles from '@/features/recipes/components/RecipeCard.module.css';

interface RecipeCardProps {
  recipe: Recipe;
  /** When set, the dish is locked for the current player: show this price. */
  lockedPrice?: number;
}

export function RecipeCard({ recipe, lockedPrice }: RecipeCardProps) {
  const { dict } = useTranslation();
  const { recipeCategoryLabel } = useTaxonomy();
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

  return (
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
          <div
            className={[styles.difficultyBadge, styles[`tier${recipe.difficulty}`] ?? '']
              .filter(Boolean)
              .join(' ')}
          >
            <span className={styles.difficultyStars}>{difficultyStars(recipe.difficulty)}</span>
            <span>{tierName}</span>
          </div>
        </div>
      </Link>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={`/recipes/${recipe.id}`} className={styles.titleLink}>
            {recipe.name}
          </Link>
        </h3>

        <p className={styles.description}>{recipe.description}</p>

        <div className={styles.cardFooter}>
          <span className={styles.categoryBadge}>{categoryLabel}</span>
          <div className={styles.scoreBox}>
            <span aria-hidden>🪙</span>
            <span>{recipe.baseScore.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

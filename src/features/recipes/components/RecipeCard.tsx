import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';

import type { Recipe } from '@/data/types';
import { formatDuration } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import styles from '@/features/recipes/components/RecipeCard.module.css';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { dict } = useTranslation();
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

  const categoryLabel = dict.recipe.categoryLabels[recipe.category] ?? recipe.category;
  const ratingScore = (4.0 + (recipe.difficulty * 0.18)).toFixed(1);

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
          <div className={styles.ratingBox}>
            <span className={styles.starIcon}>★</span>
            <span className={styles.ratingValue}>{ratingScore}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

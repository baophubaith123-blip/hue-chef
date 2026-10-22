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
  const { t, dict } = useTranslation();
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

    // Max 8 degrees limit
    const rotateX = -((y - centerY) / centerY) * 8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setTilt({
      rotateX: Math.max(-8, Math.min(8, rotateX)),
      rotateY: Math.max(-8, Math.min(8, rotateY)),
    });
  };

  const handleMouseLeave = () => {
    setTilt(null);
  };

  const categoryLabel = dict.recipe.categoryLabels[recipe.category] ?? recipe.category;

  return (
    <article
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        tilt
          ? {
              transform: `perspective(1000px) rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
              transition: 'transform 0.08s ease-out',
            }
          : {
              transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
              transition: 'transform 0.35s ease-out',
            }
      }
    >
      <div className={styles.imageWrap}>
        <ImageWithFallback
          className={styles.image}
          src={recipe.image}
          alt={recipe.name}
          fallbackTitle={recipe.name}
          loading="lazy"
        />
      </div>
      <div className={styles.body}>
        <span className={styles.category}>{categoryLabel}</span>
        <h3 className={styles.title}>
          <Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link>
        </h3>
        <p className={styles.description}>{recipe.description}</p>
        <div className={styles.meta}>
          <span>{t('recipe.difficulty')} {'★'.repeat(recipe.difficulty)}</span>
          <span>{formatDuration(recipe.duration)}</span>
          <span>{recipe.baseScore} {t('recipe.pts')}</span>
        </div>
        <Link className={styles.link} to={`/recipes/${recipe.id}`}>
          {t('recipe.viewRecipe')}
        </Link>
      </div>
    </article>
  );
}

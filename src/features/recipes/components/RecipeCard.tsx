import { Link } from 'react-router-dom';

import type { Recipe } from '@/data/types';
import { formatDuration } from '@/lib/format';

import styles from '@/features/recipes/components/RecipeCard.module.css';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <img className={styles.image} src={recipe.image} alt="" loading="lazy" />
      </div>
      <div className={styles.body}>
        <span className={styles.category}>{recipe.category}</span>
        <h3 className={styles.title}>
          <Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link>
        </h3>
        <p className={styles.description}>{recipe.description}</p>
        <div className={styles.meta}>
          <span>Difficulty {'★'.repeat(recipe.difficulty)}</span>
          <span>{formatDuration(recipe.duration)}</span>
          <span>{recipe.baseScore} pts</span>
        </div>
        <Link className={styles.link} to={`/recipes/${recipe.id}`}>
          View recipe
        </Link>
      </div>
    </article>
  );
}

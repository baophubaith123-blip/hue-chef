import { Link, Navigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { getIngredientById } from '@/data/ingredients';
import { useRecipes } from '@/contexts/RecipeContext';
import { formatDuration } from '@/lib/format';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/RecipeDetailPage.module.css';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading, getRecipeById } = useRecipes();

  if (!id) {
    return <Navigate to="/recipes" replace />;
  }

  const recipe = getRecipeById(id);

  if (isLoading) {
    return (
      <PlayerShell>
        <Loading label="Loading recipe…" />
      </PlayerShell>
    );
  }

  if (!recipe || (recipe.status ?? 'approved') !== 'approved') {
    return (
      <PlayerShell>
        <EmptyState
          title="Recipe not found"
          description="This dish may be unavailable or still pending review."
        />
        <Link className={styles.back} to="/recipes">
          ← Back to list
        </Link>
      </PlayerShell>
    );
  }

  return (
    <PlayerShell>
      <Link className={styles.back} to="/recipes">
        ← All recipes
      </Link>
      <article className={styles.hero}>
        <img className={styles.image} src={recipe.image} alt="" />
        <div>
          <h1>{recipe.name}</h1>
          <div className={styles.meta}>
            <span>{recipe.category}</span>
            <span>Difficulty {'★'.repeat(recipe.difficulty)}</span>
            <span>{formatDuration(recipe.duration)}</span>
            <span>{recipe.baseScore} base pts</span>
          </div>
          <p className={styles.description}>{recipe.description}</p>
          <h2 className={styles.sectionTitle}>Ingredients</h2>
          <ul className={styles.ingredientList}>
            {recipe.ingredients.map((item) => {
              const ingredient = getIngredientById(item.ingredientId);
              return (
                <li key={item.ingredientId}>
                  {ingredient?.name ?? item.ingredientId} — {item.amount}
                </li>
              );
            })}
          </ul>
          <h2 className={styles.sectionTitle}>Steps</h2>
          <ol className={styles.stepList}>
            {recipe.steps.map((step) => (
              <li key={step.id}>
                <strong>{step.title}</strong> — {step.description}
              </li>
            ))}
          </ol>
          <div className={styles.actions}>
            <Link to={`/cooking/${recipe.id}`}>
              <Button>Start cooking</Button>
            </Link>
          </div>
        </div>
      </article>
    </PlayerShell>
  );
}

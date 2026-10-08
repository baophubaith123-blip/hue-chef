import type { Recipe } from '@/data/types';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';

import styles from '@/features/recipes/components/RecipeGrid.module.css';

interface RecipeGridProps {
  recipes: Recipe[];
}

export function RecipeGrid({ recipes }: RecipeGridProps) {
  if (recipes.length === 0) {
    return <EmptyState title="No recipes" description="Try changing filters or search keywords." />;
  }

  return (
    <ul className={styles.grid}>
      {recipes.map((recipe) => (
        <li key={recipe.id} className={styles.item}>
          <RecipeCard recipe={recipe} />
        </li>
      ))}
    </ul>
  );
}

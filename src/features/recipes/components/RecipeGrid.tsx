import type { Recipe } from '@/data/types';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';

import styles from '@/features/recipes/components/RecipeGrid.module.css';

interface RecipeGridProps {
  recipes: Recipe[];
  /** Optional: return a dish's buy price when it is locked for the player. */
  lockedPriceFor?: (recipe: Recipe) => number | undefined;
}

export function RecipeGrid({ recipes, lockedPriceFor }: RecipeGridProps) {
  if (recipes.length === 0) {
    return <EmptyState title="No recipes" description="Try changing filters or search keywords." />;
  }

  return (
    <ul className={styles.grid}>
      {recipes.map((recipe) => (
        <li key={recipe.id} className={styles.item}>
          <RecipeCard recipe={recipe} lockedPrice={lockedPriceFor?.(recipe)} />
        </li>
      ))}
    </ul>
  );
}

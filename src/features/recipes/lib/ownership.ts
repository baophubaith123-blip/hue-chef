import type { Recipe } from '@/data/types';
import type { PublicUser } from '@/features/auth/types';

/**
 * A dish is playable when it is free (1★), was bought with xu, or has been
 * cooked before — dishes cooked under the old rules are never re-locked
 * (grandfather rule agreed with the author).
 */
export function isRecipeOwned(user: PublicUser | null, recipe: Recipe): boolean {
  if ((recipe.priceCoins ?? 0) <= 0) return true;
  if (!user) return false;
  if ((user.ownedRecipeIds ?? []).includes(recipe.id)) return true;
  return (user.cookedRecipes ?? []).some((entry) => entry.recipeId === recipe.id);
}

/** How many of the given dishes the player can already play. */
export function countOwnedRecipes(user: PublicUser | null, recipes: Recipe[]): number {
  return recipes.filter((recipe) => isRecipeOwned(user, recipe)).length;
}

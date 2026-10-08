import { SEED_INGREDIENTS } from '@/data/ingredients';
import type { Recipe } from '@/data/types';

export function buildTrayIngredientIds(recipe: Recipe, decoyCount = 3): string[] {
  const required = recipe.ingredients.map((item) => item.ingredientId);
  const requiredSet = new Set(required);

  const decoys = SEED_INGREDIENTS.filter((item) => !requiredSet.has(item.id))
    .slice(0, decoyCount)
    .map((item) => item.id);

  return [...required, ...decoys];
}

import { SEED_INGREDIENTS } from '@/data/ingredients';
import type { Recipe } from '@/data/types';

import { shuffleArray } from './shuffle';

/**
 * Decoy (distractor) ingredients per difficulty tier. Harder recipes flood
 * the tray so the player must actually read each step: tier 5 ("Địa ngục")
 * shows 20 correct + 20 decoys = 40 tokens.
 */
export const DECOY_COUNT_BY_DIFFICULTY: Record<number, number> = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
};

export function buildTrayIngredientIds(recipe: Recipe): string[] {
  const required = recipe.ingredients.map((item) => item.ingredientId);
  const requiredSet = new Set(required);

  const decoyCount = DECOY_COUNT_BY_DIFFICULTY[recipe.difficulty] ?? 3;
  const pool = SEED_INGREDIENTS.filter((item) => !requiredSet.has(item.id));
  const decoys = shuffleArray(pool)
    .slice(0, decoyCount)
    .map((item) => item.id);

  return [...required, ...decoys];
}

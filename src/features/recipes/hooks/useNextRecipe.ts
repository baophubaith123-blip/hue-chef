import { useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { Recipe } from '@/data/types';

export interface NextRecipeInfo {
  nextRecipe: Recipe | undefined;
  isCooked: boolean;
  bestScore: number;
}

/**
 * The dish the player should cook next: the lowest-difficulty dish not
 * cooked yet; once everything is cooked, the dish whose best score is
 * lowest (most room to improve). Logic lifted verbatim from the old
 * HomePage so the scene shell's centre play button and the home page
 * always agree on the same dish.
 */
export function useNextRecipe(): NextRecipeInfo {
  const { user } = useAuth();
  const { getApprovedRecipes } = useRecipes();

  const approvedRecipes = useMemo(() => getApprovedRecipes(), [getApprovedRecipes]);
  const cookedRecipes = useMemo(() => user?.cookedRecipes ?? [], [user?.cookedRecipes]);
  const distinctCookedRecipeIds = useMemo(
    () => new Set(cookedRecipes.map((r) => r.recipeId)),
    [cookedRecipes],
  );

  const nextRecipe = useMemo<Recipe | undefined>(() => {
    if (approvedRecipes.length === 0) return undefined;
    const uncooked = approvedRecipes
      .filter((r) => !distinctCookedRecipeIds.has(r.id))
      .sort((a, b) => a.difficulty - b.difficulty);
    if (uncooked.length > 0) return uncooked[0];

    const bestScoresByRecipe = new Map<string, number>();
    for (const entry of cookedRecipes) {
      const curr = bestScoresByRecipe.get(entry.recipeId) ?? 0;
      if (entry.score > curr) bestScoresByRecipe.set(entry.recipeId, entry.score);
    }
    const sortedByScore = [...approvedRecipes].sort((a, b) => {
      const scoreA = bestScoresByRecipe.get(a.id) ?? 0;
      const scoreB = bestScoresByRecipe.get(b.id) ?? 0;
      return scoreA - scoreB;
    });
    return sortedByScore[0];
  }, [approvedRecipes, distinctCookedRecipeIds, cookedRecipes]);

  const isCooked = nextRecipe ? distinctCookedRecipeIds.has(nextRecipe.id) : false;

  const bestScore = useMemo(() => {
    if (!nextRecipe) return 0;
    const matching = cookedRecipes.filter((r) => r.recipeId === nextRecipe.id);
    return matching.reduce((max, r) => Math.max(max, r.score), 0);
  }, [nextRecipe, cookedRecipes]);

  return { nextRecipe, isCooked, bestScore };
}

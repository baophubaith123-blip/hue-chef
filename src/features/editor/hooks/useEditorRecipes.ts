import { useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { Recipe } from '@/data/types';
import { AppError } from '@/lib/errors';

export function useEditorRecipes() {
  const { user } = useAuth();
  const { getRecipesByEditor, isLoading } = useRecipes();

  const editorId = user?.id ?? '';

  const myRecipes = useMemo(() => {
    if (!editorId) {
      return [];
    }
    return getRecipesByEditor(editorId);
  }, [editorId, getRecipesByEditor]);

  const stats = useMemo(() => {
    const counts = { draft: 0, pending: 0, approved: 0, rejected: 0 };
    for (const recipe of myRecipes) {
      const status = recipe.status ?? 'draft';
      if (status in counts) {
        counts[status as keyof typeof counts] += 1;
      }
    }
    return counts;
  }, [myRecipes]);

  const canEditRecipe = (recipe: Recipe | undefined): boolean => {
    if (!recipe || !editorId) {
      return false;
    }
    if (recipe.editorId !== editorId) {
      return false;
    }
    const status = recipe.status ?? 'draft';
    return status === 'draft' || status === 'rejected';
  };

  const assertCanEditRecipe = (recipe: Recipe | undefined): void => {
    if (!recipe) {
      throw new AppError('Recipe not found', 'RECIPE_NOT_FOUND');
    }
    if (recipe.editorId !== editorId) {
      throw new AppError('You cannot modify another editor’s recipe', 'FORBIDDEN');
    }
    if (!canEditRecipe(recipe)) {
      throw new AppError('Recipe cannot be edited in its current status', 'INVALID_STATUS');
    }
  };

  return {
    editorId,
    myRecipes,
    stats,
    isLoading,
    canEditRecipe,
    assertCanEditRecipe,
  };
}

import type { Recipe } from '@/data/types';
import type { RecipeFormValues } from '@/features/editor/types';
import { createRecipeSlugId } from '@/lib/slug';

export function defaultRecipeFormValues(): RecipeFormValues {
  return {
    name: '',
    category: 'banh',
    difficulty: 2,
    duration: 120,
    description: '',
    image: '/images/banh-beo.jpg',
    ingredients: [
      { ingredientId: '', amount: '' },
      { ingredientId: '', amount: '' },
      { ingredientId: '', amount: '' },
    ],
    steps: [
      { title: '', description: '', durationSeconds: 30 },
      { title: '', description: '', durationSeconds: 30 },
      { title: '', description: '', durationSeconds: 30 },
    ],
  };
}

export function recipeToFormValues(recipe: Recipe): RecipeFormValues {
  return {
    name: recipe.name,
    category: recipe.category,
    difficulty: recipe.difficulty,
    duration: recipe.duration,
    description: recipe.description,
    image: recipe.image,
    ingredients: recipe.ingredients.map((item) => ({ ...item })),
    steps: recipe.steps.map((step) => ({
      title: step.title,
      description: step.description,
      durationSeconds: step.durationSeconds,
    })),
  };
}

function baseScoreFromDifficulty(difficulty: Recipe['difficulty']): number {
  return difficulty * 200;
}

function buildSteps(recipeId: string, steps: RecipeFormValues['steps']): Recipe['steps'] {
  return steps
    .filter((step) => step.title.trim() && step.description.trim())
    .map((step, index) => ({
      id: `${recipeId}-step-${index + 1}`,
      order: index + 1,
      title: step.title.trim(),
      description: step.description.trim(),
      durationSeconds: step.durationSeconds,
    }));
}

export function formValuesToRecipe(
  values: RecipeFormValues,
  editorId: string,
  existing?: Recipe,
): Recipe {
  const id = existing?.id ?? createRecipeSlugId(values.name);
  const ingredients = values.ingredients
    .filter((item) => item.ingredientId && item.amount.trim())
    .map((item) => ({
      ingredientId: item.ingredientId,
      amount: item.amount.trim(),
    }));

  return {
    id,
    name: values.name.trim(),
    category: values.category,
    difficulty: values.difficulty,
    duration: values.duration,
    description: values.description.trim(),
    image: values.image.trim(),
    baseScore: existing?.baseScore ?? baseScoreFromDifficulty(values.difficulty),
    ingredients,
    steps: buildSteps(id, values.steps),
    status: existing?.status ?? 'draft',
    editorId,
    rejectionReason: existing?.rejectionReason,
    submittedAt: existing?.submittedAt,
    reviewedAt: existing?.reviewedAt,
  };
}

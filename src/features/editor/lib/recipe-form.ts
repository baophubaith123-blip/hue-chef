import type { Recipe } from '@/data/types';
import type { RecipeFormValues } from '@/features/editor/types';
import { suggestPriceCoins } from '@/lib/pricing';
import { createRecipeSlugId } from '@/lib/slug';

export function defaultRecipeFormValues(): RecipeFormValues {
  return {
    name: '',
    category: 'banh',
    difficulty: 2,
    duration: 120,
    description: '',
    image: '/images/banh-beo.jpg',
    baseScore: 950,
    priceCoins: suggestPriceCoins(2, 950),
    ingredients: [
      { ingredientId: '', amount: '' },
      { ingredientId: '', amount: '' },
      { ingredientId: '', amount: '' },
    ],
    steps: [
      { title: '', description: '', duration: 30, durationSeconds: 30, requiredIngredients: [], actionLabel: 'Thực hiện' },
      { title: '', description: '', duration: 30, durationSeconds: 30, requiredIngredients: [], actionLabel: 'Thực hiện' },
      { title: '', description: '', duration: 30, durationSeconds: 30, requiredIngredients: [], actionLabel: 'Thực hiện' },
    ],
    minigames: [],
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
    baseScore: recipe.baseScore,
    priceCoins: recipe.priceCoins ?? suggestPriceCoins(recipe.difficulty, recipe.baseScore),
    ingredients: recipe.ingredients.map((item) => ({ ...item })),
    steps: (recipe.steps ?? []).map((step) => ({
      title: step.title,
      description: step.description,
      duration: step.duration ?? step.durationSeconds ?? 30,
      durationSeconds: step.duration ?? step.durationSeconds ?? 30,
      requiredIngredients: step.requiredIngredients ? [...step.requiredIngredients] : [],
      actionLabel: step.actionLabel || 'Thực hiện',
    })),
    minigames: recipe.minigames ? [...recipe.minigames] : [],
    gameplay: recipe.gameplay ? { ...recipe.gameplay } : undefined,
  };
}

function buildSteps(
  recipeId: string,
  steps: RecipeFormValues['steps'],
  recipeIngredients: { ingredientId: string; amount: string }[] = [],
): Recipe['steps'] {
  return steps
    .filter((step) => step.title.trim() && step.description.trim())
    .map((step, index) => {
      const fallbackIngredientId =
        recipeIngredients[index]?.ingredientId ||
        recipeIngredients[0]?.ingredientId ||
        'beef-shank';
      const required =
        step.requiredIngredients && step.requiredIngredients.length > 0
          ? step.requiredIngredients
          : [fallbackIngredientId];
      return {
        id: `${recipeId}-step-${index + 1}`,
        order: index + 1,
        title: step.title.trim(),
        description: step.description.trim(),
        duration: step.duration ?? step.durationSeconds ?? 30,
        durationSeconds: step.duration ?? step.durationSeconds ?? 30,
        requiredIngredients: required,
        actionLabel: step.actionLabel || 'Thực hiện',
      };
    });
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
    // 1★ dishes are locked to the free 400-point standard; higher tiers use
    // the editor-provided score/price (validated against the tier band).
    baseScore: values.difficulty === 1 ? 400 : Math.max(0, Math.round(values.baseScore) || 0),
    priceCoins:
      values.difficulty === 1 ? 0 : Math.max(0, Math.round(values.priceCoins) || 0),
    ingredients,
    steps: buildSteps(id, values.steps, ingredients),
    minigames: values.minigames ?? existing?.minigames ?? [],
    gameplay: values.gameplay ?? existing?.gameplay,
    status: existing?.status ?? 'draft',
    editorId,
    rejectionReason: existing?.rejectionReason,
    submittedAt: existing?.submittedAt,
    reviewedAt: existing?.reviewedAt,
  };
}

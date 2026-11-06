import type { RecipeFormErrors, RecipeFormValues } from '@/features/editor/types';
import { SCORE_BANDS } from '@/lib/pricing';
import { getJsonStorage, STORAGE_KEYS } from '@/lib/storage';

export const VALIDATION_KEYS = {
  nameRequired: 'errors.required',
  descriptionRequired: 'errors.required',
  durationMin60: 'errors.durationMin60',
  imageRequired: 'errors.required',
  minIngredients: 'errors.minIngredients',
  minSteps: 'errors.minSteps',
  scoreOutOfBand: 'errors.scoreOutOfBand',
  scoreAboveMax: 'errors.scoreAboveMax',
  priceNegative: 'errors.priceNegative',
  duplicateIngredient: 'errors.duplicateIngredient',
} as const;

export function validateRecipeForm(values: RecipeFormValues): RecipeFormErrors {
  const errors: RecipeFormErrors = {};

  if (!values.name.trim()) {
    errors.name = VALIDATION_KEYS.nameRequired;
  }

  if (!values.description.trim()) {
    errors.description = VALIDATION_KEYS.descriptionRequired;
  }

  if (!Number.isFinite(values.duration) || values.duration < 60) {
    errors.duration = VALIDATION_KEYS.durationMin60;
  }

  if (!values.image.trim()) {
    errors.image = VALIDATION_KEYS.imageRequired;
  }

  if (values.difficulty > 1) {
    const band = SCORE_BANDS[values.difficulty];
    if (
      !Number.isFinite(values.baseScore) ||
      values.baseScore < band.min ||
      values.baseScore > band.max
    ) {
      errors.baseScore = VALIDATION_KEYS.scoreOutOfBand;
    }
    if (!Number.isFinite(values.priceCoins) || values.priceCoins < 0) {
      errors.priceCoins = VALIDATION_KEYS.priceNegative;
    }
  }

  // Admin-wide cap (Settings page): no dish may score above maxRecipeScore.
  const settings = getJsonStorage<{ maxRecipeScore?: number }>(STORAGE_KEYS.adminSettings);
  if (
    !errors.baseScore &&
    typeof settings?.maxRecipeScore === 'number' &&
    settings.maxRecipeScore > 0 &&
    Number.isFinite(values.baseScore) &&
    values.baseScore > settings.maxRecipeScore
  ) {
    errors.baseScore = VALIDATION_KEYS.scoreAboveMax;
  }

  const validIngredients = values.ingredients.filter(
    (item) => item.ingredientId.trim() && item.amount.trim(),
  );
  if (validIngredients.length < 3) {
    errors.ingredients = VALIDATION_KEYS.minIngredients;
  } else {
    const ids = validIngredients.map((item) => item.ingredientId);
    if (new Set(ids).size !== ids.length) {
      errors.ingredients = VALIDATION_KEYS.duplicateIngredient;
    }
  }

  const validSteps = values.steps.filter(
    (step) => step.title.trim() && step.description.trim() && (step.duration ?? step.durationSeconds ?? 0) > 0,
  );
  if (validSteps.length < 3) {
    errors.steps = VALIDATION_KEYS.minSteps;
  }

  return errors;
}

export function hasRecipeFormErrors(errors: RecipeFormErrors): boolean {
  return Object.values(errors).some((message) => message !== undefined);
}

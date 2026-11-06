import type { RecipeFormErrors, RecipeFormValues } from '@/features/editor/types';
import { SCORE_BANDS } from '@/lib/pricing';

export const VALIDATION_KEYS = {
  nameRequired: 'errors.required',
  descriptionRequired: 'errors.required',
  durationMin60: 'errors.durationMin60',
  imageRequired: 'errors.required',
  minIngredients: 'errors.minIngredients',
  minSteps: 'errors.minSteps',
  scoreOutOfBand: 'errors.scoreOutOfBand',
  priceNegative: 'errors.priceNegative',
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

  const validIngredients = values.ingredients.filter(
    (item) => item.ingredientId.trim() && item.amount.trim(),
  );
  if (validIngredients.length < 3) {
    errors.ingredients = VALIDATION_KEYS.minIngredients;
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

import type { Minigame } from './types';

export const REQUIRED_ACTION_BY_STARS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
};

export interface MinigameValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMinigames(
  minigames: Minigame[] | undefined,
  stars: 1 | 2 | 3 | 4 | 5,
  availableIngredientIds?: string[],
): MinigameValidationResult {
  const errors: string[] = [];
  const list = minigames ?? [];

  const requiredActionCount = REQUIRED_ACTION_BY_STARS[stars] ?? 1;
  const actionCookingCount = list.filter((m) => m.type === 'action-cooking').length;

  if (list.length === 0) {
    errors.push('minigameValidation.noMinigames');
  }

  if (actionCookingCount < requiredActionCount) {
    errors.push('minigameValidation.insufficientActionCooking');
  }

  const ids = new Set<string>();
  const validIngredientSet = availableIngredientIds ? new Set(availableIngredientIds) : null;

  list.forEach((m, idx) => {
    const itemNum = idx + 1;
    if (!m.id || m.id.trim() === '') {
      errors.push(`minigameValidation.emptyId:${itemNum}`);
    } else if (ids.has(m.id)) {
      errors.push(`minigameValidation.duplicateId:${m.id}`);
    } else {
      ids.add(m.id);
    }

    if (!m.question || m.question.trim() === '') {
      errors.push(`minigameValidation.emptyQuestion:${itemNum}`);
    }

    if (m.type === 'quiz') {
      if (!m.data.options || m.data.options.length < 2) {
        errors.push(`minigameValidation.quizFewOptions:${itemNum}`);
      } else if (m.data.options.some((opt) => !opt || opt.trim() === '')) {
        errors.push(`minigameValidation.quizEmptyOption:${itemNum}`);
      }
      if (
        typeof m.data.correctAnswerIndex !== 'number' ||
        m.data.correctAnswerIndex < 0 ||
        m.data.correctAnswerIndex >= (m.data.options?.length ?? 0)
      ) {
        errors.push(`minigameValidation.quizInvalidAnswer:${itemNum}`);
      }
    } else if (m.type === 'action-cooking') {
      if (!m.data.ingredientId || m.data.ingredientId.trim() === '') {
        errors.push(`minigameValidation.actionEmptyIngredient:${itemNum}`);
      } else if (
        validIngredientSet &&
        validIngredientSet.size > 0 &&
        !validIngredientSet.has(m.data.ingredientId)
      ) {
        errors.push(`minigameValidation.actionInvalidIngredient:${itemNum}`);
      }
      if (!m.data.correctAction) {
        errors.push(`minigameValidation.actionEmptyCorrectAction:${itemNum}`);
      }
      if (!m.data.actions || m.data.actions.length < 2) {
        errors.push(`minigameValidation.actionFewActions:${itemNum}`);
      } else if (!m.data.actions.includes(m.data.correctAction)) {
        errors.push(`minigameValidation.actionMissingCorrectInList:${itemNum}`);
      }
    } else if (m.type === 'typing-speed') {
      if (!m.data.targetText || m.data.targetText.trim() === '') {
        errors.push(`minigameValidation.typingEmptyText:${itemNum}`);
      }
      if (!['slow', 'normal', 'fast'].includes(m.data.speed)) {
        errors.push(`minigameValidation.typingInvalidSpeed:${itemNum}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function canSubmitForReview(
  minigames: Minigame[] | undefined,
  stars: 1 | 2 | 3 | 4 | 5,
  availableIngredientIds?: string[],
): boolean {
  // Every validation error blocks submission — including the required
  // action-cooking count for the tier, which used to slip through.
  const result = validateMinigames(minigames, stars, availableIngredientIds);
  return result.valid;
}

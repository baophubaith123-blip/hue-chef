import type {
  CookingStep,
  Ingredient,
  Recipe,
  RecipeCategory,
  RecipeIngredientRef,
  RecipeStatus,
} from '@/data/types';

export type CookingAction = 'steam' | 'stir-fry' | 'fry' | 'grill' | 'boil';

export interface MinigameBase {
  id: string;
  question: string;
  timeLimit: number;
  scoreReward: number;
}

export interface QuizMinigame extends MinigameBase {
  type: 'quiz';
  data: {
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  };
}

export interface ActionCookingMinigame extends MinigameBase {
  type: 'action-cooking';
  data: {
    ingredientId: string;
    actions: CookingAction[];
    correctAction: CookingAction;
  };
}

export interface TypingMinigame extends MinigameBase {
  type: 'typing-speed';
  data: {
    targetText: string;
    speed: 'slow' | 'normal' | 'fast';
  };
}

export type Minigame = QuizMinigame | ActionCookingMinigame | TypingMinigame;

export type {
  CookingStep,
  Ingredient,
  Recipe,
  RecipeCategory,
  RecipeIngredientRef,
  RecipeStatus,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isCookingAction(action: unknown): action is CookingAction {
  return (
    action === 'steam' ||
    action === 'stir-fry' ||
    action === 'fry' ||
    action === 'grill' ||
    action === 'boil'
  );
}

export function isMinigame(x: unknown): x is Minigame {
  if (!isRecord(x)) return false;
  if (
    typeof x.id !== 'string' ||
    typeof x.question !== 'string' ||
    typeof x.timeLimit !== 'number' ||
    typeof x.scoreReward !== 'number'
  ) {
    return false;
  }
  if (x.type === 'quiz') {
    if (!isRecord(x.data)) return false;
    return (
      isStringArray(x.data.options) &&
      typeof x.data.correctAnswerIndex === 'number' &&
      typeof x.data.explanation === 'string'
    );
  }
  if (x.type === 'action-cooking') {
    if (!isRecord(x.data)) return false;
    return (
      typeof x.data.ingredientId === 'string' &&
      Array.isArray(x.data.actions) &&
      x.data.actions.every(isCookingAction) &&
      isCookingAction(x.data.correctAction)
    );
  }
  if (x.type === 'typing-speed') {
    if (!isRecord(x.data)) return false;
    const speed = x.data.speed;
    return (
      typeof x.data.targetText === 'string' &&
      (speed === 'slow' || speed === 'normal' || speed === 'fast')
    );
  }
  return false;
}

export function validateMinigame(
  minigame: unknown,
  validIngredientIds?: readonly string[] | Set<string>,
): { valid: boolean; reason?: string } {
  if (!isMinigame(minigame)) {
    return { valid: false, reason: 'INVALID_MINIGAME_STRUCTURE' };
  }
  if (minigame.type === 'action-cooking' && validIngredientIds) {
    const hasIngredient =
      validIngredientIds instanceof Set
        ? validIngredientIds.has(minigame.data.ingredientId)
        : validIngredientIds.includes(minigame.data.ingredientId);
    if (!hasIngredient) {
      return {
        valid: false,
        reason: `INGREDIENT_NOT_FOUND: ${minigame.data.ingredientId}`,
      };
    }
  }
  return { valid: true };
}

export type RecipeCategory = 'bun' | 'com' | 'banh' | 'che' | 'nem';

export interface Ingredient {
  id: string;
  name: string;
  category: 'protein' | 'vegetable' | 'spice' | 'grain' | 'other';
  fallbackEmoji: string;
  image?: string;
  unit?: string;
  description?: string;
}

export interface RecipeIngredientRef {
  ingredientId: string;
  amount: string;
}

export interface CookingStep {
  id: string;
  order: number;
  title: string;
  description: string;
  requiredIngredients: string[];
  actionLabel: string;
  duration: number;
  durationSeconds?: number;
}

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

/**
 * Optional per-recipe configuration for the 5-stage game run
 * (market → catch → cook+season → finish → quiz). Every field is optional:
 * a missing toggle means "on" and a missing number means "auto by ★".
 */
export interface RecipeGameplayConfig {
  marketEnabled?: boolean;
  catchEnabled?: boolean;
  seasonEnabled?: boolean;
  finishEnabled?: boolean;
  quizEnabled?: boolean;
  /** Override for the market stage length in seconds. */
  marketSeconds?: number;
  /** Multiplier on the catch stage fall speed (1 = auto by ★). */
  catchSpeed?: number;
  /** Override for the finishing stage length in seconds. */
  finishSeconds?: number;
}

export type RecipeStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  duration: number;
  description: string;
  image: string;
  baseScore: number;
  ingredients: RecipeIngredientRef[];
  /** @deprecated – xóa ở Phase D */
  steps?: CookingStep[];
  minigames: Minigame[];
  /** 5-stage run configuration; absent = all stages on, timings auto by ★. */
  gameplay?: RecipeGameplayConfig;
  status?: RecipeStatus;
  editorId?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export type AchievementCondition =
  | { type: 'cook_count'; count: number; category?: RecipeCategory }
  | { type: 'perfect_score' }
  | { type: 'perfect_count'; count: number }
  | { type: 'no_mistakes'; count: number }
  | { type: 'all_categories' }
  | { type: 'score_threshold'; score: number }
  | { type: 'level'; level: number }
  | { type: 'cook_difficulty'; difficulty: number; count: number };

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  story?: string;
  category?: 'bun' | 'com' | 'banh' | 'che' | 'nem' | 'special';
  icon: string;
  rarity?: AchievementRarity;
  condition: AchievementCondition;
}

/**
 * Recipe category id. The five original ids ('bun' | 'com' | 'banh' | 'che' |
 * 'nem') are built-in presets with i18n labels; editors can register more
 * categories at runtime (see lib/taxonomy.ts), so the type is a plain string.
 */
export type RecipeCategory = string;

export interface Ingredient {
  id: string;
  name: string;
  /** Ingredient group id: presets 'protein' | 'vegetable' | 'spice' |
   * 'grain' | 'other' plus editor-registered groups (lib/taxonomy.ts). */
  category: string;
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
  /** Buy price in xu (coins) to unlock this dish; 0 = free (all 1★ dishes). */
  priceCoins: number;
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
  | { type: 'cook_difficulty'; difficulty: number; count: number }
  | { type: 'own_count'; count: number }
  | { type: 'coins_earned'; amount: number }
  | { type: 'own_difficulty'; difficulty: number; count: number };

/** Power granted while an achievement is the player's equipped one. Only the
 * single equipped achievement's perk is active (equip-one model). */
export type PerkKind =
  | 'coin-bonus-pct'
  | 'xp-bonus-pct'
  | 'market-time-plus'
  | 'peek-cheaper'
  | 'catch-radius-plus'
  | 'season-zone-plus'
  | 'cook-time-plus'
  | 'finish-window-plus'
  | 'quiz-time-plus'
  | 'combo-shield'
  | 'quiz-second-chance';

export interface AchievementPerk {
  kind: PerkKind;
  /** Percent for *-pct / *-plus kinds, seconds for time kinds, seconds of
   * peek cost removed for 'peek-cheaper' (99 = free), charges per run for
   * 'combo-shield' / 'quiz-second-chance'. */
  value: number;
}

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  /** Account that created this achievement ('seed-editor' for the seeded
   * catalogue, an admin/editor user id for runtime creations). */
  createdBy?: string;
  name: string;
  description: string;
  story?: string;
  category?: string;
  icon: string;
  rarity?: AchievementRarity;
  condition: AchievementCondition;
  /** Power active while this achievement is equipped (exactly one equipped). */
  perk?: AchievementPerk;
}

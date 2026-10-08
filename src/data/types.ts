export type RecipeCategory = 'bun' | 'com' | 'banh' | 'che' | 'nem';

export interface Ingredient {
  id: string;
  name: string;
  category: 'protein' | 'vegetable' | 'spice' | 'grain' | 'other';
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
  durationSeconds: number;
}

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
  steps: CookingStep[];
}

export type AchievementCondition =
  | { type: 'cook_count'; count: number; category?: RecipeCategory }
  | { type: 'perfect_score' }
  | { type: 'no_mistakes'; count: number }
  | { type: 'all_categories' }
  | { type: 'score_threshold'; score: number }
  | { type: 'level'; level: number };

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
}

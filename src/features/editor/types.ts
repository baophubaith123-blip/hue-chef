import type {
  RecipeCategory,
  RecipeGameplayConfig,
  RecipeIngredientRef,
  CookingStep,
} from '@/data/types';
import type { Minigame } from '@/features/recipes/types';

export interface RecipeFormValues {
  name: string;
  category: RecipeCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  duration: number;
  description: string;
  image: string;
  baseScore: number;
  priceCoins: number;
  ingredients: RecipeIngredientRef[];
  steps: Array<Omit<CookingStep, 'id' | 'order'>>;
  minigames?: Minigame[];
  gameplay?: RecipeGameplayConfig;
}

export interface RecipeFormErrors {
  name?: string;
  description?: string;
  duration?: string;
  image?: string;
  baseScore?: string;
  priceCoins?: string;
  ingredients?: string;
  steps?: string;
  minigames?: string;
}


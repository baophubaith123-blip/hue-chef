import type { Recipe } from '@/data/types';

export type CookingPhase = 'idle' | 'running' | 'success' | 'failed';

export interface CookingSession {
  recipe: Recipe;
  phase: CookingPhase;
  timeRemainingSeconds: number;
  totalDurationSeconds: number;
  correctCount: number;
  wrongCount: number;
  nextIngredientIndex: number;
  placedIngredientIds: string[];
  runningScoreDelta: number;
  finalScore: number;
  stars: 1 | 2 | 3 | 4 | 5;
  failReason?: 'timeout' | 'abandoned';
}

export interface CookingState {
  session: CookingSession | null;
}

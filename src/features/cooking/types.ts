import type { Recipe } from '@/data/types';

export type CookingPhase = 'idle' | 'running' | 'minigames' | 'success' | 'failed';

export interface MinigameResultEntry {
  minigameId: string;
  title: string;
  type: 'action-cooking' | 'quiz' | 'typing-speed';
  success: boolean;
  score: number;
}

export interface CookingSession {
  recipe: Recipe;
  phase: CookingPhase;
  timeRemainingSeconds: number;
  totalDurationSeconds: number;
  correctCount: number;
  wrongCount: number;
  currentStepIndex: number;
  potIngredients: string[];
  actionButtonLabel: string | null;
  completedStepIndexes: number[];
  runningScoreDelta: number;
  /** Consecutive correct drops right now (resets on a wrong drop). */
  comboStreak: number;
  /** Longest combo streak reached during this session. */
  maxCombo: number;
  /** Total combo bonus points banked (added on top of the lib/score total). */
  comboBonus: number;
  finalScore: number;
  stars: 1 | 2 | 3 | 4 | 5;
  failReason?: 'timeout' | 'abandoned';
  minigameResults?: MinigameResultEntry[];
}

export interface CookingState {
  session: CookingSession | null;
}

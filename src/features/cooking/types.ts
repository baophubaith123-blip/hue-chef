import type { Recipe } from '@/data/types';

export type CookingPhase =
  | 'idle'
  | 'market'
  | 'catch'
  | 'running'
  | 'finish'
  | 'minigames'
  | 'success'
  | 'failed';

/** One scored stage of the 5-stage run (points flow through the bonus channel). */
export interface StageResultEntry {
  stage: 'market' | 'catch' | 'season' | 'finish';
  score: number;
}

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
  /** Consecutive correct drops right now (resets on a wrong drop or after 2s idle). */
  comboStreak: number;
  /** Timestamp (ms) of the last correct drop — the combo dies 2s after it. */
  lastComboAt: number | null;
  /** Longest combo streak reached during this session. */
  maxCombo: number;
  /** Total combo bonus points banked (added on top of the lib/score total). */
  comboBonus: number;
  /** Total bonus banked by the new run stages (market / catch / season / finish). */
  stageBonus: number;
  /** Per-stage breakdown of stageBonus, shown on the result modal. */
  stageResults: StageResultEntry[];
  finalScore: number;
  stars: 1 | 2 | 3 | 4 | 5;
  failReason?: 'timeout' | 'abandoned';
  minigameResults?: MinigameResultEntry[];
}

export interface CookingState {
  session: CookingSession | null;
}

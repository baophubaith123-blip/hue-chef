import type { Recipe } from '@/data/types';
import type { ScoreComponentKey, ScorePlan } from '@/features/cooking/lib/score-rescale';

export type CookingPhase =
  | 'idle'
  | 'market'
  | 'catch'
  | 'running'
  | 'finish'
  | 'minigames'
  | 'success'
  | 'failed';

/** A scored stage of the 5-stage run that banks points mid-run. */
export type RunStageKey = 'market' | 'catch' | 'season' | 'finish';

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
  /** Total raw combo bonus points banked during the cook stage (stat only —
   *  combo value reaches the total folded into the cook component's share). */
  comboBonus: number;
  /** Max points per run component: the dish's baseScore split by weight. */
  scorePlan: ScorePlan;
  /** Rescaled points banked per component, shown on the result modal. */
  scoreParts: Partial<Record<ScoreComponentKey, number>>;
  /** Exact (float) rescaled earnings of the cook component, rounded at the end. */
  cookEarnedExact: number;
  /** Total required ingredient drops across all steps (cook share divisor). */
  totalDropTargets: number;
  finalScore: number;
  stars: 1 | 2 | 3 | 4 | 5;
  failReason?: 'timeout' | 'abandoned';
  minigameResults?: MinigameResultEntry[];
}

export interface CookingState {
  session: CookingSession | null;
}

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import type {
  CookingSession,
  CookingState,
  MinigameResultEntry,
  RunStageKey,
} from '@/features/cooking/types';
import type { Recipe } from '@/data/types';
import { COMBO_WINDOW_MS, comboBonusForStreak } from '@/features/cooking/lib/combo';
import {
  clampRatio,
  computeScorePlan,
  starsForRatio,
  type ScoreComponentKey,
} from '@/features/cooking/lib/score-rescale';
import { firstStagePhase, resolveStageConfig } from '@/features/cooking/lib/stage-config';
import { AppError } from '@/lib/errors';
import { winThreshold } from '@/lib/pricing';
import { SCORE_RULES } from '@/lib/score';

type StageCompletion = 'market' | 'catch' | 'finish';

type CookingAction =
  | { type: 'START'; recipe: Recipe }
  | { type: 'COMPLETE_STAGE'; stage: StageCompletion; bonus: number }
  | { type: 'ADD_BONUS'; stage: RunStageKey; amount: number }
  | { type: 'DROP_INGREDIENT'; ingredientId: string; at: number }
  | { type: 'COMBO_EXPIRE'; at: number }
  | { type: 'EXECUTE_STEP_ACTION' }
  | { type: 'COMPLETE_MINIGAMES'; bonusScore: number; minigameResults: MinigameResultEntry[] }
  | { type: 'TICK' }
  | { type: 'RESET' };

interface CookingContextValue {
  session: CookingSession | null;
  startCooking: (recipe: Recipe) => void;
  /** Bank a finished run stage's rescaled points and advance to the next stage. */
  completeStage: (stage: StageCompletion, bonus: number) => void;
  /** Bank rescaled points earned mid-stage (the seasoning bar during cooking). */
  addStageBonus: (stage: RunStageKey, amount: number) => void;
  dropIngredient: (ingredientId: string) => boolean; // returns true if correct drag, false if wrong drag
  expireCombo: (at: number) => void;
  executeStepAction: () => void;
  completeMinigames: (bonusScore: number, minigameResults: MinigameResultEntry[]) => void;
  tickTimer: () => void;
  resetCooking: () => void;
}

const initialState: CookingState = { session: null };

const CookingContext = createContext<CookingContextValue | null>(null);

/**
 * Conversion factor from raw cook points (lib/score's +50/−20 scale) into
 * the cook component's rescaled share of the dish's value.
 */
function cookFactor(session: CookingSession): number {
  if (session.totalDropTargets <= 0) return 0;
  return session.scorePlan.cook / (session.totalDropTargets * SCORE_RULES.correctPoints);
}

/** Bank rescaled points for one component, capped at its planned share. */
function bankPart(
  session: CookingSession,
  key: ScoreComponentKey,
  points: number,
): { parts: Partial<Record<ScoreComponentKey, number>>; banked: number } {
  const cap = session.scorePlan[key];
  const previous = session.scoreParts[key] ?? 0;
  const next = Math.min(cap, Math.max(0, previous + points));
  return {
    parts: { ...session.scoreParts, [key]: next },
    banked: next - previous,
  };
}

/**
 * Assemble the final score from the per-component parts. The dish's
 * baseScore is the ceiling: a perfect run earns exactly baseScore, and the
 * star rating is the earned ratio against it (lib/score thresholds).
 */
function assembleFinal(
  session: CookingSession,
  extraParts: Partial<Record<ScoreComponentKey, number>>,
): CookingSession {
  const plan = session.scorePlan;
  const cookPoints = Math.min(
    plan.cook,
    Math.max(0, Math.round(session.cookEarnedExact)),
  );
  const timeRatio =
    session.totalDurationSeconds > 0
      ? clampRatio(session.timeRemainingSeconds / session.totalDurationSeconds)
      : 0;
  const parts: Partial<Record<ScoreComponentKey, number>> = {
    ...session.scoreParts,
    ...extraParts,
    cook: cookPoints,
    time: Math.round(plan.time * timeRatio),
  };
  const finalScore = Object.values(parts).reduce((sum, value) => sum + (value ?? 0), 0);
  const stars = starsForRatio(
    session.recipe.baseScore > 0 ? finalScore / session.recipe.baseScore : 0,
  );
  return { ...session, scoreParts: parts, finalScore, stars };
}

function finalizeSession(session: CookingSession, timedOut: boolean): CookingSession {
  if (timedOut) {
    return {
      ...session,
      phase: 'failed',
      failReason: 'timeout',
      finalScore: 0,
      stars: 1,
    };
  }
  const finished = assembleFinal(session, {});
  // Author's win rule: a run only counts as a win at >= 40% of the dish's
  // value — below that the run fails and earns no xu / XP / cooked mark.
  if (finished.finalScore < winThreshold(finished.recipe.baseScore)) {
    return { ...finished, phase: 'failed', failReason: 'low-score' };
  }
  return { ...finished, phase: 'success' };
}

function cookingReducer(state: CookingState, action: CookingAction): CookingState {
  const { session } = state;

  switch (action.type) {
    case 'START': {
      const recipe = action.recipe;
      const totalDurationSeconds = recipe.duration;
      const cfg = resolveStageConfig(recipe);
      const steps = recipe.steps ?? [];
      // The dish's baseScore is split into weighted component shares; the
      // split renormalises over the components this run actually has.
      const scorePlan = computeScorePlan(recipe.baseScore, {
        market: cfg.marketEnabled,
        catch: cfg.catchEnabled,
        cook: true,
        season: cfg.seasonEnabled && steps.some((step) => Boolean(step.actionLabel)),
        finish: cfg.finishEnabled,
        quiz: cfg.quizEnabled && (recipe.minigames?.length ?? 0) > 0,
        time: true,
      });
      const nextSession: CookingSession = {
        recipe,
        phase: firstStagePhase(recipe),
        timeRemainingSeconds: totalDurationSeconds,
        totalDurationSeconds,
        correctCount: 0,
        wrongCount: 0,
        currentStepIndex: 0,
        potIngredients: [],
        actionButtonLabel: null,
        completedStepIndexes: [],
        runningScoreDelta: 0,
        comboStreak: 0,
        lastComboAt: null,
        maxCombo: 0,
        comboBonus: 0,
        scorePlan,
        scoreParts: {},
        cookEarnedExact: 0,
        totalDropTargets: Math.max(
          1,
          steps.reduce((sum, step) => sum + step.requiredIngredients.length, 0),
        ),
        finalScore: 0,
        stars: 1,
      };
      return { session: nextSession };
    }
    case 'COMPLETE_STAGE': {
      if (!session || session.phase !== action.stage) {
        return state;
      }
      const cfg = resolveStageConfig(session.recipe);
      const { parts, banked: bankedPoints } = bankPart(session, action.stage, action.bonus);
      const banked: CookingSession = {
        ...session,
        runningScoreDelta: session.runningScoreDelta + bankedPoints,
        scoreParts: parts,
      };
      if (action.stage === 'market') {
        return { session: { ...banked, phase: cfg.catchEnabled ? 'catch' : 'running' } };
      }
      if (action.stage === 'catch') {
        return { session: { ...banked, phase: 'running' } };
      }
      // finish → quiz minigames when the recipe has any and the stage is on.
      if (cfg.quizEnabled && (session.recipe.minigames?.length ?? 0) > 0) {
        return { session: { ...banked, phase: 'minigames' } };
      }
      return { session: finalizeSession(banked, false) };
    }
    case 'ADD_BONUS': {
      if (!session) {
        return state;
      }
      const { parts, banked } = bankPart(session, action.stage, action.amount);
      return {
        session: {
          ...session,
          runningScoreDelta: session.runningScoreDelta + banked,
          scoreParts: parts,
        },
      };
    }
    case 'TICK': {
      if (!session || session.phase !== 'running') {
        return state;
      }
      if (session.timeRemainingSeconds <= 1) {
        return { session: finalizeSession({ ...session, timeRemainingSeconds: 0 }, true) };
      }
      return {
        session: {
          ...session,
          timeRemainingSeconds: session.timeRemainingSeconds - 1,
        },
      };
    }
    case 'DROP_INGREDIENT': {
      if (!session || session.phase !== 'running') {
        return state;
      }

      const steps = session.recipe.steps ?? [];
      const currentStep = steps[session.currentStepIndex];
      if (!currentStep) {
        return state;
      }

      const isRequired = currentStep.requiredIngredients.includes(action.ingredientId);

      if (isRequired) {
        if (session.potIngredients.includes(action.ingredientId)) {
          return state;
        }
        const nextPotIngredients = [...session.potIngredients, action.ingredientId];
        // A step may require several ingredients: the action button only
        // unlocks once every required ingredient of the step is in the pot.
        const stepComplete = currentStep.requiredIngredients.every((id) =>
          nextPotIngredients.includes(id),
        );
        // Combo: every correct drop extends the streak; from the 2nd drop
        // in a row it banks bonus points (see features/cooking/lib/combo).
        // The raw gain is converted into the cook component's share so the
        // run total can never pass the dish's baseScore.
        const nextStreak = session.comboStreak + 1;
        const comboGain = comboBonusForStreak(nextStreak);
        const convertedGain = comboGain * cookFactor(session);
        return {
          session: {
            ...session,
            potIngredients: nextPotIngredients,
            actionButtonLabel: stepComplete ? currentStep.actionLabel : null,
            comboStreak: nextStreak,
            lastComboAt: action.at,
            maxCombo: Math.max(session.maxCombo, nextStreak),
            comboBonus: session.comboBonus + comboGain,
            cookEarnedExact: session.cookEarnedExact + convertedGain,
            runningScoreDelta: session.runningScoreDelta + convertedGain,
          },
        };
      }

      const convertedPenalty = SCORE_RULES.wrongPenalty * cookFactor(session);
      return {
        session: {
          ...session,
          wrongCount: session.wrongCount + 1,
          cookEarnedExact: session.cookEarnedExact - convertedPenalty,
          runningScoreDelta: session.runningScoreDelta - convertedPenalty,
          actionButtonLabel: null,
          // A wrong drop breaks the combo streak (banked bonus is kept).
          comboStreak: 0,
          lastComboAt: null,
        },
      };
    }
    case 'COMBO_EXPIRE': {
      if (!session || session.phase !== 'running') {
        return state;
      }
      // The combo only lives 2 seconds after the last correct drop.
      if (
        session.comboStreak > 0 &&
        session.lastComboAt !== null &&
        action.at - session.lastComboAt >= COMBO_WINDOW_MS
      ) {
        return { session: { ...session, comboStreak: 0, lastComboAt: null } };
      }
      return state;
    }
    case 'EXECUTE_STEP_ACTION': {
      if (!session || session.phase !== 'running' || !session.actionButtonLabel) {
        return state;
      }

      const steps = session.recipe.steps ?? [];
      const currentStepIndex = session.currentStepIndex;
      const nextStepIndex = currentStepIndex + 1;
      // Score per ingredient (not per step), converted into the cook
      // component's share of the dish's value.
      const stepIngredientCount = steps[currentStepIndex]?.requiredIngredients.length ?? 1;
      const convertedGain =
        SCORE_RULES.correctPoints * stepIngredientCount * cookFactor(session);
      const updated: CookingSession = {
        ...session,
        correctCount: session.correctCount + stepIngredientCount,
        currentStepIndex: nextStepIndex,
        completedStepIndexes: [...session.completedStepIndexes, currentStepIndex],
        potIngredients: [],
        actionButtonLabel: null,
        cookEarnedExact: session.cookEarnedExact + convertedGain,
        runningScoreDelta: session.runningScoreDelta + convertedGain,
      };

      if (nextStepIndex >= steps.length) {
        // The 5-stage run continues with the finishing rhythm stage before
        // the quiz; without it, fall back to the classic minigame flow.
        const cfg = resolveStageConfig(session.recipe);
        if (cfg.finishEnabled) {
          return {
            session: {
              ...updated,
              phase: 'finish',
            },
          };
        }
        if (cfg.quizEnabled && session.recipe.minigames && session.recipe.minigames.length > 0) {
          return {
            session: {
              ...updated,
              phase: 'minigames',
            },
          };
        }
        return { session: finalizeSession(updated, false) };
      }
      return { session: updated };
    }
    case 'COMPLETE_MINIGAMES': {
      if (!session || session.phase !== 'minigames') {
        return state;
      }
      // The quiz stage earns its planned share by performance ratio: raw
      // minigame points (including speed/streak bonuses inside them) are
      // measured against the games' total reward, then rescaled — per-game
      // rows on the result modal are rescaled by the same factor.
      const results = action.minigameResults;
      const rewardById = new Map(
        (session.recipe.minigames ?? []).map((game) => [game.id, game.scoreReward]),
      );
      const totalReward = results.reduce(
        (sum, entry) => sum + (rewardById.get(entry.minigameId) ?? 0),
        0,
      );
      const earnedRaw = results.reduce((sum, entry) => sum + Math.max(0, entry.score), 0);
      const quizRatio =
        totalReward > 0
          ? clampRatio(earnedRaw / totalReward)
          : results.every((entry) => entry.success)
            ? 1
            : 0;
      const quizPoints = Math.round(session.scorePlan.quiz * quizRatio);
      const rescaleFactor = totalReward > 0 ? session.scorePlan.quiz / totalReward : 0;
      const rescaledResults = results.map((entry) => ({
        ...entry,
        score: Math.max(0, Math.round(entry.score * rescaleFactor)),
      }));
      const assembled = assembleFinal(session, { quiz: quizPoints });
      // Same 40% win rule as finalizeSession: below the threshold the run
      // fails even though every stage was played through.
      if (assembled.finalScore < winThreshold(assembled.recipe.baseScore)) {
        return {
          session: {
            ...assembled,
            phase: 'failed',
            failReason: 'low-score' as const,
            minigameResults: rescaledResults,
          },
        };
      }
      return {
        session: {
          ...assembled,
          phase: 'success',
          minigameResults: rescaledResults,
        },
      };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function CookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cookingReducer, initialState);

  const startCooking = useCallback((recipe: Recipe) => {
    dispatch({ type: 'START', recipe });
  }, []);

  const completeStage = useCallback((stage: StageCompletion, bonus: number) => {
    dispatch({ type: 'COMPLETE_STAGE', stage, bonus });
  }, []);

  const addStageBonus = useCallback((stage: RunStageKey, amount: number) => {
    dispatch({ type: 'ADD_BONUS', stage, amount });
  }, []);

  const dropIngredient = useCallback(
    (ingredientId: string): boolean => {
      const currentSession = state.session;
      if (!currentSession || currentSession.phase !== 'running') {
        return false;
      }
      const steps = currentSession.recipe.steps ?? [];
      const currentStep = steps[currentSession.currentStepIndex];
      const isCorrect = Boolean(
        currentStep && currentStep.requiredIngredients.includes(ingredientId),
      );
      dispatch({ type: 'DROP_INGREDIENT', ingredientId, at: Date.now() });
      return isCorrect;
    },
    [state.session],
  );

  const expireCombo = useCallback((at: number) => {
    dispatch({ type: 'COMBO_EXPIRE', at });
  }, []);

  const executeStepAction = useCallback(() => {
    dispatch({ type: 'EXECUTE_STEP_ACTION' });
  }, []);

  const completeMinigames = useCallback(
    (bonusScore: number, minigameResults: MinigameResultEntry[]) => {
      dispatch({ type: 'COMPLETE_MINIGAMES', bonusScore, minigameResults });
    },
    [],
  );

  const tickTimer = useCallback(() => {
    dispatch({ type: 'TICK' });
  }, []);

  const resetCooking = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo(
    () => ({
      session: state.session,
      startCooking,
      completeStage,
      addStageBonus,
      dropIngredient,
      expireCombo,
      executeStepAction,
      completeMinigames,
      tickTimer,
      resetCooking,
    }),
    [
      state.session,
      startCooking,
      completeStage,
      addStageBonus,
      dropIngredient,
      expireCombo,
      executeStepAction,
      completeMinigames,
      tickTimer,
      resetCooking,
    ],
  );

  return <CookingContext.Provider value={value}>{children}</CookingContext.Provider>;
}

export function useCooking(): CookingContextValue {
  const ctx = useContext(CookingContext);
  if (!ctx) {
    throw new AppError('useCooking must be used within CookingProvider', 'COOKING_CONTEXT');
  }
  return ctx;
}

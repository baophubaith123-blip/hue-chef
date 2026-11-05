import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import type { CookingSession, CookingState, MinigameResultEntry } from '@/features/cooking/types';
import type { Recipe } from '@/data/types';
import { comboBonusForStreak } from '@/features/cooking/lib/combo';
import { AppError } from '@/lib/errors';
import { calculateScoreResult, calculateStars, SCORE_RULES, type ScoreInput } from '@/lib/score';

type CookingAction =
  | { type: 'START'; recipe: Recipe }
  | { type: 'DROP_INGREDIENT'; ingredientId: string }
  | { type: 'EXECUTE_STEP_ACTION' }
  | { type: 'COMPLETE_MINIGAMES'; bonusScore: number; minigameResults: MinigameResultEntry[] }
  | { type: 'TICK' }
  | { type: 'RESET' };

interface CookingContextValue {
  session: CookingSession | null;
  startCooking: (recipe: Recipe) => void;
  dropIngredient: (ingredientId: string) => boolean; // returns true if correct drag, false if wrong drag
  executeStepAction: () => void;
  completeMinigames: (bonusScore: number, minigameResults: MinigameResultEntry[]) => void;
  tickTimer: () => void;
  resetCooking: () => void;
}

const initialState: CookingState = { session: null };

const CookingContext = createContext<CookingContextValue | null>(null);

function buildScoreInput(session: CookingSession, timedOut: boolean): ScoreInput {
  const steps = session.recipe.steps ?? [];
  const allIngredientsAdded = session.currentStepIndex >= steps.length;
  return {
    baseScore: session.recipe.baseScore,
    correctCount: session.correctCount,
    wrongCount: session.wrongCount,
    timeRemainingSeconds: session.timeRemainingSeconds,
    totalDurationSeconds: session.totalDurationSeconds,
    timedOut,
    allIngredientsAdded,
  };
}

function finalizeSession(session: CookingSession, timedOut: boolean): CookingSession {
  const scoreInput = buildScoreInput(session, timedOut);
  const { totalScore } = calculateScoreResult(scoreInput, session.recipe.ingredients.length);

  if (timedOut) {
    return {
      ...session,
      phase: 'failed',
      failReason: 'timeout',
      finalScore: 0,
      stars: 1,
    };
  }

  // Combo bonus is an extension layer on top of the lib/score total
  // (same channel as minigame bonus points); lib/score.ts stays untouched.
  const finalScore = Math.max(0, totalScore + session.comboBonus);
  const stars = calculateStars(finalScore, session.recipe.baseScore, session.recipe.ingredients.length);

  return {
    ...session,
    phase: 'success',
    finalScore,
    stars,
  };
}

function cookingReducer(state: CookingState, action: CookingAction): CookingState {
  const { session } = state;

  switch (action.type) {
    case 'START': {
      const recipe = action.recipe;
      const totalDurationSeconds = recipe.duration;
      const nextSession: CookingSession = {
        recipe,
        phase: 'running',
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
        maxCombo: 0,
        comboBonus: 0,
        finalScore: 0,
        stars: 1,
      };
      return { session: nextSession };
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
        const nextStreak = session.comboStreak + 1;
        const comboGain = comboBonusForStreak(nextStreak);
        return {
          session: {
            ...session,
            potIngredients: nextPotIngredients,
            actionButtonLabel: stepComplete ? currentStep.actionLabel : null,
            comboStreak: nextStreak,
            maxCombo: Math.max(session.maxCombo, nextStreak),
            comboBonus: session.comboBonus + comboGain,
            runningScoreDelta: session.runningScoreDelta + comboGain,
          },
        };
      }

      return {
        session: {
          ...session,
          wrongCount: session.wrongCount + 1,
          runningScoreDelta: session.runningScoreDelta - SCORE_RULES.wrongPenalty,
          actionButtonLabel: null,
          // A wrong drop breaks the combo streak (banked bonus is kept).
          comboStreak: 0,
        },
      };
    }
    case 'EXECUTE_STEP_ACTION': {
      if (!session || session.phase !== 'running' || !session.actionButtonLabel) {
        return state;
      }

      const steps = session.recipe.steps ?? [];
      const currentStepIndex = session.currentStepIndex;
      const nextStepIndex = currentStepIndex + 1;
      // Score per ingredient (not per step) so multi-ingredient steps match
      // the max-score model in lib/score, which scales with ingredient count.
      const stepIngredientCount = steps[currentStepIndex]?.requiredIngredients.length ?? 1;
      const updated: CookingSession = {
        ...session,
        correctCount: session.correctCount + stepIngredientCount,
        currentStepIndex: nextStepIndex,
        completedStepIndexes: [...session.completedStepIndexes, currentStepIndex],
        potIngredients: [],
        actionButtonLabel: null,
        runningScoreDelta:
          session.runningScoreDelta + SCORE_RULES.correctPoints * stepIngredientCount,
      };

      if (nextStepIndex >= steps.length) {
        if (session.recipe.minigames && session.recipe.minigames.length > 0) {
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
      const scoreInput = buildScoreInput(session, false);
      const { totalScore: dragDropScore } = calculateScoreResult(
        scoreInput,
        session.recipe.ingredients.length,
      );
      const finalScore = Math.max(0, dragDropScore + session.comboBonus + action.bonusScore);
      const stars = calculateStars(
        finalScore,
        session.recipe.baseScore,
        session.recipe.ingredients.length,
      );
      return {
        session: {
          ...session,
          phase: 'success',
          finalScore,
          stars,
          minigameResults: action.minigameResults,
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
      dispatch({ type: 'DROP_INGREDIENT', ingredientId });
      return isCorrect;
    },
    [state.session],
  );

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
      dropIngredient,
      executeStepAction,
      completeMinigames,
      tickTimer,
      resetCooking,
    }),
    [
      state.session,
      startCooking,
      dropIngredient,
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

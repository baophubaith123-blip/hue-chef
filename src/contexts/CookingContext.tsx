import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import type { CookingSession, CookingState } from '@/features/cooking/types';
import type { Recipe } from '@/data/types';
import { AppError } from '@/lib/errors';
import { calculateScoreResult, SCORE_RULES, type ScoreInput } from '@/lib/score';

type CookingAction =
  | { type: 'START'; recipe: Recipe }
  | { type: 'DROP_INGREDIENT'; ingredientId: string }
  | { type: 'EXECUTE_STEP_ACTION' }
  | { type: 'TICK' }
  | { type: 'RESET' };

interface CookingContextValue {
  session: CookingSession | null;
  startCooking: (recipe: Recipe) => void;
  dropIngredient: (ingredientId: string) => boolean; // returns true if correct drag, false if wrong drag
  executeStepAction: () => void;
  tickTimer: () => void;
  resetCooking: () => void;
}

const initialState: CookingState = { session: null };

const CookingContext = createContext<CookingContextValue | null>(null);

function buildScoreInput(session: CookingSession, timedOut: boolean): ScoreInput {
  const allIngredientsAdded = session.currentStepIndex >= session.recipe.steps.length;
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
  const { totalScore, stars } = calculateScoreResult(
    scoreInput,
    session.recipe.ingredients.length,
  );

  if (timedOut) {
    return {
      ...session,
      phase: 'failed',
      failReason: 'timeout',
      finalScore: 0,
      stars: 1,
    };
  }

  return {
    ...session,
    phase: 'success',
    finalScore: totalScore,
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

      const currentStep = session.recipe.steps[session.currentStepIndex];
      if (!currentStep) {
        return state;
      }

      const isRequired = currentStep.requiredIngredients.includes(action.ingredientId);

      if (isRequired) {
        return {
          session: {
            ...session,
            potIngredients: [...session.potIngredients, action.ingredientId],
            actionButtonLabel: currentStep.actionLabel,
          },
        };
      }

      return {
        session: {
          ...session,
          wrongCount: session.wrongCount + 1,
          runningScoreDelta: session.runningScoreDelta - SCORE_RULES.wrongPenalty,
          actionButtonLabel: null,
        },
      };
    }
    case 'EXECUTE_STEP_ACTION': {
      if (!session || session.phase !== 'running' || !session.actionButtonLabel) {
        return state;
      }

      const currentStepIndex = session.currentStepIndex;
      const nextStepIndex = currentStepIndex + 1;
      const updated: CookingSession = {
        ...session,
        correctCount: session.correctCount + 1,
        currentStepIndex: nextStepIndex,
        completedStepIndexes: [...session.completedStepIndexes, currentStepIndex],
        potIngredients: [],
        actionButtonLabel: null,
        runningScoreDelta: session.runningScoreDelta + SCORE_RULES.correctPoints,
      };

      if (nextStepIndex >= session.recipe.steps.length) {
        return { session: finalizeSession(updated, false) };
      }
      return { session: updated };
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
      const currentStep = currentSession.recipe.steps[currentSession.currentStepIndex];
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
      tickTimer,
      resetCooking,
    }),
    [state.session, startCooking, dropIngredient, executeStepAction, tickTimer, resetCooking],
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

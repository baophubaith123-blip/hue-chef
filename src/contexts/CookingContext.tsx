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
  | { type: 'TICK' }
  | { type: 'RESET' };

interface CookingContextValue {
  session: CookingSession | null;
  startCooking: (recipe: Recipe) => void;
  dropIngredient: (ingredientId: string) => void;
  tickTimer: () => void;
  resetCooking: () => void;
}

const initialState: CookingState = { session: null };

const CookingContext = createContext<CookingContextValue | null>(null);

function buildScoreInput(session: CookingSession, timedOut: boolean): ScoreInput {
  const totalIngredients = session.recipe.ingredients.length;
  const allIngredientsAdded = session.nextIngredientIndex >= totalIngredients;
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
        nextIngredientIndex: 0,
        placedIngredientIds: [],
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

      const expected = session.recipe.ingredients[session.nextIngredientIndex];
      if (!expected) {
        return state;
      }

      if (action.ingredientId === expected.ingredientId) {
        const nextIndex = session.nextIngredientIndex + 1;
        const updated: CookingSession = {
          ...session,
          correctCount: session.correctCount + 1,
          nextIngredientIndex: nextIndex,
          placedIngredientIds: [...session.placedIngredientIds, action.ingredientId],
          runningScoreDelta: session.runningScoreDelta + SCORE_RULES.correctPoints,
        };

        if (nextIndex >= session.recipe.ingredients.length) {
          return { session: finalizeSession(updated, false) };
        }
        return { session: updated };
      }

      return {
        session: {
          ...session,
          wrongCount: session.wrongCount + 1,
          runningScoreDelta: session.runningScoreDelta - SCORE_RULES.wrongPenalty,
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

  const dropIngredient = useCallback((ingredientId: string) => {
    dispatch({ type: 'DROP_INGREDIENT', ingredientId });
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
      tickTimer,
      resetCooking,
    }),
    [state.session, startCooking, dropIngredient, tickTimer, resetCooking],
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

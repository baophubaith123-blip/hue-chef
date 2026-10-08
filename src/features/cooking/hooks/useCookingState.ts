import { useCooking } from '@/contexts/CookingContext';
import { useCookingTimer } from '@/features/cooking/hooks/useCookingTimer';
import { SCORE_RULES } from '@/lib/score';

export function useCookingState() {
  const { session, startCooking, dropIngredient, tickTimer, resetCooking } = useCooking();

  const isRunning = session?.phase === 'running';

  useCookingTimer(isRunning, tickTimer);

  const expectedIngredientId =
    session && session.phase === 'running'
      ? session.recipe.ingredients[session.nextIngredientIndex]?.ingredientId
      : undefined;

  const liveScore =
    session && session.phase === 'running'
      ? Math.max(0, session.runningScoreDelta)
      : session?.finalScore ?? 0;

  return {
    session,
    isRunning,
    liveScore,
    expectedIngredientId,
    scoreRules: SCORE_RULES,
    startCooking,
    dropIngredient,
    resetCooking,
  };
}

import { useCooking } from '@/contexts/CookingContext';
import { useCookingTimer } from '@/features/cooking/hooks/useCookingTimer';
import { SCORE_RULES } from '@/lib/score';

export function useCookingState() {
  const {
    session,
    startCooking,
    completeStage,
    addStageBonus,
    dropIngredient,
    expireCombo,
    executeStepAction,
    completeMinigames,
    tickTimer,
    resetCooking,
  } = useCooking();

  const isRunning = session?.phase === 'running';

  useCookingTimer(isRunning, tickTimer);

  const liveScore =
    session && session.phase === 'running'
      ? Math.max(0, session.recipe.baseScore + session.runningScoreDelta)
      : session?.finalScore ?? 0;

  return {
    session,
    isRunning,
    liveScore,
    scoreRules: SCORE_RULES,
    startCooking,
    completeStage,
    addStageBonus,
    dropIngredient,
    expireCombo,
    executeStepAction,
    completeMinigames,
    resetCooking,
  };
}

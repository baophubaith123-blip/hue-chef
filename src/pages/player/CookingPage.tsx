import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { useRecipes } from '@/contexts/RecipeContext';
import { CookingPot } from '@/features/cooking/components/CookingPot';
import { CookingResultModal } from '@/features/cooking/components/CookingResultModal';
import { CookingTimer } from '@/features/cooking/components/CookingTimer';
import { IngredientTray } from '@/features/cooking/components/IngredientTray';
import { StepList } from '@/features/cooking/components/StepList';
import { useCookingState } from '@/features/cooking/hooks/useCookingState';
import { useDragDrop } from '@/features/cooking/hooks/useDragDrop';
import { buildTrayIngredientIds } from '@/features/cooking/lib/tray-ingredients';
import { shuffleArray } from '@/features/cooking/lib/shuffle';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/CookingPage.module.css';

export default function CookingPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading, getRecipeById } = useRecipes();
  const {
    session,
    isRunning,
    startCooking,
    dropIngredient,
    resetCooking,
    scoreRules,
  } = useCookingState();

  const [shakePot, setShakePot] = useState(false);
  const [sparklePot, setSparklePot] = useState(false);
  const animationTimerRef = useRef<number | null>(null);

  const recipe = id ? getRecipeById(id) : undefined;
  const approved = recipe && (recipe.status ?? 'approved') === 'approved';

  const trayIngredientIds = useMemo(() => {
    if (!recipe) {
      return [];
    }
    return shuffleArray(buildTrayIngredientIds(recipe));
  }, [recipe]);

  const clearAnimationTimer = useCallback(() => {
    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  }, []);

  const pulseAnimation = useCallback(
    (kind: 'shake' | 'sparkle') => {
      clearAnimationTimer();
      if (kind === 'shake') {
        setShakePot(true);
        setSparklePot(false);
      } else {
        setSparklePot(true);
        setShakePot(false);
      }
      animationTimerRef.current = window.setTimeout(() => {
        setShakePot(false);
        setSparklePot(false);
        animationTimerRef.current = null;
      }, 500);
    },
    [clearAnimationTimer],
  );

  useEffect(() => {
    if (isLoading || !id) {
      return undefined;
    }
    const current = getRecipeById(id);
    if (!current || (current.status ?? 'approved') !== 'approved') {
      return undefined;
    }
    startCooking(current);
    return () => {
      clearAnimationTimer();
      resetCooking();
    };
  }, [id, isLoading, getRecipeById, startCooking, resetCooking, clearAnimationTimer]);

  const handleDropOnPot = useCallback(
    (ingredientId: string) => {
      if (!session || session.phase !== 'running') {
        return;
      }
      const expected = session.recipe.ingredients[session.nextIngredientIndex];
      dropIngredient(ingredientId);
      if (expected && ingredientId === expected.ingredientId) {
        pulseAnimation('sparkle');
      } else {
        pulseAnimation('shake');
      }
    },
    [dropIngredient, pulseAnimation, session],
  );

  const { draggingId, getTrayItemProps } = useDragDrop({ onDropOnPot: handleDropOnPot });

  if (!id) {
    return <Navigate to="/recipes" replace />;
  }

  if (isLoading) {
    return (
      <PlayerShell>
        <Loading label="Preparing kitchen…" />
      </PlayerShell>
    );
  }

  if (!approved || !recipe) {
    return (
      <PlayerShell>
        <EmptyState title="Cannot cook this dish" description="Recipe missing or not approved." />
        <Link className={styles.back} to="/recipes">
          ← Back to recipes
        </Link>
      </PlayerShell>
    );
  }

  if (!session || session.recipe.id !== recipe.id) {
    return (
      <PlayerShell>
        <Loading label="Starting session…" />
      </PlayerShell>
    );
  }

  const activeStepIndex = Math.min(
    session.nextIngredientIndex,
    Math.max(0, session.recipe.steps.length - 1),
  );

  const showResult = session.phase === 'success' || session.phase === 'failed';
  const sessionEnded = session.phase !== 'running';

  const displayScore =
    session.phase === 'running'
      ? session.recipe.baseScore + session.runningScoreDelta
      : session.finalScore;

  return (
    <PlayerShell>
      <Link className={styles.back} to={`/recipes/${recipe.id}`}>
        ← Recipe detail
      </Link>
      <div className={styles.top}>
        <div>
          <h1 className={styles.title}>{recipe.name}</h1>
          <p className={styles.subtitle}>
            Drop ingredients in order · +{scoreRules.correctPoints} correct · −
            {scoreRules.wrongPenalty} wrong
          </p>
        </div>
        <div className={styles.scorePanel}>
          <span className={styles.scoreLabel}>Score</span>
          <span className={styles.scoreValue}>{displayScore}</span>
          {session.phase === 'running' ? (
            <p className={styles.scoreHint}>
              Session bonus {session.runningScoreDelta >= 0 ? '+' : ''}
              {session.runningScoreDelta}
            </p>
          ) : null}
        </div>
      </div>

      <CookingTimer
        timeRemainingSeconds={session.timeRemainingSeconds}
        totalDurationSeconds={session.totalDurationSeconds}
        isRunning={isRunning}
      />

      <div className={styles.grid}>
        <IngredientTray
          trayIngredientIds={trayIngredientIds}
          placedIngredientIds={session.placedIngredientIds}
          draggingId={draggingId}
          disabled={sessionEnded}
          getTrayItemProps={getTrayItemProps}
        />
        <CookingPot
          disabled={sessionEnded}
          onDropOnPot={handleDropOnPot}
          placedCount={session.placedIngredientIds.length}
          shake={shakePot}
          sparkle={sparklePot}
        />
        <StepList steps={session.recipe.steps} activeStepIndex={activeStepIndex} />
      </div>

      {showResult ? (
        <CookingResultModal
          session={session}
          onClose={resetCooking}
          onRetry={() => startCooking(recipe)}
        />
      ) : null}
    </PlayerShell>
  );
}

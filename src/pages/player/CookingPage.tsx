import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import type { Achievement } from '@/data/types';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements } from '@/contexts/AchievementContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { CookedRecipeEntry } from '@/features/auth/types';
import type { CookingSession } from '@/features/cooking/types';
import { CookingPot } from '@/features/cooking/components/CookingPot';
import { CookingResultModal } from '@/features/cooking/components/CookingResultModal';
import { CookingTimer } from '@/features/cooking/components/CookingTimer';
import { IngredientTray } from '@/features/cooking/components/IngredientTray';
import { StepList } from '@/features/cooking/components/StepList';
import { useCookingState } from '@/features/cooking/hooks/useCookingState';
import { useDragDrop } from '@/features/cooking/hooks/useDragDrop';
import { buildTrayIngredientIds } from '@/features/cooking/lib/tray-ingredients';
import { shuffleArray } from '@/features/cooking/lib/shuffle';
import { useTranslation } from '@/i18n/useTranslation';
import { calculateXpFromStars } from '@/lib/score';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/CookingPage.module.css';

export default function CookingPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isLoading, getRecipeById } = useRecipes();
  const { user, addXp, addCookedRecipe } = useAuth();
  const { checkAndUnlockForUser } = useAchievements();
  const { push: pushNotification } = useNotification();
  const {
    session,
    isRunning,
    startCooking,
    dropIngredient,
    executeStepAction,
    resetCooking,
    scoreRules,
  } = useCookingState();

  const [shakePot, setShakePot] = useState(false);
  const [sparklePot, setSparklePot] = useState(false);
  const [appliedResult, setAppliedResult] = useState<{
    gainedXp: number;
    newLevel?: number;
    unlockedAchievements: Achievement[];
  } | null>(null);
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

  const buildCookedEntry = useCallback(
    (currentSession: CookingSession): CookedRecipeEntry => {
      const { recipe: r, finalScore, stars, totalDurationSeconds, timeRemainingSeconds } = currentSession;
      const timeUsed = Math.max(0, totalDurationSeconds - timeRemainingSeconds);
      return {
        recipeId: r.id,
        recipeName: r.name,
        score: finalScore,
        stars,
        timeUsed,
        cookedAt: new Date().toISOString(),
        image: r.image,
        category: r.category,
      };
    },
    [],
  );

  const handleApplyProgress = useCallback(() => {
    if (!session || session.phase !== 'success' || !user) return;
    if (appliedResult) return;

    const xp = calculateXpFromStars(session.stars);
    const xpResult = addXp(xp);
    const entry = buildCookedEntry(session);
    addCookedRecipe(entry);

    const stored = {
      level: xpResult?.level ?? user.level ?? 1,
      exp: xpResult?.exp ?? (user.exp ?? 0) + xp,
      maxExp: xpResult?.maxExp ?? user.maxExp ?? 1000,
      cookedRecipes: [...(user.cookedRecipes ?? []), entry],
    };

    const achievementProgress = {
      totalScore: entry.score,
      perfectScoreCount: entry.stars === 5 ? 1 : 0,
      noMistakeCookCount: session.wrongCount === 0 ? 1 : 0,
    };

    const enrichedUser = {
      ...user,
      level: stored.level,
      exp: stored.exp,
      maxExp: stored.maxExp,
      cookedRecipes: stored.cookedRecipes,
    };

    const unlocked = checkAndUnlockForUser(enrichedUser, achievementProgress);

    for (const achievement of unlocked) {
      pushNotification({
        userId: user.id,
        type: 'achievement.unlocked',
        title: t('cooking.result.achievementUnlockTitle'),
        body: `${achievement.name} — ${achievement.description}`,
        link: '/achievements',
        relatedId: achievement.id,
      });
    }

    setAppliedResult({
      gainedXp: xp,
      newLevel: xpResult?.leveledUp ? xpResult.level : undefined,
      unlockedAchievements: unlocked,
    });
  }, [
    session,
    user,
    appliedResult,
    addXp,
    addCookedRecipe,
    buildCookedEntry,
    checkAndUnlockForUser,
    pushNotification,
    t,
  ]);

  useEffect(() => {
    if (isLoading || !id) {
      return undefined;
    }
    const current = getRecipeById(id);
    if (!current || (current.status ?? 'approved') !== 'approved') {
      return undefined;
    }
    setAppliedResult(null);
    startCooking(current);
    return () => {
      clearAnimationTimer();
      resetCooking();
      setAppliedResult(null);
    };
  }, [id, isLoading, getRecipeById, startCooking, resetCooking, clearAnimationTimer]);

  const handleDropOnPot = useCallback(
    (ingredientId: string) => {
      if (!session || session.phase !== 'running') {
        return;
      }
      const isCorrect = dropIngredient(ingredientId);
      if (isCorrect) {
        pulseAnimation('sparkle');
      } else {
        pulseAnimation('shake');
      }
    },
    [dropIngredient, pulseAnimation, session],
  );

  const handleExecuteAction = useCallback(() => {
    executeStepAction();
    pulseAnimation('sparkle');
  }, [executeStepAction, pulseAnimation]);

  const { draggingId, getTrayItemProps } = useDragDrop({ onDropOnPot: handleDropOnPot });

  const placedIngredientIds = useMemo(() => {
    if (!session) return [];
    const usedInCompleted = session.completedStepIndexes.flatMap(
      (idx) => session.recipe.steps[idx]?.requiredIngredients ?? [],
    );
    return [...usedInCompleted, ...session.potIngredients];
  }, [session]);

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
    session.currentStepIndex,
    Math.max(0, session.recipe.steps.length - 1),
  );

  const showResult = session.phase === 'success' || session.phase === 'failed';
  const sessionEnded = session.phase !== 'running';

  const displayScore =
    session.phase === 'running'
      ? Math.max(0, session.recipe.baseScore + session.runningScoreDelta)
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
            Drop required ingredients for step · +{scoreRules.correctPoints} correct · −
            {scoreRules.wrongPenalty} wrong
          </p>
        </div>
        <div className={styles.scorePanel}>
          <span className={styles.scoreLabel}>Score</span>
          <span className={styles.scoreValue}>{displayScore}</span>
          {session.phase === 'running' ? (
            <p className={styles.scoreHint}>
              Session delta {session.runningScoreDelta >= 0 ? '+' : ''}
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
          placedIngredientIds={placedIngredientIds}
          draggingId={draggingId}
          disabled={sessionEnded}
          getTrayItemProps={getTrayItemProps}
        />
        <CookingPot
          disabled={sessionEnded}
          onDropOnPot={handleDropOnPot}
          potIngredients={session.potIngredients}
          actionButtonLabel={session.actionButtonLabel}
          onExecuteAction={handleExecuteAction}
          shake={shakePot}
          sparkle={sparklePot}
        />
        <StepList
          steps={session.recipe.steps}
          activeStepIndex={activeStepIndex}
          completedStepIndexes={session.completedStepIndexes}
        />
      </div>

      {showResult ? (
        <CookingResultModal
          session={session}
          onClose={resetCooking}
          onRetry={() => startCooking(recipe)}
          onApplyProgress={handleApplyProgress}
          gainedXp={appliedResult?.gainedXp}
          newLevel={appliedResult?.newLevel}
          unlockedAchievements={appliedResult?.unlockedAchievements}
        />
      ) : null}
    </PlayerShell>
  );
}

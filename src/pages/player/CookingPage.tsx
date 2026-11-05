import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import type { Achievement } from '@/data/types';
import { getIngredientById } from '@/data/ingredients';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements } from '@/contexts/AchievementContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { CookedRecipeEntry } from '@/features/auth/types';
import type { CookingSession, MinigameResultEntry } from '@/features/cooking/types';
import { CookingPot, type PotDropFx } from '@/features/cooking/components/CookingPot';
import { CookingResultModal } from '@/features/cooking/components/CookingResultModal';
import { CookingTimer } from '@/features/cooking/components/CookingTimer';
import { IngredientTray } from '@/features/cooking/components/IngredientTray';
import { StepList } from '@/features/cooking/components/StepList';
import { MinigameRunner } from '@/features/cooking/components/minigames/MinigameRunner';
import { useCookingState } from '@/features/cooking/hooks/useCookingState';
import { useDragDrop } from '@/features/cooking/hooks/useDragDrop';
import { COMBO_WINDOW_MS, comboBonusForStreak } from '@/features/cooking/lib/combo';
import { buildTrayIngredientIds } from '@/features/cooking/lib/tray-ingredients';
import { shuffleArray } from '@/features/cooking/lib/shuffle';
import { useTranslation } from '@/i18n/useTranslation';
import { calculateXpFromStars } from '@/lib/score';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/CookingPage.module.css';

export default function CookingPage() {
  const { id } = useParams<{ id: string }>();
  const { t, dict } = useTranslation();
  const { isLoading, getRecipeById } = useRecipes();
  const { user, addXp, addCookedRecipe } = useAuth();
  const { checkAndUnlockForUser } = useAchievements();
  const { push: pushNotification } = useNotification();
  const {
    session,
    isRunning,
    startCooking,
    dropIngredient,
    expireCombo,
    executeStepAction,
    completeMinigames,
    resetCooking,
    scoreRules,
  } = useCookingState();

  const [shakePot, setShakePot] = useState(false);
  const [sparklePot, setSparklePot] = useState(false);
  const [dropFx, setDropFx] = useState<PotDropFx | null>(null);
  const fxTimerRef = useRef<number | null>(null);
  const [viewMinigames, setViewMinigames] = useState(false);
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

  const amountByIngredientId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ref of recipe?.ingredients ?? []) {
      map[ref.ingredientId] = ref.amount;
    }
    return map;
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
      if (fxTimerRef.current !== null) {
        window.clearTimeout(fxTimerRef.current);
        fxTimerRef.current = null;
      }
      setDropFx(null);
      resetCooking();
      setAppliedResult(null);
    };
  }, [id, isLoading, getRecipeById, startCooking, resetCooking, clearAnimationTimer]);

  const handleDropOnPot = useCallback(
    (ingredientId: string) => {
      if (!session || session.phase !== 'running') {
        return;
      }
      // Pre-compute the drop outcome from the current snapshot so the pot
      // can show the floating "+points" popup in the same frame. The combo
      // formula is shared with CookingContext via lib/combo.
      const steps = session.recipe.steps ?? [];
      const currentStep = steps[session.currentStepIndex];
      const isFreshCorrect = Boolean(
        currentStep &&
          currentStep.requiredIngredients.includes(ingredientId) &&
          !session.potIngredients.includes(ingredientId),
      );
      const isCorrect = dropIngredient(ingredientId);
      if (isCorrect) {
        pulseAnimation('sparkle');
        if (isFreshCorrect) {
          const comboGain = comboBonusForStreak(session.comboStreak + 1);
          if (fxTimerRef.current !== null) {
            window.clearTimeout(fxTimerRef.current);
          }
          setDropFx({
            key: Date.now(),
            ingredientName: getIngredientById(ingredientId)?.name ?? ingredientId,
            points: scoreRules.correctPoints + comboGain,
          });
          fxTimerRef.current = window.setTimeout(() => {
            setDropFx(null);
            fxTimerRef.current = null;
          }, 1350);
        }
      } else {
        pulseAnimation('shake');
      }
    },
    [dropIngredient, pulseAnimation, session, scoreRules],
  );

  const handleExecuteAction = useCallback(() => {
    executeStepAction();
    pulseAnimation('sparkle');
  }, [executeStepAction, pulseAnimation]);

  // Combo lifetime: the streak dies COMBO_WINDOW_MS after the last
  // correct drop; this timer re-arms on every new correct drop.
  const comboStreakNow = session?.comboStreak ?? 0;
  const lastComboAt = session?.lastComboAt ?? null;
  useEffect(() => {
    if (comboStreakNow <= 0 || lastComboAt === null) {
      return undefined;
    }
    const remaining = Math.max(0, COMBO_WINDOW_MS - (Date.now() - lastComboAt));
    const timer = window.setTimeout(() => {
      expireCombo(Date.now());
    }, remaining + 30);
    return () => window.clearTimeout(timer);
  }, [comboStreakNow, lastComboAt, expireCombo]);

  const handleMinigamesAllComplete = useCallback(
    (results: MinigameResultEntry[], totalBonusScore: number) => {
      completeMinigames(totalBonusScore, results);
    },
    [completeMinigames],
  );

  const { draggingId, getTrayItemProps } = useDragDrop({ onDropOnPot: handleDropOnPot });

  const placedIngredientIds = useMemo(() => {
    if (!session) return [];
    const steps = session.recipe.steps ?? [];
    const usedInCompleted = session.completedStepIndexes.flatMap(
      (idx) => steps[idx]?.requiredIngredients ?? [],
    );
    return [...usedInCompleted, ...session.potIngredients];
  }, [session]);

  if (!id) {
    return <Navigate to="/recipes" replace />;
  }

  if (isLoading) {
    return (
      <PlayerShell>
        <Loading label={t('cooking.preparingKitchen')} />
      </PlayerShell>
    );
  }

  if (!approved || !recipe) {
    return (
      <PlayerShell>
        <EmptyState
          title={t('cooking.cannotCook')}
          description={t('cooking.recipeMissing')}
        />
        <Link className={styles.back} to="/recipes">
          {t('cooking.backToRecipes')}
        </Link>
      </PlayerShell>
    );
  }

  if (!session || session.recipe.id !== recipe.id) {
    return (
      <PlayerShell>
        <Loading label={t('cooking.startingSession')} />
      </PlayerShell>
    );
  }

  const sessionSteps = session.recipe.steps ?? [];
  const activeStepIndex = Math.min(
    session.currentStepIndex,
    Math.max(0, sessionSteps.length - 1),
  );
  const activeStep = sessionSteps[activeStepIndex];
  const currentRequiredIds = activeStep?.requiredIngredients ?? [];
  const requiredNames = currentRequiredIds
    .filter((reqId) => !session.potIngredients.includes(reqId))
    .map((reqId) => getIngredientById(reqId)?.name ?? reqId)
    .join(', ');

  const showResult = session.phase === 'success' || session.phase === 'failed';
  const sessionEnded = session.phase !== 'running';

  const displayScore =
    session.phase === 'running' || session.phase === 'minigames'
      ? Math.max(0, session.recipe.baseScore + session.runningScoreDelta)
      : session.finalScore;

  const isMinigamesPhase =
    session.phase === 'minigames' ||
    (viewMinigames && (session.recipe.minigames?.length ?? 0) > 0);

  if (isMinigamesPhase) {
    return (
      <PlayerShell>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <Link className={styles.back} to={`/recipes/${recipe.id}`}>
            ← {t('cooking.recipeDetail')}
          </Link>
          {viewMinigames && (
            <button
              type="button"
              className={styles.back}
              onClick={() => setViewMinigames(false)}
            >
              🍳 {t('cooking.pot')}
            </button>
          )}
        </div>
        <div className={styles.top}>
          <div>
            <h1 className={styles.title}>{recipe.name}</h1>
            <p className={styles.subtitle}>{dict.cooking.minigames.headerTitle}</p>
          </div>
          <div className={styles.scorePanel}>
            <span className={styles.scoreLabel}>{t('cooking.score')}</span>
            <span className={styles.scoreValue}>{displayScore}</span>
          </div>
        </div>

        <MinigameRunner
          minigames={session.recipe.minigames ?? []}
          onAllComplete={handleMinigamesAllComplete}
        />
      </PlayerShell>
    );
  }

  return (
    <PlayerShell>
      <Link className={styles.back} to={`/recipes/${recipe.id}`}>
        ← {t('cooking.recipeDetail')}
      </Link>
      <div className={styles.top}>
        <div className={styles.hudDish}>
          <img src={recipe.image} alt="" className={styles.hudThumb} />
          <div className={styles.hudDishText}>
            <h1 className={styles.title}>{recipe.name}</h1>
            <p className={styles.subtitle}>
              {t('cooking.hudStepOf', {
                current: Math.min(session.currentStepIndex + 1, sessionSteps.length),
                total: sessionSteps.length,
              })}
              {activeStep ? ` · ${activeStep.title} · ` : ' · '}
              {t('cooking.stepInstruction', {
                correct: scoreRules.correctPoints,
                wrong: scoreRules.wrongPenalty,
              })}
            </p>
          </div>
        </div>
        <div className={styles.hudTimer}>
          <CookingTimer
            timeRemainingSeconds={session.timeRemainingSeconds}
            totalDurationSeconds={session.totalDurationSeconds}
            isRunning={isRunning}
            inHud
          />
        </div>
        <div className={styles.hudRight}>
          <div className={styles.scorePanel}>
            <span className={styles.scoreLabel}>{t('cooking.score')}</span>
            <span className={styles.scoreValue}>{displayScore}</span>
            {session.phase === 'running' ? (
              <p className={styles.scoreHint}>
                {t('cooking.sessionDelta')} {session.runningScoreDelta >= 0 ? '+' : ''}
                {session.runningScoreDelta}
              </p>
            ) : null}
          </div>
          {(session.recipe.minigames?.length ?? 0) > 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setViewMinigames(true)}
            >
              🎮 Minigame ({session.recipe.minigames?.length})
            </Button>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        <StepList
          steps={sessionSteps}
          activeStepIndex={activeStepIndex}
          completedStepIndexes={session.completedStepIndexes}
        />
        <CookingPot
          disabled={sessionEnded}
          onDropOnPot={handleDropOnPot}
          potIngredients={session.potIngredients}
          requiredCount={currentRequiredIds.length}
          actionButtonLabel={session.actionButtonLabel}
          onExecuteAction={handleExecuteAction}
          shake={shakePot}
          sparkle={sparklePot}
          comboStreak={session.comboStreak}
          lastComboAt={session.lastComboAt}
          requiredNames={requiredNames}
          dropFx={dropFx}
        />
        <IngredientTray
          trayIngredientIds={trayIngredientIds}
          placedIngredientIds={placedIngredientIds}
          requiredIngredientIds={currentRequiredIds}
          amountByIngredientId={amountByIngredientId}
          draggingId={draggingId}
          disabled={sessionEnded}
          getTrayItemProps={getTrayItemProps}
          onSelectIngredient={handleDropOnPot}
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

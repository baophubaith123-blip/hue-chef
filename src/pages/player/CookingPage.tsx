import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { Achievement } from '@/data/types';
import { getIngredientById } from '@/data/ingredients';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements } from '@/contexts/AchievementContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { CookedRecipeEntry } from '@/features/auth/types';
import { getDefaultPathForRole } from '@/features/auth/types';
import type { CookingSession, MinigameResultEntry } from '@/features/cooking/types';
import { CookingPot, type PotDropFx } from '@/features/cooking/components/CookingPot';
import { CookingResultModal } from '@/features/cooking/components/CookingResultModal';
import { CookingTimer } from '@/features/cooking/components/CookingTimer';
import { IngredientTray } from '@/features/cooking/components/IngredientTray';
import { StepList } from '@/features/cooking/components/StepList';
import { MinigameRunner } from '@/features/cooking/components/minigames/MinigameRunner';
import { CatchStage } from '@/features/cooking/components/run/CatchStage';
import { FinishStage } from '@/features/cooking/components/run/FinishStage';
import { MarketStage } from '@/features/cooking/components/run/MarketStage';
import { SeasonBar, type SeasonOutcome } from '@/features/cooking/components/run/SeasonBar';
import { StageHelp } from '@/features/cooking/components/run/StageHelp';
import { useCookingState } from '@/features/cooking/hooks/useCookingState';
import { useDragDrop } from '@/features/cooking/hooks/useDragDrop';
import { COMBO_WINDOW_MS, comboBonusForStreak } from '@/features/cooking/lib/combo';
import { SEASON_MAX_BONUS_RATIO } from '@/features/cooking/lib/stage-bonus';
import { resolveStageConfig } from '@/features/cooking/lib/stage-config';
import {
  applyPerkToStageConfig,
  perkValueOf,
  resolveEquippedPerk,
} from '@/features/achievements/lib/perks';
import { isRecipeOwned } from '@/features/recipes/lib/ownership';
import { buildTrayIngredientIds } from '@/features/cooking/lib/tray-ingredients';
import { shuffleArray } from '@/features/cooking/lib/shuffle';
import { useTranslation } from '@/i18n/useTranslation';
import { FIRST_CLEAR_BONUS_RATIO, coinsForScore } from '@/lib/pricing';
import { calculateXpFromStars } from '@/lib/score';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/CookingPage.module.css';

export default function CookingPage() {
  const { id } = useParams<{ id: string }>();
  const { t, dict } = useTranslation();
  const { isLoading, getRecipeById } = useRecipes();
  const { user, addXp, addCoins, addCookedRecipe } = useAuth();
  const navigate = useNavigate();
  const { checkAndUnlockForUser, allAchievements, isUnlocked } = useAchievements();
  const { push: pushNotification } = useNotification();
  const {
    session,
    isRunning,
    startCooking,
    consumeQuizSecondChance,
    completeStage,
    addStageBonus,
    dropIngredient,
    expireCombo,
    executeStepAction,
    completeMinigames,
    resetCooking,
    scoreRules,
  } = useCookingState();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  // Equip-one perk model: only the equipped achievement's perk is active,
  // snapshotted into the run when it starts (preview runs get no perk).
  const equippedPerk = useMemo(() => {
    if (isPreview || !user) return null;
    return resolveEquippedPerk(
      user.equippedAchievementId,
      allAchievements,
      isUnlocked(user.id, user.equippedAchievementId ?? ''),
    );
  }, [isPreview, user, allAchievements, isUnlocked]);

  const [shakePot, setShakePot] = useState(false);
  const [sparklePot, setSparklePot] = useState(false);
  const [dropFx, setDropFx] = useState<PotDropFx | null>(null);
  const fxTimerRef = useRef<number | null>(null);
  const [seasonOpen, setSeasonOpen] = useState(false);
  // Rescaled points the currently running stage reports live, so the HUD
  // total never exceeds the dish's value even mid-stage.
  const [liveStagePoints, setLiveStagePoints] = useState(0);
  const [seasonToast, setSeasonToast] = useState<string | null>(null);
  const seasonToastTimerRef = useRef<number | null>(null);
  const [appliedResult, setAppliedResult] = useState<{
    gainedXp: number;
    gainedCoins: number;
    firstClear: boolean;
    newLevel?: number;
    unlockedAchievements: Achievement[];
  } | null>(null);
  const animationTimerRef = useRef<number | null>(null);
  const guardCheckedIdRef = useRef<string | null>(null);

  const recipe = id ? getRecipeById(id) : undefined;
  const approved = recipe && (recipe.status ?? 'approved') === 'approved';
  // "Chạy thử 5 màn": the recipe's own editor (or an admin) may run a
  // not-yet-approved recipe with ?preview=1; progress is never applied.
  const previewAllowed =
    isPreview &&
    recipe &&
    (recipe.editorId === user?.id || user?.role === 'admin');
  const canCook = Boolean(approved || previewAllowed);

  // Editors/admins reach this route only to PREVIEW a dish (no progress is
  // applied in preview). Without ?preview=1 they belong to their own area.
  if (user && user.role !== 'player' && !previewAllowed) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

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
    if (isPreview) return;
    if (appliedResult) return;

    const xpPerkPct = perkValueOf(session.perk, 'xp-bonus-pct');
    const xp = Math.round(calculateXpFromStars(session.stars) * (1 + xpPerkPct / 100));
    const xpResult = addXp(xp);
    // Coins: 10 points = 1 xu, plus +50% the first time this dish is
    // completed. Must be computed before the cooked entry is recorded.
    const firstClear = !(user.cookedRecipes ?? []).some(
      (entry) => entry.recipeId === session.recipe.id,
    );
    const baseCoins = coinsForScore(session.finalScore);
    const coinPerkPct = perkValueOf(session.perk, 'coin-bonus-pct');
    const gainedCoins = Math.floor(
      (firstClear ? Math.round(baseCoins * (1 + FIRST_CLEAR_BONUS_RATIO)) : baseCoins) *
        (1 + coinPerkPct / 100),
    );
    if (gainedCoins > 0) {
      addCoins(gainedCoins);
    }
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
      gainedCoins,
      firstClear,
      newLevel: xpResult?.leveledUp ? xpResult.level : undefined,
      unlockedAchievements: unlocked,
    });
  }, [
    session,
    user,
    appliedResult,
    addXp,
    addCoins,
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
    const currentApproved = current && (current.status ?? 'approved') === 'approved';
    const currentPreview =
      isPreview &&
      current &&
      (current.editorId === user?.id || user?.role === 'admin');
    if (!current || (!currentApproved && !currentPreview)) {
      return undefined;
    }
    // Shop guard: a locked dish cannot be cooked by direct URL — send the
    // player to its detail page where the buy panel lives. Checked once per
    // recipe mount: the user object changes when progress is applied at the
    // end of a run, and re-running this effect would restart the session.
    if (!currentPreview && user && guardCheckedIdRef.current !== current.id) {
      guardCheckedIdRef.current = current.id;
      if (!isRecipeOwned(user, current)) {
        navigate(`/recipes/${current.id}`, { replace: true });
        return undefined;
      }
    }
    setAppliedResult(null);
    startCooking(current, equippedPerk);
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
  }, [
    id,
    isLoading,
    getRecipeById,
    startCooking,
    resetCooking,
    clearAnimationTimer,
    isPreview,
    user?.id,
    user?.role,
    navigate,
    equippedPerk,
  ]);

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
          // The floater shows the rescaled value of the drop inside the
          // cook component's share, matching the capped run total.
          const dropFactor =
            session.totalDropTargets > 0
              ? session.scorePlan.cook /
                (session.totalDropTargets * scoreRules.correctPoints)
              : 0;
          setDropFx({
            key: Date.now(),
            ingredientName: getIngredientById(ingredientId)?.name ?? ingredientId,
            points: Math.max(
              1,
              Math.round((scoreRules.correctPoints + comboGain) * dropFactor),
            ),
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

  const stageConfig = useMemo(
    () =>
      recipe ? applyPerkToStageConfig(resolveStageConfig(recipe), session?.perk ?? null) : null,
    [recipe, session?.perk],
  );

  const handleExecuteAction = useCallback(() => {
    // With the seasoning stage on, the action button first opens the
    // seasoning bar; the step only executes once the bar is stopped well
    // (a far miss closes the bar and the player seasons again).
    if (stageConfig?.seasonEnabled && session?.actionButtonLabel) {
      setSeasonOpen(true);
      return;
    }
    executeStepAction();
    pulseAnimation('sparkle');
  }, [executeStepAction, pulseAnimation, session?.actionButtonLabel, stageConfig]);

  const handleSeasonResult = useCallback(
    (outcome: SeasonOutcome, bonus: number) => {
      setSeasonOpen(false);
      if (outcome === 'miss') {
        setSeasonToast(dict.cooking.stages.seasonMiss);
        if (seasonToastTimerRef.current !== null) {
          window.clearTimeout(seasonToastTimerRef.current);
        }
        seasonToastTimerRef.current = window.setTimeout(() => setSeasonToast(null), 3200);
        return;
      }
      if (bonus > 0) {
        addStageBonus('season', bonus);
      }
      executeStepAction();
      pulseAnimation('sparkle');
    },
    [addStageBonus, dict, executeStepAction, pulseAnimation],
  );

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

  // Stage components report their live rescaled earnings; reset the report
  // whenever the run moves on (banked points take over the HUD total).
  const sessionPhase = session?.phase;
  useEffect(() => {
    setLiveStagePoints(0);
  }, [sessionPhase]);

  const handleMinigamesAllComplete = useCallback(
    (results: MinigameResultEntry[], totalBonusScore: number) => {
      completeMinigames(totalBonusScore, results);
    },
    [completeMinigames],
  );

  const { draggingId, getTrayItemProps } = useDragDrop({ onDropOnPot: handleDropOnPot });

  // "Used" is per-step: the pot empties when a step's action runs
  // (EXECUTE_STEP_ACTION resets potIngredients), so an ingredient a later
  // step needs again must be droppable again. Counting completed steps
  // here disabled its only tray chip and made such recipes unfinishable.
  const placedIngredientIds = useMemo(() => {
    if (!session) return [];
    return [...session.potIngredients];
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

  if (!canCook || !recipe) {
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
    session.phase === 'success' || session.phase === 'failed'
      ? session.finalScore
      : Math.max(0, Math.round(session.runningScoreDelta) + liveStagePoints);

  // Seasoning: hand the bar a VIRTUAL step-points value so its bonus comes
  // out already rescaled into the season share — each step's slice of the
  // share is proportional to its raw seasoning maximum.
  const seasonRawMaxOf = (step: (typeof sessionSteps)[number]) =>
    Math.round(
      scoreRules.correctPoints *
        Math.max(1, step.requiredIngredients.length) *
        SEASON_MAX_BONUS_RATIO,
    );
  const seasonTotalRawMax = sessionSteps
    .filter((step) => Boolean(step.actionLabel))
    .reduce((sum, step) => sum + seasonRawMaxOf(step), 0);
  const seasonVirtualStepPoints =
    seasonTotalRawMax > 0 && activeStep
      ? (session.scorePlan.season * seasonRawMaxOf(activeStep)) /
        seasonTotalRawMax /
        SEASON_MAX_BONUS_RATIO
      : scoreRules.correctPoints * Math.max(1, currentRequiredIds.length);

  // 5-stage run progress chips (① market → ② catch → ③ cook → ④ finish → ⑤ quiz).
  const stageDict = dict.cooking.stages;
  const flowSteps: Array<{ key: string; label: string; phase: string }> = [];
  if (stageConfig?.marketEnabled) {
    flowSteps.push({ key: 'market', label: `① ${stageDict.marketName}`, phase: 'market' });
  }
  if (stageConfig?.catchEnabled) {
    flowSteps.push({ key: 'catch', label: `② ${stageDict.catchName}`, phase: 'catch' });
  }
  flowSteps.push({ key: 'cook', label: `③ ${stageDict.cookName}`, phase: 'running' });
  if (stageConfig?.finishEnabled) {
    flowSteps.push({ key: 'finish', label: `④ ${stageDict.finishName}`, phase: 'finish' });
  }
  if (stageConfig?.quizEnabled && (recipe.minigames?.length ?? 0) > 0) {
    flowSteps.push({
      key: 'quiz',
      label: `⑤ ${dict.cooking.minigames.headerTitle}`,
      phase: 'minigames',
    });
  }
  const phaseOrder = ['market', 'catch', 'running', 'finish', 'minigames', 'success', 'failed'];
  const currentPhaseIdx = phaseOrder.indexOf(session.phase);
  const flowChips = (
    <div className={styles.stageFlow}>
      {session.perk ? (
        <span className={[styles.stageFlowChip, styles.perkChip].filter(Boolean).join(' ')}>
          ⚡ {dict.perks.name[session.perk.kind]}: {dict.perks.describe[session.perk.kind](session.perk.value)}
          {session.perk.kind === 'combo-shield' && session.comboShieldLeft > 0
            ? ` (🛡️ ×${session.comboShieldLeft})`
            : ''}
          {session.perk.kind === 'quiz-second-chance' && session.quizSecondChanceLeft > 0
            ? ` (↩️ ×${session.quizSecondChanceLeft})`
            : ''}
        </span>
      ) : null}
      {flowSteps.map((step) => {
        const stepIdx = phaseOrder.indexOf(step.phase);
        const stateClass =
          stepIdx === currentPhaseIdx
            ? styles.stageFlowChipActive
            : stepIdx < currentPhaseIdx
              ? styles.stageFlowChipDone
              : '';
        return (
          <span
            key={step.key}
            className={[styles.stageFlowChip, stateClass].filter(Boolean).join(' ')}
          >
            {stepIdx < currentPhaseIdx ? '✓ ' : ''}
            {step.label}
          </span>
        );
      })}
    </div>
  );

  const stageHeader = (
    <>
      <Link className={styles.back} to={`/recipes/${recipe.id}`}>
        ← {t('cooking.recipeDetail')}
      </Link>
      <div className={styles.top}>
        <div>
          <h1 className={styles.title}>{recipe.name}</h1>
          <p className={styles.subtitle}>
            {'★'.repeat(recipe.difficulty)}
            {'☆'.repeat(5 - recipe.difficulty)}
          </p>
        </div>
        <div className={styles.scorePanel}>
          <span className={styles.scoreLabel}>{t('cooking.score')}</span>
          <span className={styles.scoreValue}>{displayScore}</span>
        </div>
      </div>
      {isPreview ? <span className={styles.previewBadge}>{stageDict.previewBadge}</span> : null}
      {flowChips}
    </>
  );

  if (session.phase === 'market' && stageConfig) {
    return (
      <PlayerShell>
        <div className={styles.runFrame}>
        {stageHeader}
        <MarketStage
          recipe={recipe}
          config={stageConfig}
          maxPoints={session.scorePlan.market}
          onProgress={setLiveStagePoints}
          onComplete={(bonus) => completeStage('market', bonus)}
        />
        </div>
      </PlayerShell>
    );
  }

  if (session.phase === 'catch' && stageConfig) {
    return (
      <PlayerShell>
        <div className={styles.runFrame}>
        {stageHeader}
        <CatchStage
          recipe={recipe}
          config={stageConfig}
          maxPoints={session.scorePlan.catch}
          onProgress={setLiveStagePoints}
          onComplete={(bonus) => completeStage('catch', bonus)}
        />
        </div>
      </PlayerShell>
    );
  }

  if (session.phase === 'finish' && stageConfig) {
    return (
      <PlayerShell>
        <div className={styles.runFrame}>
        {stageHeader}
        <FinishStage
          recipe={recipe}
          config={stageConfig}
          maxPoints={session.scorePlan.finish}
          onProgress={setLiveStagePoints}
          onComplete={(bonus) => completeStage('finish', bonus)}
        />
        </div>
      </PlayerShell>
    );
  }

  if (session.phase === 'minigames') {
    return (
      <PlayerShell>
        <div className={styles.runFrame}>
        <Link className={styles.back} to={`/recipes/${recipe.id}`}>
          ← {t('cooking.recipeDetail')}
        </Link>
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
        {flowChips}

        <MinigameRunner
          minigames={session.recipe.minigames ?? []}
          onAllComplete={handleMinigamesAllComplete}
          quizBonusSeconds={perkValueOf(session.perk, 'quiz-time-plus')}
          quizSecondChance={(session.quizSecondChanceLeft ?? 0) > 0}
          onQuizSecondChanceUsed={consumeQuizSecondChance}
        />
        </div>
      </PlayerShell>
    );
  }

  return (
    <PlayerShell>
      <div className={styles.runFrame}>
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
              {t('cooking.stepInstruction')}
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
                {t('cooking.sessionDelta')}{' '}
                {Math.round(session.runningScoreDelta) >= 0 ? '+' : ''}
                {Math.round(session.runningScoreDelta)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {isPreview ? <span className={styles.previewBadge}>{stageDict.previewBadge}</span> : null}
      {flowChips}
      {seasonToast ? <div className={styles.seasonToast}>{seasonToast}</div> : null}

      <div className={styles.gridWrap}>
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
        <StageHelp
          stageName={stageDict.cookName}
          rules={
            stageConfig?.seasonEnabled
              ? [
                  stageDict.cookRule1,
                  stageDict.seasonRule1,
                  stageDict.seasonRule2,
                  stageDict.seasonRule3,
                  stageDict.cookRule2,
                ]
              : [stageDict.cookRule1, stageDict.cookRule2]
          }
        />
      </div>

      {seasonOpen && session.actionButtonLabel ? (
        <SeasonBar
          stepLabel={session.actionButtonLabel}
          stepPoints={seasonVirtualStepPoints}
          difficulty={recipe.difficulty}
          ingredientCount={Math.max(1, currentRequiredIds.length)}
          zoneScale={1 + perkValueOf(session.perk, 'season-zone-plus') / 100}
          onResult={handleSeasonResult}
        />
      ) : null}

      {showResult ? (
        <CookingResultModal
          session={session}
          onClose={resetCooking}
          onRetry={() => startCooking(recipe)}
          onApplyProgress={handleApplyProgress}
          gainedXp={appliedResult?.gainedXp}
          gainedCoins={appliedResult?.gainedCoins}
          firstClear={appliedResult?.firstClear}
          newLevel={appliedResult?.newLevel}
          unlockedAchievements={appliedResult?.unlockedAchievements}
        />
      ) : null}
      </div>
    </PlayerShell>
  );
}

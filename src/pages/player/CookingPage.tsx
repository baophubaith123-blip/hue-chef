import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { Achievement, Recipe } from '@/data/types';
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
import { GestureStep } from '@/features/gestures/GestureStep';
import { gestureForStep } from '@/data/gesture-map';
import { NoiNoi } from '@/components/theme-d';
import { dishArtFor } from '@/components/theme-d/dish-art';
import { BOSS_JUDGE_IMAGE } from '@/components/theme-d/assets';
import { chapterById, dishesOfChapter } from '@/features/journey/lib/chapters';
import {
  BOSS_PASS_STARS,
  bestStarsByRecipe,
  bossStateFor,
  sellableRecipes,
} from '@/features/journey/lib/journey';
import { FeastResultPanel } from '@/features/events/components/FeastResultPanel';
import { IncidentPanel } from '@/features/events/components/IncidentPanel';
import { MysteryResultPanel } from '@/features/events/components/MysteryResultPanel';
import { SurvivalResultPanel } from '@/features/events/components/SurvivalResultPanel';
import {
  completeMysteryRun,
  loadEventsState,
  recordFeastServed,
  recordPlayEvent,
  recordSurvivalDish,
  useEvents,
} from '@/features/events/store';
import type { SurvivalRun } from '@/features/events/types';
import { isDishOfDay } from '@/features/events/lib/checkin';
import {
  INCIDENT_GRACE_MS,
  INCIDENT_PENALTY_INGREDIENT,
  incidentDefById,
  planIncidents,
  type IncidentId,
  type IncidentPlanEntry,
} from '@/features/events/lib/incidents';
import { applyMysterySwaps } from '@/features/events/lib/mystery';
import { SURVIVAL_MAX_STRIKES } from '@/features/events/lib/survival';
import { DuelResultPanel } from '@/features/online/components/DuelResultPanel';
import { GhostTicker } from '@/features/online/components/GhostTicker';
import { TournamentResultPanel } from '@/features/online/components/TournamentResultPanel';
import {
  createChallenge,
  submitChallengeAnswer,
  submitTournamentEntry,
} from '@/features/online/lib/api';
import { currentWeekKey, tournamentRecipeId } from '@/features/online/lib/tournament';
import { loadOnlineUserState, patchOnlineUserState } from '@/features/online/store';
import type { Challenge, GhostRun } from '@/features/online/types';
import { SellResultPanel } from '@/features/stall/components/SellResultPanel';
import { SubstitutionPanel } from '@/features/stall/components/SubstitutionPanel';
import {
  diagnoseBatch,
  type DiagnosisInput,
  type DiagnosisKey,
} from '@/features/stall/lib/diagnosis';
import { patienceLeftRatio } from '@/features/stall/lib/orders';
import { priceForBatch, qualityBandForScore } from '@/features/stall/lib/pricing-sell';
import {
  requestForKind,
  type SubstitutionOption,
} from '@/features/stall/lib/substitutions';
import { SUBSTITUTION_PENALTY } from '@/features/stall/lib/rush';
import {
  gestureTimeScale,
  gestureZoneScale,
  seasonZoneScale,
} from '@/features/skills/lib/skills';
import { useSkills } from '@/features/skills/store';
import { emptySkillTiers } from '@/features/skills/lib/skills';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { FEAST_PRICE_FACTOR, FEAST_QTY } from '@/features/stall/lib/festival';
import { incomeFactorForLevel } from '@/features/stall/lib/stall-levels';
import type { CardKind } from '@/features/stall/lib/support';
import { todayKey } from '@/features/stall/lib/day';
import {
  canCookBatch,
  discardBatch,
  finishCook,
  grantCard,
  serveFeast,
  tickStall,
  useStall,
} from '@/features/stall/store';
import type { CookedBatch } from '@/features/stall/types';
import { useCookingState } from '@/features/cooking/hooks/useCookingState';
import { useDragDrop } from '@/features/cooking/hooks/useDragDrop';
import { COMBO_WINDOW_MS, comboBonusForStreak } from '@/features/cooking/lib/combo';
import { SEASON_MAX_BONUS_RATIO, seasonBonusFor } from '@/features/cooking/lib/stage-bonus';
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
import { buzz, celebrate } from '@/lib/juice';
import { playSound } from '@/lib/sound';
import { calculateXpFromStars } from '@/lib/score';
import { SceneShell } from '@/pages/player/SceneShell';

import styles from '@/pages/player/CookingPage.module.css';

export default function CookingPage() {
  const { id } = useParams<{ id: string }>();
  const { t, dict } = useTranslation();
  const { isLoading, getRecipeById, getApprovedRecipes } = useRecipes();
  const { user, addXp, addCoins, addCookedRecipe, grantSellLicense } = useAuth();
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
  // Sell mode (Gói H4): ?sell=<customerId> turns the run into a cook for
  // a stall order. The run plays the same 5-stage engine; at the end the
  // score converts into a sell batch (quality + diagnosis + real cost)
  // instead of learning progress. Boss and sell never combine.
  const sellOrderId = searchParams.get('sell');
  const isSellMode = Boolean(sellOrderId) && !isPreview;
  // The stall record is loaded in every mode (Gói H5): the kitchen
  // upgrades it holds boost the gesture engine in BOTH loops, exactly
  // like the skill tree — the chef cooks with their own tools wherever
  // they cook. Preview runs stay unboosted, like perks.
  const stall = useStall(user ? user.id : null);
  // Events record (Gói H7): survival runs, the mystery box, the feast
  // day and the quest/streak funnel all read from this one store.
  const events = useEvents(user?.id ?? null);
  const sellCustomer = useMemo(
    () => (isSellMode ? stall?.customers.find((c) => c.id === sellOrderId) ?? null : null),
    [isSellMode, stall, sellOrderId],
  );
  // Skill tree + kitchen boosts (Gói H5): pure engine parameters —
  // wider target zones, longer time budgets — fed into GestureStep and
  // the SeasonBar. They never touch the scoring frame itself.
  const skillTiers = useSkills(user ? user.id : null) ?? emptySkillTiers();
  const kitchen = stall?.upgrades ?? { knife: 0, stove: 0, pot: 0 };
  const boostActive = !isPreview && Boolean(user);
  const zoneScaleForGesture = (gesture: ReturnType<typeof gestureForStep>): number =>
    boostActive
      ? gestureZoneScale(gesture, skillTiers, kitchen, {
          slicer: stall?.gear?.slicer ?? false,
          mixer: stall?.gear?.mixer ?? false,
        })
      : 1;
  const runTimeScale = boostActive ? gestureTimeScale(skillTiers) : 1;
  const runSeasonZoneScale = boostActive ? seasonZoneScale(skillTiers) : 1;
  // Picky-customer substitution (Gói H5, mục 6.3): the applicable
  // request of this sell order, derived from the dish itself. The
  // cook's confirmed choice lives in state (for the panel) and in a
  // ref (for the end-of-run conversion effect).
  const sellRequest = useMemo(() => {
    if (!isSellMode || !sellCustomer?.requestKind || !id) return null;
    const current = getRecipeById(id);
    return current ? requestForKind(current, sellCustomer.requestKind) : null;
  }, [isSellMode, sellCustomer, id, getRecipeById]);
  const [subChoice, setSubChoice] = useState<SubstitutionOption | null>(null);
  const subChoiceRef = useRef<SubstitutionOption | null>(null);
  const handleSubConfirm = useCallback((option: SubstitutionOption) => {
    subChoiceRef.current = option;
    setSubChoice(option);
  }, []);
  // Ngự thiện boss mode (Gói H3): ?boss=<chapterId> turns the chapter's
  // signature dish run into its boss stage. A mismatched chapter/dish
  // pair is ignored — the run simply plays as a normal learning run.
  const bossParam = searchParams.get('boss');
  const bossChapter = useMemo(() => {
    if (isPreview || isSellMode || !bossParam || !id) return undefined;
    const chapter = chapterById(bossParam);
    return chapter && chapter.bossRecipeId === id ? chapter : undefined;
  }, [isPreview, isSellMode, bossParam, id]);
  const bossGuardRef = useRef<string | null>(null);
  // Event modes (Gói H7): ?survival=<runId>, ?mystery=<boxId> and
  // ?feast=1 turn the run into an event cook on the same engine. They
  // never combine with preview, sell or boss; when several params are
  // present the priority is survival > mystery > feast.
  const survivalId = searchParams.get('survival');
  const mysteryId = searchParams.get('mystery');
  const feastParam = searchParams.get('feast') === '1';
  const isSurvivalMode = Boolean(survivalId) && !isPreview && !isSellMode && !bossChapter;
  const isMysteryMode =
    !isSurvivalMode && Boolean(mysteryId) && !isPreview && !isSellMode && !bossChapter;
  const isFeastMode =
    !isSurvivalMode && !isMysteryMode && feastParam && !isPreview && !isSellMode && !bossChapter;
  const survivalGuardRef = useRef<string | null>(null);
  const mysteryGuardRef = useRef(false);
  const feastGuardRef = useRef<string | null>(null);
  // Mystery box: the run is played on the box's swapped copy of the
  // dish, and the box itself is the ticket in (no ownership guard).
  const box = isMysteryMode ? events?.mystery.activeBox ?? null : null;
  const boxValid = Boolean(box && box.id === mysteryId && box.recipeId === id);
  // Survival / mystery / feast end-of-run bookings, applied exactly
  // once per finished run (same guard pattern as the sell conversion).
  const survivalAppliedRef = useRef(false);
  const [survivalOutcome, setSurvivalOutcome] = useState<
    ({ run: SurvivalRun; ended: boolean; cleared: number } & { isBest: boolean }) | null
  >(null);
  const mysteryAppliedRef = useRef(false);
  const [mysteryApplied, setMysteryApplied] = useState(false);
  const [mysteryReward, setMysteryReward] = useState<{ xu: number; card: CardKind | null } | null>(
    null,
  );
  const feastAppliedRef = useRef(false);
  // Online modes (Gói H9): ?duel=create sends this run's ghost to the
  // chosen opponent; ?duel=<challengeId> answers a challenge against
  // the challenger's ghost; ?tournament=<weekKey> submits the run to
  // the weekly board. They never combine with preview, sell, boss or
  // the H7 event modes, and they book their own outcomes online —
  // learning progress is never touched, exactly like survival/mystery.
  const duelParam = searchParams.get('duel');
  const tournamentParam = searchParams.get('tournament');
  const isDuelMode =
    Boolean(duelParam) &&
    !isPreview &&
    !isSellMode &&
    !bossChapter &&
    !isSurvivalMode &&
    !isMysteryMode &&
    !isFeastMode;
  const isTournamentMode =
    !isDuelMode &&
    Boolean(tournamentParam) &&
    !isPreview &&
    !isSellMode &&
    !bossChapter &&
    !isSurvivalMode &&
    !isMysteryMode &&
    !isFeastMode;
  // The duel session the duels page prepared for this run (who to
  // challenge, or which challenge + ghost to answer). Read once per
  // mount from the online store; an absent or mismatched session sends
  // the run back to the duels page (gate effect below).
  const duelSession = useMemo(
    () => (isDuelMode && user ? loadOnlineUserState(user.id).duelSession : null),
    [isDuelMode, user],
  );
  const duelSessionValid = Boolean(
    duelSession &&
      id &&
      duelSession.recipeId === id &&
      ((duelParam === 'create' && duelSession.mode === 'create' && duelSession.opponentId) ||
        (duelParam !== 'create' &&
          duelSession.mode === 'answer' &&
          duelSession.challengeId === duelParam &&
          duelSession.ghost)),
  );
  const duelGuardRef = useRef<string | null>(null);
  const tournamentGuardRef = useRef<string | null>(null);
  const duelAppliedRef = useRef(false);
  const tournamentAppliedRef = useRef(false);
  const [duelOutcome, setDuelOutcome] = useState<
    | { variant: 'sent' }
    | { variant: 'answered'; challenge: Challenge }
    | { variant: 'error' }
    | null
  >(null);
  const [tournamentOutcome, setTournamentOutcome] = useState<
    { variant: 'booked' | 'error' } | null
  >(null);
  // Ghost recording (Gói H9): wall-clock stamps of each stage's
  // completion, watched off the session's phase transitions. The
  // challenger run's ghost is assembled from these at booking time;
  // the answer run ignores them (its own ghost is booked the same way
  // for the record, but only its score is compared).
  // The run's start instant is STATE, not a ref: the ghost ticker
  // mounts off it, and a ref flip alone would never re-render the
  // stage header while the player idles on a stage's intro card.
  const [ghostStartedAt, setGhostStartedAt] = useState<number | null>(null);
  const ghostStampsRef = useRef<Record<string, number>>({});
  const ghostPrevPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isDuelMode && !isTournamentMode) return;
    if (!session) return;
    if (ghostStartedAt === null) {
      setGhostStartedAt(Date.now());
      ghostPrevPhaseRef.current = session.phase;
      return;
    }
    const prev = ghostPrevPhaseRef.current;
    if (prev === session.phase) return;
    ghostPrevPhaseRef.current = session.phase;
    const elapsed = Date.now() - ghostStartedAt;
    const endedKeys =
      prev === 'market'
        ? ['market']
        : prev === 'catch'
          ? ['catch']
          : prev === 'running'
            ? ['cook', 'season']
            : prev === 'finish'
              ? ['finish']
              : prev === 'minigames'
                ? ['quiz']
                : [];
    for (const key of endedKeys) {
      if (ghostStampsRef.current[key] === undefined) {
        ghostStampsRef.current[key] = elapsed;
      }
    }
  }, [isDuelMode, isTournamentMode, session, ghostStartedAt]);

  // Result fanfare (Gói H8): once per finished run — a win jingle and
  // a Theme D burst for a boss pass or a 3+ star clear, a soft descent
  // for a failed run. Preview runs stay silent. This hook pair MUST
  // stay with the early hooks: the session guard further down returns
  // a loading screen while the session is null and flips on every
  // mount, so any hook declared below it changes the hook count
  // mid-mount and crashes the page (React error #310 — caught by the
  // H6 regression bot at the assistant check).
  const resultFxKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (isPreview || !session) return;
    if (session.phase !== 'success' && session.phase !== 'failed') return;
    const key = `${session.recipe.id}:${session.phase}:${session.stars}:${session.finalScore}`;
    if (resultFxKeyRef.current === key) return;
    resultFxKeyRef.current = key;
    if (session.phase === 'success') {
      if (bossChapter && session.stars >= BOSS_PASS_STARS) {
        playSound('starup');
        celebrate('big');
        buzz([40, 40, 80]);
      } else if (isFeastMode) {
        // Gói H8: a village feast lands with bells and gold coins.
        playSound('feast');
        celebrate('coins');
        buzz([40, 40, 80]);
      } else {
        playSound('win');
        if (!isSellMode && session.stars >= 3) celebrate('small');
        buzz(35);
      }
    } else {
      playSound('lose');
    }
  }, [isPreview, session, bossChapter, isSellMode, isFeastMode]);
  const [feastBatch, setFeastBatch] = useState<CookedBatch | null>(null);
  const [feastServed, setFeastServed] = useState<{ xu: number; exp: number } | null>(null);
  // Kitchen incidents (Gói H7): a per-run plan rolled when the run
  // starts; an entry fires when its step becomes active and blocks the
  // gesture until the cook fixes it (see IncidentPanel).
  const [incidentPlan, setIncidentPlan] = useState<IncidentPlanEntry[]>([]);
  const [activeIncident, setActiveIncident] = useState<{
    defId: IncidentId;
    startedAt: number;
    penalized: boolean;
  } | null>(null);
  const firedStepsRef = useRef<Set<number>>(new Set());
  const [incidentNow, setIncidentNow] = useState(() => Date.now());
  const rollIncidentPlan = useCallback(
    (forRecipe: Recipe): IncidentPlanEntry[] => {
      const steps = forRecipe.steps ?? [];
      if (searchParams.get('fx') === '1') {
        return steps.length >= 2 ? [{ stepIndex: 1, defId: 'lua-tat' }] : [];
      }
      return planIncidents(steps.length, Math.random);
    },
    [searchParams],
  );
  // Sell mode (Gói H4): the batch is created exactly once per finished
  // run; the seasoning deviation of the run feeds the flavour diagnosis.
  const sellGuardRef = useRef<string | null>(null);
  const sellAppliedRef = useRef(false);
  const seasonDeviationRef = useRef<number | null>(null);
  const [sellBatch, setSellBatch] = useState<CookedBatch | null>(null);
  const [sellNow, setSellNow] = useState(() => Date.now());

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
    newLevel?: number;
    unlockedAchievements: Achievement[];
  } | null>(null);
  // Gesture engine (Gói H2): the step action is played as a gesture; its
  // 0–100 score scales the step's cook points. `pendingQuality` carries
  // the factor across the seasoning bar when both apply to one step.
  const [gestureAttempt, setGestureAttempt] = useState(0);
  const [pendingQuality, setPendingQuality] = useState<number | null>(null);
  const animationTimerRef = useRef<number | null>(null);
  const guardCheckedIdRef = useRef<string | null>(null);
  // The session this page mount has started, keyed by recipe + mode. The
  // start effect below must start exactly once per key: applying progress
  // at the end of a run replaces the user object and can flip the resolved
  // equipped perk (its achievement unlocking in the store during that same
  // apply), which re-runs the effect — such a re-run must never reset or
  // restart the run it belongs to, least of all a finished one whose
  // result modal is on screen.
  const startedKeyRef = useRef<string | null>(null);

  const recipe = id ? getRecipeById(id) : undefined;

  // The dish actually cooked: in mystery mode the box's stand-ins are
  // written into a synthetic copy; every other mode cooks the dish
  // itself. The tray and the amounts follow the effective copy.
  const effectiveRecipe = useMemo(
    () => (recipe && boxValid && box ? applyMysterySwaps(recipe, box.swaps) : recipe),
    [recipe, boxValid, box],
  );

  // Boss gate: the boss stage only opens when the chapter is learned and
  // the journey order allows it (see bossStateFor). A locked boss URL is
  // sent back to the map, where the missing condition is spelled out.
  useEffect(() => {
    if (!bossChapter || !user || !recipe || isLoading) return;
    const key = `${recipe.id}:boss:${bossChapter.id}`;
    if (bossGuardRef.current === key) return;
    bossGuardRef.current = key;
    if (bossStateFor(user, bossChapter, getApprovedRecipes()).kind === 'locked') {
      navigate('/map', { replace: true });
    }
  }, [bossChapter, user, recipe, isLoading, getApprovedRecipes, navigate]);

  // Sell gate: the order must exist, belong to this dish, and still be
  // open when the page first resolves it. Checked once per order — a
  // customer who gives up mid-run must not bounce the cook out of the
  // kitchen; the finished batch simply waits on the counter.
  useEffect(() => {
    if (!isSellMode || !sellOrderId || !user || !recipe || isLoading || !stall) return;
    if (sellGuardRef.current === sellOrderId) return;
    sellGuardRef.current = sellOrderId;
    const customer = stall.customers.find((c) => c.id === sellOrderId);
    if (
      !customer ||
      customer.recipeId !== recipe.id ||
      (customer.state !== 'waiting' && customer.state !== 'accepted')
    ) {
      navigate('/stall', { replace: true });
    }
  }, [isSellMode, sellOrderId, user, recipe, isLoading, stall, navigate]);

  // Survival gate: the run must exist, be the one named in the URL,
  // and be waiting for exactly this dish.
  useEffect(() => {
    if (!isSurvivalMode || !survivalId || !user || !events) return;
    if (survivalGuardRef.current === survivalId) return;
    survivalGuardRef.current = survivalId;
    const run = events.survival.current;
    if (!run || run.id !== survivalId || run.queue[run.index] !== id) {
      navigate('/survival', { replace: true });
    }
  }, [isSurvivalMode, survivalId, user, events, id, navigate]);

  // Mystery gate: once the events record is loaded, a URL whose box is
  // not the active one (or not for this dish) goes back to the box page.
  useEffect(() => {
    if (!isMysteryMode || !user || !events) return;
    if (mysteryGuardRef.current) return;
    mysteryGuardRef.current = true;
    if (!boxValid) {
      navigate('/mystery', { replace: true });
    }
  }, [isMysteryMode, user, events, boxValid, navigate]);

  // Duel gate: the prepared duel session must match this URL and this
  // dish — the challenge itself is the ticket in (like the mystery
  // box), so the ownership guard below is skipped for valid duels.
  useEffect(() => {
    if (!isDuelMode || !duelParam || !user) return;
    if (duelGuardRef.current === duelParam) return;
    duelGuardRef.current = duelParam;
    if (!duelSessionValid) {
      navigate('/online/duels', { replace: true });
    }
  }, [isDuelMode, duelParam, user, duelSessionValid, navigate]);

  // Tournament gate: the URL's week must be the current week and the
  // dish the week's community dish. The tournament is open to every
  // player, owned or not — the week itself is the ticket in.
  useEffect(() => {
    if (!isTournamentMode || !tournamentParam || !user || !id) return;
    if (tournamentGuardRef.current === tournamentParam) return;
    tournamentGuardRef.current = tournamentParam;
    if (
      tournamentParam !== currentWeekKey() ||
      tournamentRecipeId(tournamentParam) !== id
    ) {
      navigate('/online/tournament', { replace: true });
    }
  }, [isTournamentMode, tournamentParam, user, id, navigate]);

  // Feast gate: the dish must be licensed for sale, the big pot owned,
  // today's feast not yet served, and the pantry able to cover the
  // village batch.
  useEffect(() => {
    if (!isFeastMode || !user || !recipe || isLoading || !stall || !events) return;
    if (feastGuardRef.current === recipe.id) return;
    feastGuardRef.current = recipe.id;
    const ok =
      sellableRecipes(user, getApprovedRecipes()).some((r) => r.id === recipe.id) &&
      (stall.upgrades.pot ?? 0) >= 1 &&
      events.feast.lastDay !== todayKey() &&
      canCookBatch(stall, recipe, FEAST_QTY);
    if (!ok) {
      navigate('/stall', { replace: true });
    }
  }, [isFeastMode, user, recipe, isLoading, stall, events, getApprovedRecipes, navigate]);

  // While a sell cook runs, the stall clock keeps ticking (patience and
  // the shift itself), exactly as if the cook had stayed at the stall.
  // A feast cook leaves the stall the same way, so it ticks too.
  useEffect(() => {
    if ((!isSellMode && !isFeastMode) || !user) return;
    const timer = window.setInterval(() => {
      tickStall(user.id, user, getApprovedRecipes(), Date.now());
      setSellNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isSellMode, isFeastMode, user, getApprovedRecipes]);

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
    if (!effectiveRecipe) {
      return [];
    }
    return shuffleArray(buildTrayIngredientIds(effectiveRecipe));
  }, [effectiveRecipe]);

  const amountByIngredientId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ref of effectiveRecipe?.ingredients ?? []) {
      map[ref.ingredientId] = ref.amount;
    }
    return map;
  }, [effectiveRecipe]);

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
    if (isSellMode) return;
    // Event modes book their own outcomes in their own effects/panels.
    if (isSurvivalMode || isMysteryMode || isFeastMode) return;
    // Online modes (Gói H9) book their own outcomes online.
    if (isDuelMode || isTournamentMode) return;
    if (appliedResult) return;

    const xpPerkPct = perkValueOf(session.perk, 'xp-bonus-pct');
    const xpEarned = Math.round(calculateXpFromStars(session.stars) * (1 + xpPerkPct / 100));
    // Dish of the day (Gói H7): a learning run of today's dish pays
    // double XP — the ×2 lives here and only here in the learn loop.
    const xp = isDishOfDay(session.recipe.id, todayKey()) ? xpEarned * 2 : xpEarned;
    const xpResult = addXp(xp);
    // Gói H2 — the learning loop no longer pays out xu (Kế hoạch hợp nhất,
    // chốt 6): rewards here are progress, unlocks and collectibles only.
    // Xu is earned solely by selling at the stall (Gói H4); the player's
    // existing balance is untouched and still spends on recipes.
    const entry = buildCookedEntry(session);
    addCookedRecipe(entry);
    // Events funnel (Gói H7): quests, the chain and the streak hear
    // about every real learning cook through this one call.
    recordPlayEvent(user.id, 'cook', {
      recipeId: session.recipe.id,
      stars: session.stars,
      bossWin: Boolean(bossChapter && session.stars >= BOSS_PASS_STARS),
    });

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

    // Ngự thiện boss (Gói H3): the run is judged more strictly — at
    // BOSS_PASS_STARS or more the chapter's sell license is granted
    // (chốt 1). A merely-passing run still banks its normal XP and
    // cooked entry above; only the license waits for a stronger run.
    if (bossChapter && session.stars >= BOSS_PASS_STARS) {
      const newlyGranted = grantSellLicense(bossChapter.id);
      if (newlyGranted) {
        pushNotification({
          userId: user.id,
          type: 'license.granted',
          title: dict.journey.licenseNoticeTitle,
          body: dict.journey.licenseNoticeBody(
            dict.journey.chapters[bossChapter.id]?.name ?? bossChapter.id,
          ),
          link: '/map',
          relatedId: bossChapter.id,
        });
      }
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
    bossChapter,
    grantSellLicense,
    dict,
    isSurvivalMode,
    isMysteryMode,
    isFeastMode,
  ]);

  // Sell conversion (Gói H4): when a sell run ends — success OR failure —
  // its score ratio becomes the batch's 0–100 quality, the stage ratios
  // become its flavour diagnosis, and the pantry lots it eats become its
  // real cost. Learning progress is never touched (no XP, no cooked
  // entry, no xu): the sell loop books everything in the stall store.
  useEffect(() => {
    if (!isSellMode || !sellOrderId || !user || !session) return;
    if (session.phase !== 'success' && session.phase !== 'failed') return;
    if (sellAppliedRef.current) return;
    sellAppliedRef.current = true;
    const ratio =
      session.recipe.baseScore > 0
        ? Math.min(1, Math.max(0, session.finalScore / session.recipe.baseScore))
        : 0;
    let qualityScore = Math.round(ratio * 100);
    let band = qualityBandForScore(qualityScore);
    const ratios: DiagnosisInput['ratios'] = {};
    const partKeys = ['market', 'catch', 'cook', 'season', 'finish', 'quiz'] as const;
    for (const key of partKeys) {
      const plan = session.scorePlan[key];
      if (plan > 0) ratios[key] = (session.scoreParts[key] ?? 0) / plan;
    }
    if (session.totalDurationSeconds > 0) {
      ratios.time = session.timeRemainingSeconds / session.totalDurationSeconds;
    }
    let diagnosis = diagnoseBatch({
      ratios,
      wrongCount: session.wrongCount,
      seasonDeviation: seasonDeviationRef.current,
    });
    // Substitution verdict (Gói H5, mục 6.3): honouring the picky
    // customer's request by the book keeps the quality whole (and tips
    // better at serve time); a wrong swap — or never choosing at all —
    // costs a heavy, fixed slice of the batch's quality, and the
    // diagnosis says so in plain words.
    let requestOutcome: CookedBatch['requestOutcome'];
    if (sellRequest) {
      const choice = subChoiceRef.current;
      requestOutcome = choice ? (choice.correct ? 'ok' : 'wrong') : 'ignored';
      if (requestOutcome !== 'ok') {
        qualityScore = Math.max(0, qualityScore - SUBSTITUTION_PENALTY);
        band = qualityBandForScore(qualityScore);
        const violated: DiagnosisKey[] = [
          'request-violated',
          ...diagnosis.filter((key) => key !== 'balanced'),
        ];
        diagnosis = violated.slice(0, 2);
      }
    }
    const batch = finishCook(user.id, {
      recipe: session.recipe,
      qty: sellCustomer?.qty ?? 1,
      qualityScore,
      level: band.level,
      diagnosis,
      requestOutcome,
    });
    setSellBatch(batch);
  }, [isSellMode, sellOrderId, user, session, sellCustomer, sellRequest]);

  // Survival booking (Gói H7): a finished dish — success OR failure —
  // is booked into the run exactly once. A success also reports to the
  // events funnel; learning progress is never touched by this mode.
  useEffect(() => {
    if (!isSurvivalMode || !survivalId || !user || !session) return;
    if (session.phase !== 'success' && session.phase !== 'failed') return;
    if (survivalAppliedRef.current) return;
    survivalAppliedRef.current = true;
    const success = session.phase === 'success';
    const before = loadEventsState(user.id).survival;
    const outcome = recordSurvivalDish(user.id, survivalId, {
      recipeId: session.recipe.id,
      score: session.finalScore,
      stars: session.stars,
      success,
    });
    if (!outcome) return;
    if (success) {
      recordPlayEvent(user.id, 'cook', {
        recipeId: session.recipe.id,
        stars: session.stars,
      });
    }
    setSurvivalOutcome({
      ...outcome,
      isBest:
        outcome.ended &&
        outcome.run.totalScore > 0 &&
        (outcome.cleared > before.bestDishes || outcome.run.totalScore > before.bestScore),
    });
  }, [isSurvivalMode, survivalId, user, session]);

  // Mystery booking (Gói H7): a run played to the end consumes the box
  // exactly once; the returned reward is applied here — xu through
  // AuthContext, the premium card through the stall store.
  useEffect(() => {
    if (!isMysteryMode || !boxValid || !box || !user || !session) return;
    if (session.phase !== 'success' && session.phase !== 'failed') return;
    if (mysteryAppliedRef.current) return;
    mysteryAppliedRef.current = true;
    const success = session.phase === 'success';
    const reward = completeMysteryRun(user.id, box.id, session.finalScore, success, session.recipe);
    if (reward) {
      if (reward.xu > 0) addCoins(reward.xu);
      if (reward.card) grantCard(user.id, reward.card);
    }
    if (success) {
      recordPlayEvent(user.id, 'cook', {
        recipeId: session.recipe.id,
        stars: session.stars,
      });
    }
    setMysteryReward(reward ? { xu: reward.xu, card: reward.card } : null);
    setMysteryApplied(true);
  }, [isMysteryMode, boxValid, box, user, session, addCoins]);

  // Feast conversion (Gói H7): the sell conversion's twin without the
  // substitution verdict — the run's score ratio becomes the village
  // batch's quality, its stage ratios the flavour diagnosis, and the
  // pantry lots it eats its real cost, at FEAST_QTY portions.
  useEffect(() => {
    if (!isFeastMode || !user || !session) return;
    if (session.phase !== 'success' && session.phase !== 'failed') return;
    if (feastAppliedRef.current) return;
    feastAppliedRef.current = true;
    const ratio =
      session.recipe.baseScore > 0
        ? Math.min(1, Math.max(0, session.finalScore / session.recipe.baseScore))
        : 0;
    const qualityScore = Math.round(ratio * 100);
    const band = qualityBandForScore(qualityScore);
    const ratios: DiagnosisInput['ratios'] = {};
    const partKeys = ['market', 'catch', 'cook', 'season', 'finish', 'quiz'] as const;
    for (const key of partKeys) {
      const plan = session.scorePlan[key];
      if (plan > 0) ratios[key] = (session.scoreParts[key] ?? 0) / plan;
    }
    if (session.totalDurationSeconds > 0) {
      ratios.time = session.timeRemainingSeconds / session.totalDurationSeconds;
    }
    const diagnosis = diagnoseBatch({
      ratios,
      wrongCount: session.wrongCount,
      seasonDeviation: seasonDeviationRef.current,
    });
    const batch = finishCook(user.id, {
      recipe: session.recipe,
      qty: FEAST_QTY,
      qualityScore,
      level: band.level,
      diagnosis,
    });
    setFeastBatch(batch);
  }, [isFeastMode, user, session]);

  // Duel booking (Gói H9): the finished run becomes a ghost — sent as
  // a new challenge (create mode) or submitted as the answer against
  // the challenger's ghost (answer mode). Booked exactly once; the
  // prepared duel session is consumed either way so it can never book
  // twice. An online failure surfaces as an error panel, never a
  // crash — and never touches learning progress.
  useEffect(() => {
    if (!isDuelMode || !user || !session || !duelSessionValid || !duelSession) return;
    if (session.phase !== 'success' && session.phase !== 'failed') return;
    if (duelAppliedRef.current) return;
    duelAppliedRef.current = true;
    if (session.phase === 'success') {
      recordPlayEvent(user.id, 'cook', {
        recipeId: session.recipe.id,
        stars: session.stars,
      });
    }
    const partKeys = ['market', 'catch', 'cook', 'season', 'finish', 'quiz'] as const;
    const stampMax = Math.max(0, ...partKeys.map((k) => ghostStampsRef.current[k] ?? 0));
    const durationMs = Math.max(
      1,
      stampMax,
      ghostStartedAt ? Date.now() - ghostStartedAt : 0,
    );
    const ghost: GhostRun = {
      totalScore: session.finalScore,
      stars: session.stars,
      durationMs,
      stages: partKeys
        .filter((key) => (session.scorePlan[key] ?? 0) > 0)
        .map((key) => ({
          key,
          score: session.scoreParts[key] ?? 0,
          atMs: ghostStampsRef.current[key] ?? durationMs,
        })),
      recordedAt: new Date().toISOString(),
    };
    const book = async () => {
      try {
        if (duelSession.mode === 'create' && duelSession.opponentId) {
          await createChallenge(duelSession.opponentId, session.recipe.id, ghost);
          setDuelOutcome({ variant: 'sent' });
        } else if (duelSession.mode === 'answer' && duelSession.challengeId) {
          const challenge = await submitChallengeAnswer(duelSession.challengeId, ghost);
          setDuelOutcome({ variant: 'answered', challenge });
        } else {
          setDuelOutcome({ variant: 'error' });
        }
      } catch {
        setDuelOutcome({ variant: 'error' });
      } finally {
        patchOnlineUserState(user.id, { duelSession: null });
      }
    };
    void book();
  }, [isDuelMode, user, session, duelSession, duelSessionValid, ghostStartedAt]);

  // Tournament booking (Gói H9): the finished run is submitted as the
  // player's score for the current week; the API keeps only the best.
  useEffect(() => {
    if (!isTournamentMode || !user || !session || !tournamentParam) return;
    if (session.phase !== 'success' && session.phase !== 'failed') return;
    if (tournamentAppliedRef.current) return;
    tournamentAppliedRef.current = true;
    if (session.phase === 'success') {
      recordPlayEvent(user.id, 'cook', {
        recipeId: session.recipe.id,
        stars: session.stars,
      });
    }
    const link = loadOnlineUserState(user.id).link;
    const submit = async () => {
      try {
        await submitTournamentEntry(
          tournamentParam,
          session.recipe.id,
          link?.displayName ?? user.name,
          session.finalScore,
          session.stars,
        );
        setTournamentOutcome({ variant: 'booked' });
      } catch {
        setTournamentOutcome({ variant: 'error' });
      }
    };
    void submit();
  }, [isTournamentMode, user, session, tournamentParam]);

  // Incident activation: when the running step matches a planned entry
  // that has not fired yet, the accident strikes and blocks the step.
  useEffect(() => {
    if (!session || session.phase !== 'running' || activeIncident || isPreview) return;
    const entry = incidentPlan.find(
      (e) => e.stepIndex === session.currentStepIndex && !firedStepsRef.current.has(e.stepIndex),
    );
    if (!entry) return;
    firedStepsRef.current.add(entry.stepIndex);
    setIncidentNow(Date.now());
    setActiveIncident({ defId: entry.defId, startedAt: Date.now(), penalized: false });
    // Gói H8: an incident announces itself — alarm + a short buzz.
    playSound('alarm');
    buzz([50, 30, 50]);
  }, [session, activeIncident, incidentPlan, isPreview]);

  // Grace countdown clock for the active incident.
  useEffect(() => {
    if (!activeIncident) return undefined;
    const timer = window.setInterval(() => setIncidentNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [activeIncident]);

  const incidentGraceLeft = activeIncident
    ? INCIDENT_GRACE_MS - (incidentNow - activeIncident.startedAt)
    : INCIDENT_GRACE_MS;

  const showIncidentToast = useCallback(
    (text: string) => {
      setSeasonToast(text);
      if (seasonToastTimerRef.current !== null) {
        window.clearTimeout(seasonToastTimerRef.current);
      }
      seasonToastTimerRef.current = window.setTimeout(() => setSeasonToast(null), 3200);
    },
    [],
  );

  // Grace expired: the accident burns in as exactly ONE cooking
  // mistake through the engine's ordinary wrong-drop channel.
  useEffect(() => {
    if (!activeIncident || activeIncident.penalized) return;
    if (incidentGraceLeft > 0) return;
    dropIngredient(INCIDENT_PENALTY_INGREDIENT);
    showIncidentToast(dict.events.incidents.penaltyToast);
    setActiveIncident((prev) => (prev ? { ...prev, penalized: true } : prev));
  }, [activeIncident, incidentGraceLeft, dropIngredient, dict, showIncidentToast]);

  const handleIncidentFixed = useCallback(() => {
    showIncidentToast(
      activeIncident?.penalized
        ? dict.events.incidents.fixedLateToast
        : dict.events.incidents.fixedToast,
    );
    // Gói H8: the repair gets its own rising arp.
    playSound('fixed');
    setActiveIncident(null);
  }, [activeIncident, dict, showIncidentToast]);

  useEffect(() => {
    // The cleanup only ever clears visual-effect timers. The session
    // itself is torn down by the dedicated effect further below, keyed
    // solely on the recipe id, so a re-run of this effect can no longer
    // reset a live or finished session by accident.
    const cleanupFx = () => {
      clearAnimationTimer();
      if (fxTimerRef.current !== null) {
        window.clearTimeout(fxTimerRef.current);
        fxTimerRef.current = null;
      }
      setDropFx(null);
    };
    if (isLoading || !id) {
      return cleanupFx;
    }
    const current = getRecipeById(id);
    const currentApproved = current && (current.status ?? 'approved') === 'approved';
    const currentPreview =
      isPreview &&
      current &&
      (current.editorId === user?.id || user?.role === 'admin');
    if (!current || (!currentApproved && !currentPreview)) {
      return cleanupFx;
    }
    // Shop guard: a locked dish cannot be cooked by direct URL — send the
    // player to its detail page where the buy panel lives. Checked once per
    // recipe mount: the user object changes when progress is applied at the
    // end of a run, and re-running this effect would restart the session.
    if (!currentPreview && user && guardCheckedIdRef.current !== current.id) {
      guardCheckedIdRef.current = current.id;
      // Mystery mode skips the ownership guard: the box is the ticket.
      // Duel and tournament runs (Gói H9) skip it too: the received
      // challenge and the weekly community dish are the tickets in.
      if (
        !(isMysteryMode && boxValid) &&
        !(isDuelMode && duelSessionValid) &&
        !isTournamentMode &&
        !isRecipeOwned(user, current)
      ) {
        navigate(`/recipes/${current.id}`, { replace: true });
        return cleanupFx;
      }
    }
    // Start exactly once per recipe mount. A re-run while this recipe's
    // session is live — the identity churn when progress is applied at
    // the end of a run (user object swapped; the equipped perk resolving
    // from null to its object once its achievement lands in the unlock
    // store during that apply) — must not reset or restart the session:
    // a finished run's result modal stays up until the player closes it.
    const sellParam = searchParams.get('sell');
    const startKey = `${current.id}:${
      currentPreview ? 'preview' : sellParam ? `sell:${sellParam}` : 'play'
    }${
      isSurvivalMode
        ? `:survival:${survivalId}`
        : isMysteryMode
          ? `:mystery:${mysteryId}`
          : isFeastMode
            ? ':feast'
            : isDuelMode
              ? `:duel:${duelParam}`
              : isTournamentMode
                ? `:tournament:${tournamentParam}`
                : ''
    }`;
    if (startedKeyRef.current === startKey) {
      return cleanupFx;
    }
    startedKeyRef.current = startKey;
    setAppliedResult(null);
    setSellBatch(null);
    sellAppliedRef.current = false;
    seasonDeviationRef.current = null;
    subChoiceRef.current = null;
    setSubChoice(null);
    setSurvivalOutcome(null);
    survivalAppliedRef.current = false;
    setMysteryReward(null);
    setMysteryApplied(false);
    mysteryAppliedRef.current = false;
    setFeastBatch(null);
    setFeastServed(null);
    feastAppliedRef.current = false;
    setDuelOutcome(null);
    duelAppliedRef.current = false;
    setTournamentOutcome(null);
    tournamentAppliedRef.current = false;
    setGhostStartedAt(null);
    ghostStampsRef.current = {};
    ghostPrevPhaseRef.current = null;
    // Mystery runs play the box's swapped copy of the dish.
    const startRecipe =
      isMysteryMode && boxValid && box ? applyMysterySwaps(current, box.swaps) : current;
    setIncidentPlan(rollIncidentPlan(startRecipe));
    firedStepsRef.current = new Set();
    setActiveIncident(null);
    startCooking(startRecipe, equippedPerk);
    return cleanupFx;
  }, [
    id,
    isLoading,
    getRecipeById,
    startCooking,
    clearAnimationTimer,
    isPreview,
    user?.id,
    user?.role,
    navigate,
    equippedPerk,
  ]);

  // Session teardown: reset only when the page truly leaves this recipe
  // (route change or unmount) — never as a side effect of the start
  // effect re-running. Clearing startedKeyRef here also keeps a
  // StrictMode remount of the same recipe able to start its session.
  useEffect(() => {
    return () => {
      startedKeyRef.current = null;
      resetCooking();
      setAppliedResult(null);
    };
  }, [id, resetCooking]);

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

  const notifySeasonMiss = useCallback(() => {
    setSeasonToast(dict.cooking.stages.seasonMiss);
    if (seasonToastTimerRef.current !== null) {
      window.clearTimeout(seasonToastTimerRef.current);
    }
    seasonToastTimerRef.current = window.setTimeout(() => setSeasonToast(null), 3200);
  }, [dict]);

  // The step's seasoning slice on the same virtual scale CookingPage hands
  // the SeasonBar, so a nêm gesture banks the season share identically.
  const seasonVirtualPointsFor = useCallback(
    (sess: CookingSession, step: NonNullable<CookingSession['recipe']['steps']>[number]) => {
      const rawMaxOf = (s: typeof step) =>
        Math.round(
          scoreRules.correctPoints *
            Math.max(1, s.requiredIngredients.length) *
            SEASON_MAX_BONUS_RATIO,
        );
      const total = (sess.recipe.steps ?? [])
        .filter((s) => Boolean(s.actionLabel))
        .reduce((sum, s) => sum + rawMaxOf(s), 0);
      return total > 0
        ? (sess.scorePlan.season * rawMaxOf(step)) / total / SEASON_MAX_BONUS_RATIO
        : scoreRules.correctPoints * Math.max(1, step.requiredIngredients.length);
    },
    [scoreRules],
  );

  /**
   * Gesture engine hand-off (Gói H2): the step action's 0–100 score
   * scales the step's cook points. When the step's own gesture is nêm,
   * the gesture IS the seasoning act and banks the season share by the
   * same outcome mapping the bar used (perfect ≥ 85, good 60–84 scaled,
   * below 60 = miss and the gesture replays). For other gestures with
   * seasoning on, the bar still follows, carrying the quality through.
   */
  const handleGestureComplete = useCallback(
    (score: number) => {
      if (!session || session.phase !== 'running') return;
      const steps = session.recipe.steps ?? [];
      const step = steps[session.currentStepIndex];
      if (!step) return;
      const quality = score / 100;
      if (gestureForStep(step) === 'nem' && stageConfig?.seasonEnabled) {
        if (score < 60) {
          notifySeasonMiss();
          setGestureAttempt((a) => a + 1);
          return;
        }
        const closeness = score >= 85 ? 1 : (score - 60) / 25;
        const bonus = seasonBonusFor(seasonVirtualPointsFor(session, step), closeness);
        if (bonus > 0) {
          addStageBonus('season', bonus);
        }
        executeStepAction(quality);
        pulseAnimation('sparkle');
        return;
      }
      if (stageConfig?.seasonEnabled) {
        setPendingQuality(quality);
        setSeasonOpen(true);
        return;
      }
      executeStepAction(quality);
      pulseAnimation('sparkle');
    },
    [
      session,
      stageConfig,
      notifySeasonMiss,
      seasonVirtualPointsFor,
      addStageBonus,
      executeStepAction,
      pulseAnimation,
    ],
  );

  const handleSeasonResult = useCallback(
    (outcome: SeasonOutcome, bonus: number, deviation?: number) => {
      // Sell mode keeps the last seasoning deviation for the flavour
      // diagnosis (mặn vs nhạt — mục 6.5); learning runs ignore it.
      if (isSellMode && typeof deviation === 'number') {
        seasonDeviationRef.current = deviation;
      }
      setSeasonOpen(false);
      if (outcome === 'miss') {
        // The step does not execute; the gesture replays (the old bar's
        // "season again" rule, carried into the gesture layer).
        notifySeasonMiss();
        setPendingQuality(null);
        setGestureAttempt((a) => a + 1);
        return;
      }
      if (bonus > 0) {
        addStageBonus('season', bonus);
      }
      executeStepAction(pendingQuality ?? 1);
      setPendingQuality(null);
      pulseAnimation('sparkle');
    },
    [addStageBonus, notifySeasonMiss, executeStepAction, pendingQuality, pulseAnimation, isSellMode],
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
      <SceneShell>
        <Loading label={t('cooking.preparingKitchen')} />
      </SceneShell>
    );
  }

  if (!canCook || !recipe) {
    return (
      <SceneShell>
        <EmptyState
          title={t('cooking.cannotCook')}
          description={t('cooking.recipeMissing')}
        />
        <Link className={styles.back} to="/recipes">
          {t('cooking.backToRecipes')}
        </Link>
      </SceneShell>
    );
  }

  if (!session || session.recipe.id !== recipe.id) {
    return (
      <SceneShell>
        <Loading label={t('cooking.startingSession')} />
      </SceneShell>
    );
  }

  const sessionSteps = session.recipe.steps ?? [];
  const activeStepIndex = Math.min(
    session.currentStepIndex,
    Math.max(0, sessionSteps.length - 1),
  );
  const activeStep = sessionSteps[activeStepIndex];
  const currentRequiredIds = activeStep?.requiredIngredients ?? [];

  const showResult = session.phase === 'success' || session.phase === 'failed';
  const sessionEnded = session.phase !== 'running';

  // Boss framing (Gói H3): banner over every stage of a boss run, and the
  // verdict block the result modal shows for the license decision.
  const bossChapterName = bossChapter
    ? dict.journey.chapters[bossChapter.id]?.name ?? bossChapter.id
    : '';
  const bossBanner = bossChapter ? (
    <div className={styles.bossBanner}>
      <img
        className={styles.bossJudge}
        src={BOSS_JUDGE_IMAGE}
        alt={dict.journey.judgeAlt}
      />
      <div className={styles.bossBannerText}>
        <p className={styles.bossBannerTitle}>
          👑 {dict.journey.bossBannerTitle} — {recipe.name}
        </p>
        <p className={styles.bossBannerRule}>
          {dict.journey.bossBannerRule(bossChapterName, BOSS_PASS_STARS)}
        </p>
      </div>
    </div>
  ) : null;
  // Sell framing (Gói H4): banner over every stage of a sell run, with
  // the ordering customer's patience draining live overhead.
  const sellPatienceLeft = sellCustomer
    ? Math.max(0, sellCustomer.patienceMs - (sellNow - sellCustomer.arrivedAt))
    : 0;
  const sellBanner = isSellMode ? (
    <div className={styles.bossBanner}>
      <div className={styles.bossBannerText}>
        <p className={styles.bossBannerTitle}>🏪 {dict.stall.sellBannerTitle} — {recipe.name}</p>
        <p className={styles.bossBannerRule}>
          {sellCustomer
            ? `${dict.stall.sellBannerBody(dict.stall.tierNames[sellCustomer.tier], sellCustomer.qty)} ⏳ ${Math.floor(sellPatienceLeft / 60000)}:${String(Math.floor((sellPatienceLeft % 60000) / 1000)).padStart(2, '0')}`
            : dict.stall.sellBannerBody('', 1)}
        </p>
      </div>
    </div>
  ) : null;
  // Event framing (Gói H7): one banner per event mode, same frame as
  // the boss/sell banners, over every stage of the run.
  const survivalBanner = isSurvivalMode ? (
    <div className={styles.bossBanner}>
      <div className={styles.bossBannerText}>
        <p className={styles.bossBannerTitle}>💀 {dict.events.survival.bannerTitle} — {recipe.name}</p>
        <p className={styles.bossBannerRule}>
          {dict.events.survival.bannerBody(
            events?.survival.current?.results.filter((r) => r.success).length ?? 0,
            events?.survival.current?.strikes ?? 0,
            SURVIVAL_MAX_STRIKES,
          )}
        </p>
      </div>
    </div>
  ) : null;
  const mysteryBanner = isMysteryMode ? (
    <div className={styles.bossBanner}>
      <div className={styles.bossBannerText}>
        <p className={styles.bossBannerTitle}>🎁 {dict.events.mystery.bannerTitle} — {recipe.name}</p>
        <p className={styles.bossBannerRule}>{dict.events.mystery.bannerBody}</p>
      </div>
    </div>
  ) : null;
  const feastBanner = isFeastMode ? (
    <div className={styles.bossBanner}>
      <div className={styles.bossBannerText}>
        <p className={styles.bossBannerTitle}>🎉 {dict.events.feast.bannerTitle} — {recipe.name}</p>
        <p className={styles.bossBannerRule}>{dict.events.feast.bannerBody(FEAST_QTY)}</p>
      </div>
    </div>
  ) : null;
  // Online framing (Gói H9): duel and tournament banners in the same
  // frame, and the challenger's ghost ticking alongside answer runs.
  const duelBanner = isDuelMode ? (
    <div className={styles.bossBanner}>
      <div className={styles.bossBannerText}>
        <p className={styles.bossBannerTitle}>⚔️ {dict.online.duelsTitle} — {recipe.name}</p>
        <p className={styles.bossBannerRule}>
          {duelSession?.mode === 'answer'
            ? dict.online.duelAnswerBanner(duelSession.opponentName ?? '')
            : dict.online.duelCreateBanner}
        </p>
      </div>
    </div>
  ) : null;
  const tournamentBanner = isTournamentMode ? (
    <div className={styles.bossBanner}>
      <div className={styles.bossBannerText}>
        <p className={styles.bossBannerTitle}>
          🏆 {dict.online.tournamentTitle} — {recipe.name}
        </p>
        <p className={styles.bossBannerRule}>{dict.online.tournamentBanner}</p>
      </div>
    </div>
  ) : null;
  const ghostTicker =
    isDuelMode &&
    duelSession?.mode === 'answer' &&
    duelSession.ghost &&
    ghostStartedAt !== null ? (
      <GhostTicker ghost={duelSession.ghost} startedAt={ghostStartedAt} />
    ) : null;
  // Answered-duel verdict data for the result panel.
  const myOnlineId = user ? (loadOnlineUserState(user.id).link?.onlineId ?? null) : null;
  const duelChallenge =
    duelOutcome && duelOutcome.variant === 'answered' ? duelOutcome.challenge : null;
  const duelIAmChallenger = duelChallenge ? duelChallenge.challengerId === myOnlineId : false;
  const duelMyScore = duelChallenge
    ? duelIAmChallenger
      ? duelChallenge.challengerScore
      : (duelChallenge.opponentScore ?? session.finalScore)
    : undefined;
  const duelTheirScore = duelChallenge
    ? duelIAmChallenger
      ? (duelChallenge.opponentScore ?? 0)
      : duelChallenge.challengerScore
    : undefined;
  const duelResultKind: 'win' | 'lose' | 'draw' | null = duelChallenge
    ? duelChallenge.winnerId === null
      ? 'draw'
      : duelChallenge.winnerId === myOnlineId
        ? 'win'
        : 'lose'
    : null;
  // Back link: each mode returns to its own home; sell and feast both
  // live at the stall.
  const backHref =
    isSellMode || isFeastMode
      ? '/stall'
      : isSurvivalMode
        ? '/survival'
        : isMysteryMode
          ? '/mystery'
          : isDuelMode
            ? '/online/duels'
            : isTournamentMode
              ? '/online/tournament'
              : `/recipes/${recipe.id}`;
  const backLabel =
    isSellMode || isFeastMode
      ? dict.stall.backToStall
      : isSurvivalMode
        ? dict.events.survival.backToSurvival
        : isMysteryMode
          ? dict.events.mystery.backToMystery
          : isDuelMode
            ? dict.online.backToDuels
            : isTournamentMode
              ? dict.online.backToTournament
              : t('cooking.recipeDetail');
  // Substitution panel (Gói H5): rides under the sell banner through
  // every stage of a picky order's cook — the choice can be confirmed
  // at any point before the run ends; no choice = ignored = penalised.
  const subPanel =
    isSellMode && sellRequest ? (
      <SubstitutionPanel request={sellRequest} chosen={subChoice} onConfirm={handleSubConfirm} />
    ) : null;
  // Nồi Nồi assistant (Gói H6, mục 8.2 ý 14): a small Theme D hint bar
  // under the stage header. Hint density thins out as the player levels
  // up — full (levels 1–3), light (4–6), minimal (7+) — and warnings
  // always outrank step hints. Never shown on a finished run (the
  // result panel takes over) or in preview.
  const FIRE_GESTURE_IDS: ReadonlyArray<ReturnType<typeof gestureForStep>> = [
    'giu-lua',
    'chien',
    'xao',
    'hap',
    'luoc',
    'day-nap',
  ];
  const hintLevel: 'full' | 'light' | 'minimal' =
    (user?.level ?? 1) <= 3 ? 'full' : (user?.level ?? 1) <= 6 ? 'light' : 'minimal';
  const patienceThreshold = hintLevel === 'full' ? 0.4 : hintLevel === 'light' ? 0.3 : 0.2;
  const sessionPhaseForHint = session.phase;
  let assistantText: string | null = null;
  let assistantPose: 'hoang' | 'chi-tay' = 'chi-tay';
  if (!showResult && !isPreview) {
    if (
      isSellMode &&
      sellCustomer &&
      patienceLeftRatio(sellCustomer, sellNow) < patienceThreshold
    ) {
      assistantText = dict.cooking.assistant.patienceWarning;
      assistantPose = 'hoang';
    } else if (
      hintLevel !== 'minimal' &&
      sessionPhaseForHint === 'running' &&
      activeStep &&
      FIRE_GESTURE_IDS.includes(gestureForStep(activeStep))
    ) {
      assistantText = dict.cooking.assistant.fireCaution;
      assistantPose = 'hoang';
    } else if (hintLevel === 'full') {
      if (sessionPhaseForHint === 'running' && activeStep) {
        assistantText = dict.cooking.assistant.nextStep(activeStep.title);
        assistantPose = 'chi-tay';
      } else if (
        sessionPhaseForHint === 'market' ||
        sessionPhaseForHint === 'catch' ||
        sessionPhaseForHint === 'finish' ||
        sessionPhaseForHint === 'minigames'
      ) {
        assistantText = dict.cooking.assistant.stageHints[sessionPhaseForHint];
        assistantPose = 'chi-tay';
      }
    }
  }
  const assistantBar = assistantText ? (
    <div className={styles.assistantBar}>
      <NoiNoi
        pose={assistantPose}
        size={54}
        alt={dict.stall.noiNoiAlt}
        className={styles.assistantMascot}
      />
      <p className={styles.assistantText}>{assistantText}</p>
    </div>
  ) : null;
  const bossNote =
    bossChapter && showResult
      ? session.phase === 'success' && session.stars >= BOSS_PASS_STARS
        ? {
            passed: true,
            title: dict.journey.bossResultPassedTitle,
            body: dict.journey.bossResultPassedBody(
              bossChapterName,
              dishesOfChapter(getApprovedRecipes(), bossChapter).length,
            ),
          }
        : session.phase === 'success'
          ? {
              passed: false,
              title: dict.journey.bossResultShortTitle,
              body: dict.journey.bossResultShortBody(session.stars, BOSS_PASS_STARS),
            }
          : {
              passed: false,
              title: dict.journey.bossBannerTitle,
              body: dict.journey.bossResultFailBody,
            }
      : null;

  // Feast serve/discard/retry (Gói H7): serving books the village
  // payout through the stall store; the caller applies the xu and
  // stamps the feast day + the events funnel.
  const feastPricePreview = feastBatch
    ? Math.round(
        priceForBatch({
          cost: feastBatch.cost,
          grade: dishGradeFor(recipe),
          bestStars: bestStarsByRecipe(user).get(recipe.id) ?? 0,
          level: feastBatch.level,
        }) *
          FEAST_PRICE_FACTOR *
          incomeFactorForLevel(stall?.stallLevel ?? 1),
      )
    : 0;
  const handleFeastServe = () => {
    if (!user || !feastBatch) return;
    const result = serveFeast(
      user.id,
      feastBatch.id,
      bestStarsByRecipe(user).get(recipe.id) ?? 0,
      session.recipe,
    );
    if (!result) return;
    if (result.totalXu > 0) addCoins(result.totalXu);
    recordFeastServed(user.id);
    recordPlayEvent(user.id, 'feast', { recipeId: recipe.id, revenueXu: result.totalXu });
    setFeastServed({ xu: result.totalXu, exp: result.exp });
  };
  const handleFeastDiscard = () => {
    if (!user || !feastBatch) return;
    discardBatch(user.id, feastBatch.id);
    resetCooking();
    navigate('/stall');
  };
  const handleFeastRetry = () => {
    setFeastBatch(null);
    setFeastServed(null);
    feastAppliedRef.current = false;
    seasonDeviationRef.current = null;
    setIncidentPlan(rollIncidentPlan(recipe));
    firedStepsRef.current = new Set();
    setActiveIncident(null);
    startCooking(recipe);
  };

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
      <Link className={styles.back} to={backHref}>
        ← {backLabel}
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
      {bossBanner}
      {sellBanner}
      {survivalBanner}
      {mysteryBanner}
      {feastBanner}
      {duelBanner}
      {tournamentBanner}
      {ghostTicker}
      {subPanel}
      {assistantBar}
    </>
  );

  if (session.phase === 'market' && stageConfig) {
    return (
      <SceneShell>
        <div className={styles.runFrame}>
        {stageHeader}
        <MarketStage
          recipe={effectiveRecipe ?? recipe}
          config={stageConfig}
          maxPoints={session.scorePlan.market}
          onProgress={setLiveStagePoints}
          onComplete={(bonus) => completeStage('market', bonus)}
          onFail={() => navigate(`/recipes/${recipe.id}`, { replace: true })}
        />
        </div>
      </SceneShell>
    );
  }

  if (session.phase === 'catch' && stageConfig) {
    return (
      <SceneShell>
        <div className={styles.runFrame}>
        {stageHeader}
        <CatchStage
          recipe={effectiveRecipe ?? recipe}
          config={stageConfig}
          maxPoints={session.scorePlan.catch}
          onProgress={setLiveStagePoints}
          onComplete={(bonus) => completeStage('catch', bonus)}
        />
        </div>
      </SceneShell>
    );
  }

  if (session.phase === 'finish' && stageConfig) {
    return (
      <SceneShell>
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
      </SceneShell>
    );
  }

  if (session.phase === 'minigames') {
    return (
      <SceneShell>
        <div className={styles.runFrame}>
        <Link className={styles.back} to={backHref}>
          ← {backLabel}
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
        {bossBanner}
        {sellBanner}
        {survivalBanner}
        {mysteryBanner}
        {feastBanner}
        {duelBanner}
        {tournamentBanner}
        {ghostTicker}
      {subPanel}
      {assistantBar}

        <MinigameRunner
          minigames={session.recipe.minigames ?? []}
          onAllComplete={handleMinigamesAllComplete}
          quizBonusSeconds={perkValueOf(session.perk, 'quiz-time-plus')}
          quizSecondChance={(session.quizSecondChanceLeft ?? 0) > 0}
          onQuizSecondChanceUsed={consumeQuizSecondChance}
        />
        </div>
      </SceneShell>
    );
  }

  return (
    <SceneShell>
      <div className={styles.runFrame}>
      <Link className={styles.back} to={backHref}>
        ← {backLabel}
      </Link>
      <div className={styles.top}>
        <div className={styles.hudDish}>
          <img src={dishArtFor(recipe)} alt="" className={styles.hudThumb} />
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
      {bossBanner}
      {sellBanner}
      {duelBanner}
      {tournamentBanner}
      {ghostTicker}
      {subPanel}
      {assistantBar}
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
          actionButtonLabel={null}
          onExecuteAction={() => undefined}
          shake={shakePot}
          sparkle={sparklePot}
          comboStreak={session.comboStreak}
          lastComboAt={session.lastComboAt}
          dropFx={dropFx}
        />
          <IngredientTray
            trayIngredientIds={trayIngredientIds}
            placedIngredientIds={placedIngredientIds}
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

      {session.phase === 'running' &&
      session.actionButtonLabel &&
      activeStep &&
      !seasonOpen &&
      !activeIncident ? (
        <div className={styles.gestureSlot}>
          <GestureStep
            key={`${session.currentStepIndex}-${gestureAttempt}`}
            gesture={gestureForStep(activeStep)}
            stepLabel={session.actionButtonLabel}
            difficulty={recipe.difficulty}
            zoneScale={zoneScaleForGesture(gestureForStep(activeStep))}
            timeScale={runTimeScale}
            ingredientNames={currentRequiredIds.map(
              (ingredientId) => getIngredientById(ingredientId)?.name ?? ingredientId,
            )}
            onComplete={handleGestureComplete}
          />
        </div>
      ) : null}

      {activeIncident && session.phase === 'running' && !showResult ? (
        <div className={styles.gestureSlot}>
          <IncidentPanel
            def={incidentDefById(activeIncident.defId)}
            graceLeftMs={Math.max(0, incidentGraceLeft)}
            penalized={activeIncident.penalized}
            onFixed={handleIncidentFixed}
          />
        </div>
      ) : null}

      {seasonOpen && session.actionButtonLabel && !activeIncident ? (
        <SeasonBar
          stepLabel={session.actionButtonLabel}
          stepPoints={seasonVirtualStepPoints}
          difficulty={recipe.difficulty}
          ingredientCount={Math.max(1, currentRequiredIds.length)}
          zoneScale={(1 + perkValueOf(session.perk, 'season-zone-plus') / 100) * runSeasonZoneScale}
          onResult={handleSeasonResult}
        />
      ) : null}

      {showResult && isSellMode ? (
        sellBatch ? (
          <SellResultPanel
            batch={sellBatch}
            recipeName={recipe.name}
            recipeImage={dishArtFor(recipe)}
            pricePreview={priceForBatch({
              cost: sellBatch.cost,
              grade: dishGradeFor(recipe),
              bestStars: bestStarsByRecipe(user).get(recipe.id) ?? 0,
              level: sellBatch.level,
            })}
            canRetry={Boolean(stall && canCookBatch(stall, recipe, sellBatch.qty))}
            onRetry={() => {
              setSellBatch(null);
              sellAppliedRef.current = false;
              seasonDeviationRef.current = null;
              subChoiceRef.current = null;
              setSubChoice(null);
              setIncidentPlan(rollIncidentPlan(recipe));
              firedStepsRef.current = new Set();
              setActiveIncident(null);
              startCooking(recipe);
            }}
            onBackToStall={() => {
              resetCooking();
              navigate('/stall');
            }}
          />
        ) : null
      ) : showResult && isSurvivalMode ? (
        survivalOutcome ? (
          <SurvivalResultPanel
            score={session.finalScore}
            stars={session.stars}
            success={session.phase === 'success'}
            cleared={survivalOutcome.cleared}
            totalScore={survivalOutcome.run.totalScore}
            strikes={survivalOutcome.run.strikes}
            ended={survivalOutcome.ended}
            queueDone={survivalOutcome.run.index >= survivalOutcome.run.queue.length}
            isBest={survivalOutcome.isBest}
            onNext={() => {
              const nextId = survivalOutcome.run.queue[survivalOutcome.run.index];
              if (nextId) {
                navigate(`/cooking/${nextId}?survival=${survivalId}`, { replace: true });
              }
            }}
            onEnd={() => {
              resetCooking();
              navigate('/survival');
            }}
          />
        ) : null
      ) : showResult && isMysteryMode ? (
        mysteryApplied ? (
          <MysteryResultPanel
            score={session.finalScore}
            stars={session.stars}
            success={session.phase === 'success'}
            rewardXu={mysteryReward?.xu ?? 0}
            rewardCard={mysteryReward?.card ?? null}
            onBack={() => {
              resetCooking();
              navigate('/mystery');
            }}
          />
        ) : null
      ) : showResult && isFeastMode ? (
        feastBatch ? (
          <FeastResultPanel
            batch={feastBatch}
            recipeName={recipe.name}
            recipeImage={dishArtFor(recipe)}
            pricePreview={feastPricePreview}
            canRetry={Boolean(stall && canCookBatch(stall, recipe, FEAST_QTY))}
            served={feastServed}
            onServe={handleFeastServe}
            onDiscard={handleFeastDiscard}
            onRetry={handleFeastRetry}
            onBack={() => {
              resetCooking();
              navigate('/stall');
            }}
          />
        ) : null
      ) : showResult && isDuelMode ? (
        duelOutcome ? (
          <DuelResultPanel
            variant={duelOutcome.variant}
            score={session.finalScore}
            stars={session.stars}
            opponentName={duelSession?.opponentName ?? ''}
            myScore={duelMyScore}
            theirScore={duelTheirScore}
            result={duelResultKind}
            onBack={() => {
              resetCooking();
              navigate('/online/duels');
            }}
          />
        ) : null
      ) : showResult && isTournamentMode ? (
        tournamentOutcome ? (
          <TournamentResultPanel
            variant={tournamentOutcome.variant}
            score={session.finalScore}
            stars={session.stars}
            onBack={() => {
              resetCooking();
              navigate('/online/tournament');
            }}
          />
        ) : null
      ) : showResult ? (
        <CookingResultModal
          session={session}
          onClose={resetCooking}
          onRetry={() => {
            // The retried run must be able to apply its own progress:
            // clear the previous run's applied result. (It used to be
            // cleared only as a side effect of the start effect
            // re-running, which the startedKeyRef guard now prevents.)
            setAppliedResult(null);
            setIncidentPlan(rollIncidentPlan(recipe));
            firedStepsRef.current = new Set();
            setActiveIncident(null);
            startCooking(recipe);
          }}
          onApplyProgress={handleApplyProgress}
          gainedXp={appliedResult?.gainedXp}
          newLevel={appliedResult?.newLevel}
          unlockedAchievements={appliedResult?.unlockedAchievements}
          bossNote={bossNote}
        />
      ) : null}
      </div>
    </SceneShell>
  );
}

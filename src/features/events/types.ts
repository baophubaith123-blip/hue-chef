import type { CardKind } from '@/features/stall/lib/support';

/**
 * Events & retention state (Gói H7 — Kế hoạch hợp nhất, Phần 7 + 10):
 * quests, the quest chain, the 7-day check-in, the cooking streak,
 * survival runs, mystery boxes, the village feast day and festival
 * stats. One localStorage record per player, following the same byUser
 * pattern as the stall / skills stores. Money never lives here: every
 * reward is RETURNED by the store and applied by the caller through
 * AuthContext (xu / cok) or the stall store (cards), so each wallet
 * keeps a single writer — exactly the stall store's own law.
 */

/** What a quest counts. One metric, one plain meaning (see lib/quests). */
export type QuestMetric =
  | 'cook-any'
  | 'cook-star3'
  | 'cook-distinct'
  | 'boss-win'
  | 'serve-any'
  | 'serve-ok'
  | 'serve-vip'
  | 'earn-xu'
  | 'buy-actions'
  | 'dotd-any';

export interface QuestInstance {
  defId: string;
  progress: number;
  /** Distinct dishes seen by a 'cook-distinct' quest (empty otherwise). */
  seenRecipeIds: string[];
  claimed: boolean;
}

export interface ChainState {
  /** Index into CHAIN_STEPS; equals its length when the chain is done. */
  stepIndex: number;
  progress: number;
  seenRecipeIds: string[];
  chestClaimed: boolean;
}

export interface CheckinState {
  /** Last game day a check-in was claimed, yyyy-mm-dd ('' = never). */
  lastClaimDay: string;
  /** Position inside the current 7-day cycle, 1..7 (0 = not started). */
  cycleDay: number;
  totalClaims: number;
}

export interface StreakState {
  /** Consecutive play days up to and including lastPlayDay. */
  count: number;
  best: number;
  /** Last game day the player actually cooked or served, yyyy-mm-dd. */
  lastPlayDay: string;
}

export interface SurvivalDishResult {
  recipeId: string;
  score: number;
  stars: number;
  success: boolean;
}

export interface SurvivalRun {
  id: string;
  /** Dish ids in play order (difficulty ramp, see lib/survival). */
  queue: string[];
  /** Index of the dish currently on the stove. */
  index: number;
  /** Failed dishes so far; the run ends at SURVIVAL_MAX_STRIKES. */
  strikes: number;
  totalScore: number;
  results: SurvivalDishResult[];
  startedDay: string;
}

export interface SurvivalState {
  bestDishes: number;
  bestScore: number;
  runsPlayed: number;
  current: SurvivalRun | null;
}

/** One forced ingredient swap of a mystery box (see lib/mystery). */
export interface MysterySwap {
  stepIndex: number;
  fromId: string;
  toId: string;
}

export interface MysteryBox {
  id: string;
  recipeId: string;
  premium: boolean;
  swaps: MysterySwap[];
  createdDay: string;
  /** Premium boxes carry one guaranteed rescue card (mục 6.10). */
  rewardCard: CardKind | null;
}

export interface MysteryState {
  activeBox: MysteryBox | null;
  /** Game day the free standard box was last opened ('' = never). */
  freeDay: string;
  boxesOpened: number;
  runsFinished: number;
  bestScore: number;
}

export interface FeastState {
  /** Last game day a village feast was served ('' = never). */
  lastDay: string;
  servedCount: number;
}

export interface FestivalState {
  shiftsPlayed: number;
  /** Lifetime cok completion bonuses earned at festival shifts. */
  cokBonusEarned: number;
}

export interface EventsUserState {
  daily: { day: string; quests: QuestInstance[] } | null;
  weekly: { week: string; quests: QuestInstance[] } | null;
  chain: ChainState;
  checkin: CheckinState;
  streak: StreakState;
  survival: SurvivalState;
  mystery: MysteryState;
  feast: FeastState;
  festival: FestivalState;
}

export function emptyEventsState(): EventsUserState {
  return {
    daily: null,
    weekly: null,
    chain: { stepIndex: 0, progress: 0, seenRecipeIds: [], chestClaimed: false },
    checkin: { lastClaimDay: '', cycleDay: 0, totalClaims: 0 },
    streak: { count: 0, best: 0, lastPlayDay: '' },
    survival: { bestDishes: 0, bestScore: 0, runsPlayed: 0, current: null },
    mystery: { activeBox: null, freeDay: '', boxesOpened: 0, runsFinished: 0, bestScore: 0 },
    feast: { lastDay: '', servedCount: 0 },
    festival: { shiftsPlayed: 0, cokBonusEarned: 0 },
  };
}

import { useSyncExternalStore } from 'react';

import type { Recipe } from '@/data/types';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';
import { dayDiff, todayKey } from '@/features/stall/lib/day';
import { isDishOfDay, nextCycleDay, CHECKIN_REWARDS } from '@/features/events/lib/checkin';
import {
  CHAIN_CHEST_CARDS,
  CHAIN_CHEST_XU,
  CHAIN_STEPS,
  dailyQuestsFor,
  questDefById,
  weeklyQuestsFor,
  weekKeyOf,
  type QuestDef,
} from '@/features/events/lib/quests';
import {
  MYSTERY_PREMIUM_REWARD_XU,
  mysteryStandardRewardXu,
} from '@/features/events/lib/mystery';
import { SURVIVAL_MAX_STRIKES } from '@/features/events/lib/survival';
import {
  emptyEventsState,
  type ChainState,
  type EventsUserState,
  type MysteryBox,
  type QuestInstance,
  type SurvivalDishResult,
  type SurvivalRun,
} from '@/features/events/types';

/**
 * Events store (Gói H7): one localStorage record per player, same
 * byUser pattern as the stall and skills stores. All rules live in
 * features/events/lib; this module owns persistence, the day/week
 * rollover of the quest boards, and the transitions (record, claim,
 * open, finish). Rewards are RETURNED, never booked — the caller
 * applies xu/cok through AuthContext and cards through the stall
 * store, keeping every wallet's single-writer law intact.
 */

interface EventsStoreShape {
  byUser: Record<string, EventsUserState>;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function sanitizeQuests(value: unknown): QuestInstance[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((q): q is Record<string, unknown> => Boolean(q) && typeof q === 'object')
    .map((q) => ({
      defId: str(q.defId),
      progress: Math.max(0, num(q.progress)),
      seenRecipeIds: strList(q.seenRecipeIds),
      claimed: q.claimed === true,
    }))
    .filter((q) => questDefById(q.defId) !== null);
}

function sanitize(raw: unknown): EventsUserState {
  const base = emptyEventsState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const daily = r.daily && typeof r.daily === 'object' ? (r.daily as Record<string, unknown>) : null;
  const weekly =
    r.weekly && typeof r.weekly === 'object' ? (r.weekly as Record<string, unknown>) : null;
  const chain = r.chain && typeof r.chain === 'object' ? (r.chain as Record<string, unknown>) : {};
  const checkin =
    r.checkin && typeof r.checkin === 'object' ? (r.checkin as Record<string, unknown>) : {};
  const streak =
    r.streak && typeof r.streak === 'object' ? (r.streak as Record<string, unknown>) : {};
  const survival =
    r.survival && typeof r.survival === 'object' ? (r.survival as Record<string, unknown>) : {};
  const current =
    survival.current && typeof survival.current === 'object'
      ? (survival.current as Record<string, unknown>)
      : null;
  const mystery =
    r.mystery && typeof r.mystery === 'object' ? (r.mystery as Record<string, unknown>) : {};
  const box =
    mystery.activeBox && typeof mystery.activeBox === 'object'
      ? (mystery.activeBox as Record<string, unknown>)
      : null;
  const feast = r.feast && typeof r.feast === 'object' ? (r.feast as Record<string, unknown>) : {};
  const festival =
    r.festival && typeof r.festival === 'object' ? (r.festival as Record<string, unknown>) : {};
  return {
    daily: daily ? { day: str(daily.day), quests: sanitizeQuests(daily.quests) } : null,
    weekly: weekly ? { week: str(weekly.week), quests: sanitizeQuests(weekly.quests) } : null,
    chain: {
      stepIndex: Math.min(CHAIN_STEPS.length, Math.max(0, num(chain.stepIndex))),
      progress: Math.max(0, num(chain.progress)),
      seenRecipeIds: strList(chain.seenRecipeIds),
      chestClaimed: chain.chestClaimed === true,
    },
    checkin: {
      lastClaimDay: str(checkin.lastClaimDay),
      cycleDay: Math.min(7, Math.max(0, num(checkin.cycleDay))),
      totalClaims: Math.max(0, num(checkin.totalClaims)),
    },
    streak: {
      count: Math.max(0, num(streak.count)),
      best: Math.max(0, num(streak.best)),
      lastPlayDay: str(streak.lastPlayDay),
    },
    survival: {
      bestDishes: Math.max(0, num(survival.bestDishes)),
      bestScore: Math.max(0, num(survival.bestScore)),
      runsPlayed: Math.max(0, num(survival.runsPlayed)),
      current: current
        ? {
            id: str(current.id),
            queue: strList(current.queue),
            index: Math.max(0, num(current.index)),
            strikes: Math.max(0, num(current.strikes)),
            totalScore: Math.max(0, num(current.totalScore)),
            results: Array.isArray(current.results)
              ? current.results
                  .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
                  .map((x) => ({
                    recipeId: str(x.recipeId),
                    score: num(x.score),
                    stars: num(x.stars),
                    success: x.success === true,
                  }))
              : [],
            startedDay: str(current.startedDay),
          }
        : null,
    },
    mystery: {
      activeBox: box
        ? {
            id: str(box.id),
            recipeId: str(box.recipeId),
            premium: box.premium === true,
            swaps: Array.isArray(box.swaps)
              ? box.swaps
                  .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
                  .map((x) => ({
                    stepIndex: Math.max(0, num(x.stepIndex)),
                    fromId: str(x.fromId),
                    toId: str(x.toId),
                  }))
              : [],
            createdDay: str(box.createdDay),
            rewardCard:
              box.rewardCard === 'patience' ||
              box.rewardCard === 'swap' ||
              box.rewardCard === 'freeze' ||
              box.rewardCard === 'reseason'
                ? box.rewardCard
                : null,
          }
        : null,
      freeDay: str(mystery.freeDay),
      boxesOpened: Math.max(0, num(mystery.boxesOpened)),
      runsFinished: Math.max(0, num(mystery.runsFinished)),
      bestScore: Math.max(0, num(mystery.bestScore)),
    },
    feast: { lastDay: str(feast.lastDay), servedCount: Math.max(0, num(feast.servedCount)) },
    festival: {
      shiftsPlayed: Math.max(0, num(festival.shiftsPlayed)),
      cokBonusEarned: Math.max(0, num(festival.cokBonusEarned)),
    },
  };
}

function loadAll(): EventsStoreShape {
  const raw = getJsonStorage<EventsStoreShape>(STORAGE_KEYS.events);
  if (!raw || typeof raw !== 'object' || typeof raw.byUser !== 'object' || raw.byUser === null) {
    return { byUser: {} };
  }
  return raw;
}

function saveAll(shape: EventsStoreShape): void {
  setJsonStorage(STORAGE_KEYS.events, shape);
}

function freshQuestInstances(defs: QuestDef[]): QuestInstance[] {
  return defs.map((def) => ({ defId: def.id, progress: 0, seenRecipeIds: [], claimed: false }));
}

/** Day/week rollover: a stale board is replaced by today's draw. */
function prepare(state: EventsUserState, today: string): EventsUserState {
  let next = state;
  if (!next.daily || next.daily.day !== today) {
    next = { ...next, daily: { day: today, quests: freshQuestInstances(dailyQuestsFor(today)) } };
  }
  const week = weekKeyOf(today);
  if (!next.weekly || next.weekly.week !== week) {
    next = { ...next, weekly: { week, quests: freshQuestInstances(weeklyQuestsFor(week)) } };
  }
  return next;
}

export function loadEventsState(userId: string): EventsUserState {
  const shape = loadAll();
  return prepare(sanitize(shape.byUser[userId]), todayKey());
}

function update(
  userId: string,
  fn: (draft: EventsUserState) => EventsUserState,
): EventsUserState {
  const shape = loadAll();
  const current = prepare(sanitize(shape.byUser[userId]), todayKey());
  const next = fn(current);
  shape.byUser[userId] = next;
  saveAll(shape);
  emit();
  return next;
}

/* ---------------- subscription (useSyncExternalStore) ---------------- */

const listeners = new Set<() => void>();
let cache: { userId: string; state: EventsUserState } | null = null;

function emit(): void {
  cache = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(userId: string): EventsUserState {
  if (cache && cache.userId === userId) return cache.state;
  const state = loadEventsState(userId);
  cache = { userId, state };
  return state;
}

export function useEvents(userId: string | null): EventsUserState | null {
  return useSyncExternalStore(
    subscribe,
    () => (userId ? snapshot(userId) : null),
    () => null,
  );
}

/* ---------------- play events: quest progress + streak ---------------- */

export interface PlayEventPayload {
  recipeId?: string;
  /** Cook events: the run's star rating (1..5). */
  stars?: number;
  /** Cook events: this run won a chapter boss (license granted tier). */
  bossWin?: boolean;
  /** Serve events: the customer's tier and the batch's quality level. */
  tier?: string;
  level?: string;
  /** Serve / feast events: xu the serve brought in (price + tip + fee). */
  revenueXu?: number;
  /** Buy events: how many purchase actions this was (default 1). */
  count?: number;
}

export type PlayEventKind = 'cook' | 'serve' | 'buy' | 'feast';

/** How much one play event feeds one quest def (0 = it ignores it). */
function deltaFor(
  def: QuestDef,
  kind: PlayEventKind,
  payload: PlayEventPayload,
  today: string,
): { add: number; distinctRecipeId?: string } {
  const recipeId = payload.recipeId ?? '';
  switch (def.metric) {
    case 'cook-any':
      return { add: kind === 'cook' ? 1 : 0 };
    case 'cook-star3':
      return { add: kind === 'cook' && (payload.stars ?? 0) >= 3 ? 1 : 0 };
    case 'cook-distinct':
      return kind === 'cook' && recipeId
        ? { add: 0, distinctRecipeId: recipeId }
        : { add: 0 };
    case 'boss-win':
      return { add: kind === 'cook' && payload.bossWin ? 1 : 0 };
    case 'serve-any':
      return { add: kind === 'serve' || kind === 'feast' ? 1 : 0 };
    case 'serve-ok':
      return {
        add:
          kind === 'serve' && (payload.level === 'perfect' || payload.level === 'standard')
            ? 1
            : 0,
      };
    case 'serve-vip':
      return { add: kind === 'serve' && payload.tier === 'vip' ? 1 : 0 };
    case 'earn-xu':
      return {
        add: kind === 'serve' || kind === 'feast' ? Math.max(0, payload.revenueXu ?? 0) : 0,
      };
    case 'buy-actions':
      return { add: kind === 'buy' ? Math.max(1, payload.count ?? 1) : 0 };
    case 'dotd-any':
      return {
        add:
          (kind === 'cook' || kind === 'serve' || kind === 'feast') &&
          recipeId &&
          isDishOfDay(recipeId, today)
            ? 1
            : 0,
      };
    default:
      return { add: 0 };
  }
}

function accrueQuest(
  instance: QuestInstance,
  kind: PlayEventKind,
  payload: PlayEventPayload,
  today: string,
): QuestInstance {
  const def = questDefById(instance.defId);
  if (!def || instance.claimed || instance.progress >= def.target) return instance;
  const { add, distinctRecipeId } = deltaFor(def, kind, payload, today);
  if (distinctRecipeId) {
    if (instance.seenRecipeIds.includes(distinctRecipeId)) return instance;
    const seen = [...instance.seenRecipeIds, distinctRecipeId];
    return { ...instance, seenRecipeIds: seen, progress: Math.min(def.target, seen.length) };
  }
  if (add <= 0) return instance;
  return { ...instance, progress: Math.min(def.target, instance.progress + add) };
}

function accrueChain(
  chain: ChainState,
  kind: PlayEventKind,
  payload: PlayEventPayload,
  today: string,
): ChainState {
  const def = CHAIN_STEPS[chain.stepIndex];
  if (!def) return chain;
  const probe: QuestInstance = {
    defId: def.id,
    progress: chain.progress,
    seenRecipeIds: chain.seenRecipeIds,
    claimed: false,
  };
  const next = accrueQuest(probe, kind, payload, today);
  if (next === probe) return chain;
  const advanced = next.progress >= def.target;
  return {
    stepIndex: advanced ? chain.stepIndex + 1 : chain.stepIndex,
    progress: advanced ? 0 : next.progress,
    seenRecipeIds: advanced ? [] : next.seenRecipeIds,
    chestClaimed: chain.chestClaimed,
  };
}

/**
 * The one funnel every loop reports real play through: a finished
 * learning cook, a served stall order, a market purchase, a village
 * feast. It feeds the daily board, the weekly board and the chain's
 * current step, and — for cook / serve / feast — stamps the cooking
 * streak's day. Buying alone does not keep a cooking streak alive.
 */
export function recordPlayEvent(
  userId: string,
  kind: PlayEventKind,
  payload: PlayEventPayload,
): EventsUserState {
  const today = todayKey();
  return update(userId, (draft) => {
    let streak = draft.streak;
    if (kind === 'cook' || kind === 'serve' || kind === 'feast') {
      if (streak.lastPlayDay !== today) {
        const gap = streak.lastPlayDay ? dayDiff(streak.lastPlayDay, today) : Number.POSITIVE_INFINITY;
        const count = gap === 1 ? streak.count + 1 : 1;
        streak = { count, best: Math.max(streak.best, count), lastPlayDay: today };
      }
    }
    return {
      ...draft,
      streak,
      daily: draft.daily
        ? {
            ...draft.daily,
            quests: draft.daily.quests.map((q) => accrueQuest(q, kind, payload, today)),
          }
        : draft.daily,
      weekly: draft.weekly
        ? {
            ...draft.weekly,
            quests: draft.weekly.quests.map((q) => accrueQuest(q, kind, payload, today)),
          }
        : draft.weekly,
      chain: accrueChain(draft.chain, kind, payload, today),
    };
  });
}

/* ---------------- claims ---------------- */

/** Claim a finished daily/weekly quest; returns its xu reward. */
export function claimQuest(
  userId: string,
  scope: 'daily' | 'weekly',
  defId: string,
): number | null {
  let reward: number | null = null;
  update(userId, (draft) => {
    const board = scope === 'daily' ? draft.daily : draft.weekly;
    if (!board) return draft;
    const instance = board.quests.find((q) => q.defId === defId);
    const def = questDefById(defId);
    if (!instance || !def || instance.claimed || instance.progress < def.target) return draft;
    reward = def.rewardXu;
    const quests = board.quests.map((q) => (q.defId === defId ? { ...q, claimed: true } : q));
    if (scope === 'daily' && draft.daily) {
      return { ...draft, daily: { day: draft.daily.day, quests } };
    }
    if (scope === 'weekly' && draft.weekly) {
      return { ...draft, weekly: { week: draft.weekly.week, quests } };
    }
    return draft;
  });
  return reward;
}

/** Claim the chain chest once every step is done; returns its contents. */
export function claimChainChest(
  userId: string,
): { xu: number; cards: Array<'patience' | 'reseason'> } | null {
  let result: { xu: number; cards: Array<'patience' | 'reseason'> } | null = null;
  update(userId, (draft) => {
    if (draft.chain.stepIndex < CHAIN_STEPS.length || draft.chain.chestClaimed) return draft;
    result = { xu: CHAIN_CHEST_XU, cards: [...CHAIN_CHEST_CARDS] };
    return { ...draft, chain: { ...draft.chain, chestClaimed: true } };
  });
  return result;
}

/**
 * Claim today's check-in. Returns the cycle day landed on and the
 * reward to apply, or null when today is already claimed.
 */
export function claimCheckin(
  userId: string,
): { cycleDay: number; xu: number; cok: number } | null {
  const today = todayKey();
  let result: { cycleDay: number; xu: number; cok: number } | null = null;
  update(userId, (draft) => {
    if (draft.checkin.lastClaimDay === today) return draft;
    const cycleDay = nextCycleDay(draft.checkin.lastClaimDay, draft.checkin.cycleDay, today);
    const reward = CHECKIN_REWARDS[cycleDay - 1] ?? CHECKIN_REWARDS[0];
    result = { cycleDay, xu: reward.xu, cok: reward.cok };
    return {
      ...draft,
      checkin: {
        lastClaimDay: today,
        cycleDay,
        totalClaims: draft.checkin.totalClaims + 1,
      },
    };
  });
  return result;
}

/* ---------------- mystery box ---------------- */

/** Register a freshly opened box (the page built it via lib/mystery). */
export function registerMysteryBox(userId: string, box: MysteryBox, usedFree: boolean): void {
  update(userId, (draft) => ({
    ...draft,
    mystery: {
      ...draft.mystery,
      activeBox: box,
      freeDay: usedFree ? box.createdDay : draft.mystery.freeDay,
      boxesOpened: draft.mystery.boxesOpened + 1,
    },
  }));
}

/**
 * Close out a mystery run that was played to the end (win or lose):
 * the box is consumed, the record updated, and the reward returned.
 * A premium box's card is guaranteed for FINISHING the run; the xu
 * purse needs a win. Abandoning a run mid-way never calls this — the
 * box simply stays open.
 */
export function completeMysteryRun(
  userId: string,
  boxId: string,
  score: number,
  success: boolean,
  recipe: Recipe,
): { xu: number; card: MysteryBox['rewardCard'] } | null {
  let result: { xu: number; card: MysteryBox['rewardCard'] } | null = null;
  update(userId, (draft) => {
    const box = draft.mystery.activeBox;
    if (!box || box.id !== boxId) return draft;
    const xu = success
      ? box.premium
        ? MYSTERY_PREMIUM_REWARD_XU
        : mysteryStandardRewardXu(recipe)
      : 0;
    result = { xu, card: box.premium ? box.rewardCard : null };
    return {
      ...draft,
      mystery: {
        ...draft.mystery,
        activeBox: null,
        runsFinished: draft.mystery.runsFinished + 1,
        bestScore: Math.max(draft.mystery.bestScore, score),
      },
    };
  });
  return result;
}

/* ---------------- survival ---------------- */

export function startSurvivalRun(userId: string, queueIds: string[]): SurvivalRun {
  const run: SurvivalRun = {
    id: `survival-${crypto.randomUUID()}`,
    queue: queueIds,
    index: 0,
    strikes: 0,
    totalScore: 0,
    results: [],
    startedDay: todayKey(),
  };
  update(userId, (draft) => ({
    ...draft,
    survival: { ...draft.survival, runsPlayed: draft.survival.runsPlayed + 1, current: run },
  }));
  return run;
}

/**
 * Book one finished survival dish. Returns the run state after the
 * booking, whether the run ended with this dish, and how many dishes
 * were cleared — or null when the run id does not match (stale page).
 */
export function recordSurvivalDish(
  userId: string,
  runId: string,
  result: SurvivalDishResult,
): { run: SurvivalRun; ended: boolean; cleared: number } | null {
  let out: { run: SurvivalRun; ended: boolean; cleared: number } | null = null;
  update(userId, (draft) => {
    const run = draft.survival.current;
    if (!run || run.id !== runId) return draft;
    const results = [...run.results, result];
    const strikes = run.strikes + (result.success ? 0 : 1);
    const next: SurvivalRun = {
      ...run,
      results,
      strikes,
      index: run.index + 1,
      totalScore: run.totalScore + Math.max(0, result.score),
    };
    const cleared = results.filter((r) => r.success).length;
    const ended = strikes >= SURVIVAL_MAX_STRIKES || next.index >= run.queue.length;
    out = { run: next, ended, cleared };
    if (!ended) {
      return { ...draft, survival: { ...draft.survival, current: next } };
    }
    return {
      ...draft,
      survival: {
        bestDishes: Math.max(draft.survival.bestDishes, cleared),
        bestScore: Math.max(draft.survival.bestScore, next.totalScore),
        runsPlayed: draft.survival.runsPlayed,
        current: null,
      },
    };
  });
  return out;
}

/** Walk away from the current run; its cleared dishes still count. */
export function abandonSurvivalRun(userId: string): void {
  update(userId, (draft) => {
    const run = draft.survival.current;
    if (!run) return draft;
    const cleared = run.results.filter((r) => r.success).length;
    return {
      ...draft,
      survival: {
        bestDishes: Math.max(draft.survival.bestDishes, cleared),
        bestScore: Math.max(draft.survival.bestScore, run.totalScore),
        runsPlayed: draft.survival.runsPlayed,
        current: null,
      },
    };
  });
}

/* ---------------- feast & festival stats ---------------- */

export function recordFeastServed(userId: string): void {
  const today = todayKey();
  update(userId, (draft) => ({
    ...draft,
    feast: { lastDay: today, servedCount: draft.feast.servedCount + 1 },
  }));
}

export function recordFestivalShift(userId: string): void {
  update(userId, (draft) => ({
    ...draft,
    festival: { ...draft.festival, shiftsPlayed: draft.festival.shiftsPlayed + 1 },
  }));
}

export function recordFestivalBonus(userId: string): void {
  update(userId, (draft) => ({
    ...draft,
    festival: { ...draft.festival, cokBonusEarned: draft.festival.cokBonusEarned + 1 },
  }));
}

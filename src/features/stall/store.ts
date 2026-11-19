import { useSyncExternalStore } from 'react';

import type { Recipe } from '@/data/types';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { sellableRecipes } from '@/features/journey/lib/journey';
import type { PublicUser } from '@/features/auth/types';
import { addDays, dayDiff, todayKey } from '@/features/stall/lib/day';
import { dailyPriceFor, shelfLifeDaysFor } from '@/features/stall/lib/market';
import {
  LOST_ORDER_EXP,
  priceForBatch,
  qualityBandForLevel,
  shiftDurationMs,
  shiftQuotaForStars,
  stallStarsForExp,
  tablesForStars,
  tipForBatch,
  cokForServe,
} from '@/features/stall/lib/pricing-sell';
import {
  patienceForTier,
  patienceLeftRatio,
  pickDishForTier,
  rollQty,
  rollTier,
} from '@/features/stall/lib/orders';
import type { DiagnosisKey } from '@/features/stall/lib/diagnosis';
import {
  emptyStallState,
  type CookedBatch,
  type IngredientLot,
  type ShiftSummary,
  type StallCustomer,
  type StallUserState,
} from '@/features/stall/types';

/**
 * Sell-loop store (Kế hoạch hợp nhất, Phần 5–6): one localStorage record
 * per player, following the same byUser pattern as the achievements
 * store. All rules live in features/stall/lib; this module owns state
 * transitions only. Money (xu/cok) stays on the user record — actions
 * here RETURN the amounts a serve earns and the caller applies them
 * through AuthContext, so the wallets have a single writer.
 */

interface StallStoreShape {
  byUser: Record<string, StallUserState>;
}

function loadAll(): StallStoreShape {
  const raw = getJsonStorage<StallStoreShape>(STORAGE_KEYS.stall);
  if (!raw || typeof raw !== 'object' || typeof raw.byUser !== 'object' || raw.byUser === null) {
    return { byUser: {} };
  }
  return raw;
}

function saveAll(shape: StallStoreShape): void {
  setJsonStorage(STORAGE_KEYS.stall, shape);
}

/** Write off lots whose last usable day has passed; returns notices. */
function applySpoilage(state: StallUserState, today: string): StallUserState {
  // Scan on every load/tick, not only on the first tick of a new day: a
  // lot whose expiry day has passed is written off as soon as any stall
  // activity observes it (notices are added only for lots actually
  // removed, so repeated scans never duplicate them).
  const notices = [...state.spoiledNotices];
  const kept: IngredientLot[] = [];
  for (const lot of state.lots) {
    if (dayDiff(lot.expiryDay, today) > 0) {
      notices.push({ ingredientId: lot.ingredientId, qty: lot.qty, day: today });
    } else {
      kept.push(lot);
    }
  }
  return {
    ...state,
    lots: kept,
    spoiledNotices: notices.slice(-12),
    lastDay: today,
  };
}

export function loadStallState(userId: string): StallUserState {
  const shape = loadAll();
  const today = todayKey();
  const existing = shape.byUser[userId];
  if (!existing) return emptyStallState(today);
  const rolled = applySpoilage({ ...emptyStallState(today), ...existing }, today);
  if (rolled !== existing) {
    shape.byUser[userId] = rolled;
    saveAll(shape);
  }
  return rolled;
}

function update(userId: string, fn: (draft: StallUserState) => StallUserState): StallUserState {
  const shape = loadAll();
  const today = todayKey();
  const current = shape.byUser[userId] ?? emptyStallState(today);
  const next = fn(applySpoilage(current, today));
  shape.byUser[userId] = next;
  saveAll(shape);
  emit();
  return next;
}

/* ---------------- subscription (useSyncExternalStore) ---------------- */

const listeners = new Set<() => void>();
let cache: { userId: string; state: StallUserState } | null = null;

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

function snapshot(userId: string): StallUserState {
  if (cache && cache.userId === userId) return cache.state;
  const state = loadStallState(userId);
  cache = { userId, state };
  return state;
}

export function useStall(userId: string | null): StallUserState | null {
  return useSyncExternalStore(
    subscribe,
    () => (userId ? snapshot(userId) : null),
    () => null,
  );
}

/* ---------------- derived helpers ---------------- */

export function inventoryCount(state: StallUserState, ingredientId: string): number {
  return state.lots
    .filter((lot) => lot.ingredientId === ingredientId)
    .reduce((sum, lot) => sum + lot.qty, 0);
}

export function inventoryByIngredient(state: StallUserState): Map<string, number> {
  const map = new Map<string, number>();
  for (const lot of state.lots) {
    map.set(lot.ingredientId, (map.get(lot.ingredientId) ?? 0) + lot.qty);
  }
  return map;
}

/** True when the pantry covers one batch of the recipe × qty portions. */
export function canCookBatch(state: StallUserState, recipe: Recipe, qty: number): boolean {
  return recipe.ingredients.every(
    (ref) => inventoryCount(state, ref.ingredientId) >= qty,
  );
}

/** Missing units per ingredient for one batch × qty (empty = cookable). */
export function missingForBatch(
  state: StallUserState,
  recipe: Recipe,
  qty: number,
): { ingredientId: string; missing: number }[] {
  const missing: { ingredientId: string; missing: number }[] = [];
  for (const ref of recipe.ingredients) {
    const have = inventoryCount(state, ref.ingredientId);
    if (have < qty) missing.push({ ingredientId: ref.ingredientId, missing: qty - have });
  }
  return missing;
}

/* ---------------- market ---------------- */

export function buyIngredient(
  userId: string,
  ingredientId: string,
  qty: number,
  unitPrice: number,
): StallUserState {
  const today = todayKey();
  const lot: IngredientLot = {
    id: `lot-${crypto.randomUUID()}`,
    ingredientId,
    qty,
    unitPrice,
    boughtDay: today,
    expiryDay: addDays(today, shelfLifeDaysFor(ingredientId)),
  };
  return update(userId, (draft) => ({ ...draft, lots: [...draft.lots, lot] }));
}

/**
 * One-time starter pack (anti soft-lock): the ingredients for two
 * batches of the player's cheapest licensed dish, granted free when a
 * licensed player is flat broke with an empty pantry. Cost basis is
 * today's market price, so the capital law still books them honestly.
 */
export function claimStarterPack(userId: string, recipe: Recipe): StallUserState {
  const today = todayKey();
  const lots: IngredientLot[] = recipe.ingredients.map((ref) => ({
    id: `lot-${crypto.randomUUID()}`,
    ingredientId: ref.ingredientId,
    qty: 2,
    unitPrice: dailyPriceFor(ref.ingredientId, today),
    boughtDay: today,
    expiryDay: addDays(today, shelfLifeDaysFor(ref.ingredientId)),
  }));
  return update(userId, (draft) => ({
    ...draft,
    lots: [...draft.lots, ...lots],
    starterPackClaimed: true,
  }));
}

/* ---------------- shift lifecycle ---------------- */

export function openShift(userId: string, now: number): StallUserState {
  return update(userId, (draft) => {
    if (draft.shift) return draft;
    const stars = stallStarsForExp(draft.exp);
    return {
      ...draft,
      customers: [],
      shift: {
        id: `shift-${crypto.randomUUID()}`,
        startedAt: now,
        endsAt: now + shiftDurationMs(stars),
        spawnQuota: shiftQuotaForStars(stars),
        spawned: 0,
        nextSpawnAt: now + 3500,
        revenueXu: 0,
        revenueCok: 0,
        servedOk: 0,
        servedPoor: 0,
        lost: 0,
        unserved: 0,
        spoiledBatches: 0,
        expGained: 0,
      },
    };
  });
}

function finalizeShift(draft: StallUserState, now: number): StallUserState {
  const shift = draft.shift;
  if (!shift) return draft;
  const unserved = draft.customers.filter(
    (c) => c.state === 'waiting' || c.state === 'accepted',
  ).length;
  const summary: ShiftSummary = {
    ...shift,
    unserved,
    endedAt: now,
    starsBefore: stallStarsForExp(draft.exp - shift.expGained),
    starsAfter: stallStarsForExp(draft.exp),
  };
  return { ...draft, shift: null, customers: [], lastSummary: summary };
}

export function closeShift(userId: string, now: number): StallUserState {
  return update(userId, (draft) => finalizeShift(draft, now));
}

function spawnCustomer(
  draft: StallUserState,
  user: PublicUser,
  recipes: Recipe[],
  now: number,
): StallCustomer | null {
  const sellable = sellableRecipes(user, recipes);
  if (sellable.length === 0) return null;
  const stars = stallStarsForExp(draft.exp);
  const tier = rollTier(stars, Math.random());
  const dish = pickDishForTier(tier, sellable, Math.random());
  if (!dish) return null;
  const usedTables = new Set(
    draft.customers
      .filter((c) => c.state === 'waiting' || c.state === 'accepted')
      .map((c) => c.tableIndex),
  );
  let tableIndex = 0;
  while (usedTables.has(tableIndex)) tableIndex += 1;
  return {
    id: `cust-${crypto.randomUUID()}`,
    tier,
    recipeId: dish.id,
    qty: rollQty(tier, stars, Math.random()),
    arrivedAt: now,
    patienceMs: patienceForTier(tier, Math.random()),
    state: 'waiting',
    tableIndex,
  };
}

/**
 * The stall clock: spawn due customers, expire patience (a lost order
 * still earns its +2 EXP — chốt 3), clear resolved customers after
 * their exit beat, and close the shift when its time runs out. Driven
 * by an interval on the stall / market / sell-cook screens.
 */
export function tickStall(
  userId: string,
  user: PublicUser,
  recipes: Recipe[],
  now: number,
): StallUserState {
  return update(userId, (draft) => {
    let next = draft;
    // Clear customers whose exit beat finished.
    const keptCustomers = next.customers.filter(
      (c) => !c.resolvedAt || now - c.resolvedAt < 6000,
    );
    if (keptCustomers.length !== next.customers.length) {
      next = { ...next, customers: keptCustomers };
    }
    const shift = next.shift;
    if (!shift) return next;

    // Patience expiry → lost orders.
    let exp = next.exp;
    let lost = shift.lost;
    let expGained = shift.expGained;
    const expired = next.customers.map((c) => {
      if (
        (c.state === 'waiting' || c.state === 'accepted') &&
        patienceLeftRatio(c, now) <= 0
      ) {
        lost += 1;
        expGained += LOST_ORDER_EXP;
        exp += LOST_ORDER_EXP;
        return { ...c, state: 'left' as const, resolvedAt: now };
      }
      return c;
    });
    if (expired !== next.customers) {
      next = { ...next, customers: expired, exp, shift: { ...shift, lost, expGained } };
    }

    // Shift clock.
    if (now >= shift.endsAt) {
      return finalizeShift(next, now);
    }

    // Spawning.
    const activeCount = next.customers.filter(
      (c) => c.state === 'waiting' || c.state === 'accepted',
    ).length;
    const tables = tablesForStars(stallStarsForExp(next.exp));
    if (
      next.shift &&
      now >= next.shift.nextSpawnAt &&
      next.shift.spawned < next.shift.spawnQuota &&
      activeCount < tables
    ) {
      const customer = spawnCustomer(next, user, recipes, now);
      if (customer) {
        const duration = next.shift.endsAt - next.shift.startedAt;
        const interval = duration / Math.max(1, next.shift.spawnQuota);
        next = {
          ...next,
          customers: [...next.customers, customer],
          shift: {
            ...next.shift,
            spawned: next.shift.spawned + 1,
            nextSpawnAt: now + interval * (0.7 + Math.random() * 0.6),
          },
        };
      } else {
        next = { ...next, shift: { ...next.shift, nextSpawnAt: now + 5000 } };
      }
    }
    return next;
  });
}

/* ---------------- orders, cooking, serving ---------------- */

export function acceptOrder(userId: string, customerId: string): StallUserState {
  return update(userId, (draft) => ({
    ...draft,
    customers: draft.customers.map((c) =>
      c.id === customerId && c.state === 'waiting' ? { ...c, state: 'accepted' as const } : c,
    ),
  }));
}

export interface FinishCookInput {
  recipe: Recipe;
  qty: number;
  qualityScore: number;
  level: CookedBatch['level'];
  diagnosis: DiagnosisKey[];
}

/**
 * A finished sell cook: consume the batch's ingredients FIFO from the
 * pantry lots (the batch's real cost is what those lots actually cost —
 * mục 6.12) and put the batch on the counter. A failed run still eats
 * its ingredients: a spoiled batch is a lost cost, per the capital law.
 * Units missing from the pantry (the pantry was checked before the run;
 * this is only a safety net) are booked at today's market price.
 */
export function finishCook(userId: string, input: FinishCookInput): CookedBatch {
  const today = todayKey();
  let batch: CookedBatch | null = null;
  update(userId, (draft) => {
    const lots = draft.lots.map((lot) => ({ ...lot }));
    let cost = 0;
    for (const ref of input.recipe.ingredients) {
      let need = input.qty;
      for (const lot of lots) {
        if (need <= 0) break;
        if (lot.ingredientId !== ref.ingredientId || lot.qty <= 0) continue;
        const take = Math.min(need, lot.qty);
        lot.qty -= take;
        cost += take * lot.unitPrice;
        need -= take;
      }
      if (need > 0) {
        cost += need * dailyPriceFor(ref.ingredientId, today);
      }
    }
    batch = {
      id: `batch-${crypto.randomUUID()}`,
      recipeId: input.recipe.id,
      qty: input.qty,
      qualityScore: input.qualityScore,
      level: input.level,
      diagnosis: [...input.diagnosis],
      cost,
      cookedAt: Date.now(),
    };
    return {
      ...draft,
      lots: lots.filter((lot) => lot.qty > 0),
      batches: [...draft.batches, batch],
    };
  });
  if (!batch) throw new Error('finishCook produced no batch');
  return batch;
}

export interface ServeResult {
  price: number;
  tip: number;
  totalXu: number;
  cok: number;
  exp: number;
}

/**
 * Serve a ready batch to its customer: price from the capital law,
 * tip from the patience left, cok when a VIP is served Đạt chuẩn or
 * better. Returns the wallet amounts for the caller to apply through
 * AuthContext; null when the serve is not legal (wrong dish, wrong
 * quantity, spoiled batch, customer already gone).
 */
export function serveBatch(
  userId: string,
  customerId: string,
  batchId: string,
  bestStars: number,
  recipe: Recipe,
  now: number,
): ServeResult | null {
  let result: ServeResult | null = null;
  update(userId, (draft) => {
    const customer = draft.customers.find((c) => c.id === customerId);
    const batch = draft.batches.find((b) => b.id === batchId);
    if (!customer || !batch) return draft;
    if (customer.state !== 'accepted' && customer.state !== 'waiting') return draft;
    if (batch.recipeId !== customer.recipeId || batch.qty !== customer.qty) return draft;
    const band = qualityBandForLevel(batch.level);
    if (!band.sellable) return draft;

    const price = priceForBatch({
      cost: batch.cost,
      grade: dishGradeFor(recipe),
      bestStars,
      level: batch.level,
    });
    const tip = tipForBatch({
      price,
      level: batch.level,
      patienceLeftRatio: patienceLeftRatio(customer, now),
    });
    const cok = customer.tier === 'vip' ? cokForServe(batch.level) : 0;
    const exp = band.exp;
    result = { price, tip, totalXu: price + tip, cok, exp };

    const shift = draft.shift
      ? {
          ...draft.shift,
          revenueXu: draft.shift.revenueXu + price + tip,
          revenueCok: draft.shift.revenueCok + cok,
          servedOk: draft.shift.servedOk + (batch.level === 'perfect' || batch.level === 'standard' ? 1 : 0),
          servedPoor: draft.shift.servedPoor + (batch.level === 'good' || batch.level === 'burned' ? 1 : 0),
          expGained: draft.shift.expGained + exp,
        }
      : null;
    return {
      ...draft,
      exp: draft.exp + exp,
      batches: draft.batches.filter((b) => b.id !== batchId),
      customers: draft.customers.map((c) =>
        c.id === customerId ? { ...c, state: 'served' as const, resolvedAt: now } : c,
      ),
      shift,
    };
  });
  return result;
}

/** Discard a batch (spoiled, or the player chooses not to sell it). */
export function discardBatch(userId: string, batchId: string): StallUserState {
  return update(userId, (draft) => {
    const batch = draft.batches.find((b) => b.id === batchId);
    if (!batch) return draft;
    return {
      ...draft,
      batches: draft.batches.filter((b) => b.id !== batchId),
      shift:
        draft.shift && batch.level === 'spoiled'
          ? { ...draft.shift, spoiledBatches: draft.shift.spoiledBatches + 1 }
          : draft.shift,
    };
  });
}

export function dismissSummary(userId: string): StallUserState {
  return update(userId, (draft) => ({ ...draft, lastSummary: null }));
}

export function clearSpoiledNotices(userId: string): StallUserState {
  return update(userId, (draft) => ({ ...draft, spoiledNotices: [] }));
}

import { useSyncExternalStore } from 'react';

import type { Recipe } from '@/data/types';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { bestStarsByRecipe, sellableRecipes } from '@/features/journey/lib/journey';
import type { PublicUser } from '@/features/auth/types';
import { addDays, dayDiff, dayKeyOf, todayKey } from '@/features/stall/lib/day';
import { dailyPriceFor, shelfLifeDaysFor } from '@/features/stall/lib/market';
import {
  LOST_ORDER_EXP,
  priceForBatch,
  qualityBandForLevel,
  qualityBandForScore,
  shiftDurationMs,
  shiftQuotaForStars,
  stallStarsForExp,
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
import { diagnoseBackgroundPot, type DiagnosisKey } from '@/features/stall/lib/diagnosis';
import {
  AD_DURATION_MS,
  AD_PRICE,
  AD_QUOTA_FACTOR,
  AD_SPAWN_FACTOR,
  CARD_PRICES,
  DECOR_PRICES,
  DELIVERY_MIN_STALL_LEVEL,
  DELIVERY_PATIENCE_MS,
  FREEZE_CARD_MS,
  GEAR_PRICES,
  HIRE_MIN_STALL_LEVEL,
  MANAGER_AUTO_ACCEPT_MS,
  MAX_EXTRA_STOVES,
  MIXER_POT_FACTOR,
  PATIENCE_CARD_MS,
  RESEASON_SCORE_CAP,
  RESEASON_SCORE_GAIN,
  TRAINING_COST,
  cashierTipFactor,
  cookPotDurationFactor,
  cookQualityBonus,
  dailyWageTotal,
  decorPatienceFactor,
  decorSpawnFactor,
  decorTipFactor,
  deliveryFeeFor,
  dishGroupForRecipe,
  isReseasonable,
  rankForOrders,
  runnerPremiumFactor,
  serverAutoServeDelayMs,
  shelfLifeFactor,
  skinAvailable,
  skinDef,
  specialtyMatches,
  type CardKind,
  type DecorKind,
  type DishGroup,
  type GearKind,
  type StaffRole,
} from '@/features/stall/lib/support';
import {
  LEVEL5_VIP_BOOST,
  incomeFactorForLevel,
  menuCapForLevel,
  tablesForLevel,
  upgradeStatusFor,
} from '@/features/stall/lib/stall-levels';
import {
  AFK_MAX_CUSTOMERS,
  AFK_MIN_AWAY_MS,
  AFK_WALK_AWAY_RATE,
  afkCustomerIntervalMs,
  afkEfficiencyFor,
  afkEssentialFor,
} from '@/features/stall/lib/afk';
import {
  applicableRequestsFor,
  type RequestKind,
} from '@/features/stall/lib/substitutions';
import {
  pickyRateForStars,
  REQUEST_OK_TIP_FACTOR,
  shiftPhaseAt,
  spawnFactorForPhase,
} from '@/features/stall/lib/rush';
import {
  backgroundLevelFor,
  backgroundPotDurationMs,
  nextUpgradePrice,
  potCapacityFor,
  rollBackgroundQuality,
  type UpgradeKind,
} from '@/features/stall/lib/upgrades';
import {
  emptyStallState,
  type AfkReport,
  type BackgroundPot,
  type CookedBatch,
  type IngredientLot,
  type ShiftSummary,
  type StaffMember,
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

/**
 * Fill fields a legacy record predates (Gói H5 added pots + kitchen
 * upgrades; Gói H6 the whole support block) with safe defaults, so old
 * players keep everything they had and simply start with a level-1
 * stall, no crew, no gear and an unstamped AFK clock.
 */
function withDefaults(state: StallUserState, today: string): StallUserState {
  const base = emptyStallState(today);
  return {
    ...base,
    ...state,
    pots: state.pots ?? [],
    upgrades: { ...base.upgrades, ...(state.upgrades ?? {}) },
    stallLevel: state.stallLevel ?? 1,
    staff: state.staff ?? [],
    gear: { ...base.gear, ...(state.gear ?? {}) },
    cards: { ...base.cards, ...(state.cards ?? {}) },
    decorIds: state.decorIds ?? [],
    menuIds: state.menuIds ?? null,
    adUntil: state.adUntil ?? 0,
    wageDebtXu: state.wageDebtXu ?? 0,
    pendingCreditXu: state.pendingCreditXu ?? 0,
    pendingCreditCok: state.pendingCreditCok ?? 0,
    lastSeenAt: state.lastSeenAt ?? 0,
    afkReport: state.afkReport ?? null,
    totalServed: state.totalServed ?? 0,
    noiNoiSkinId: state.noiNoiSkinId ?? 'mac-dinh',
    ownedSkinIds: state.ownedSkinIds ?? [],
    lastAutoServeAt: state.lastAutoServeAt ?? 0,
    nextDeliveryAt: state.nextDeliveryAt ?? 0,
  };
}

/**
 * Staff wages (Gói H6, mục 8.1): every game day that rolls over books
 * the whole team's daily wages as a debt the stall page settles
 * through the wallet (the wallets keep a single writer, so the store
 * never touches coins itself). Wages run during AFK days too — the
 * crew works, the crew is paid (mục 5.9).
 */
function applyWageRollover(state: StallUserState, today: string): StallUserState {
  const days = dayDiff(state.lastDay, today);
  if (days <= 0 || state.staff.length === 0) return state;
  const wages = dailyWageTotal(state.staff) * days;
  if (wages <= 0) return state;
  return { ...state, wageDebtXu: state.wageDebtXu + wages };
}

/** Day-boundary passes, in order: wages read the old lastDay first,
 * then spoilage stamps the new one. */
function prepare(state: StallUserState, today: string): StallUserState {
  return applySpoilage(applyWageRollover(state, today), today);
}

export function loadStallState(userId: string): StallUserState {
  const shape = loadAll();
  const today = todayKey();
  const existing = shape.byUser[userId];
  if (!existing) return emptyStallState(today);
  const rolled = prepare(withDefaults(existing, today), today);
  if (rolled !== existing) {
    shape.byUser[userId] = rolled;
    saveAll(shape);
  }
  return rolled;
}

function update(userId: string, fn: (draft: StallUserState) => StallUserState): StallUserState {
  const shape = loadAll();
  const today = todayKey();
  const current = withDefaults(shape.byUser[userId] ?? emptyStallState(today), today);
  // Every write also stamps the AFK clock (mục 5.9): the stall counts
  // as tended while any of its screens keep writing.
  const next = { ...fn(prepare(current, today)), lastSeenAt: Date.now() };
  shape.byUser[userId] = next;
  saveAll(shape);
  emit();
  return next;
}

/* ---------------- Gói H6 derived helpers ---------------- */

/** The staffer holding a role, if hired. */
export function staffOf(state: StallUserState, role: StaffRole): StaffMember | undefined {
  return state.staff.find((member) => member.role === role);
}

/**
 * The dishes actually on sale (mục 8.3): licensed dishes, narrowed to
 * the player's curated menu when they have one, always capped by the
 * stall level's menu size. Customers (live, delivery and AFK alike)
 * only ever order from this list.
 */
export function effectiveMenuRecipes(
  state: StallUserState,
  user: PublicUser,
  recipes: Recipe[],
): Recipe[] {
  const licensed = sellableRecipes(user, recipes);
  const cap = menuCapForLevel(state.stallLevel);
  if (state.menuIds === null) return licensed.slice(0, cap);
  const chosen = licensed.filter((recipe) => state.menuIds?.includes(recipe.id));
  return (chosen.length > 0 ? chosen : licensed).slice(0, cap);
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
  return update(userId, (draft) => {
    // Cold storage (Gói H6): the lot's expiry is fixed at purchase by
    // the gear the stall owns at that moment — fridge ×2, freezer ×4.
    const lot: IngredientLot = {
      id: `lot-${crypto.randomUUID()}`,
      ingredientId,
      qty,
      unitPrice,
      boughtDay: today,
      expiryDay: addDays(today, shelfLifeDaysFor(ingredientId, shelfLifeFactor(draft.gear))),
    };
    return { ...draft, lots: [...draft.lots, lot] };
  });
}

/**
 * One-time starter pack (anti soft-lock): the ingredients for two
 * batches of the player's cheapest licensed dish, granted free when a
 * licensed player is flat broke with an empty pantry. Cost basis is
 * today's market price, so the capital law still books them honestly.
 */
export function claimStarterPack(userId: string, recipe: Recipe): StallUserState {
  const today = todayKey();
  return update(userId, (draft) => {
    const lots: IngredientLot[] = recipe.ingredients.map((ref) => ({
      id: `lot-${crypto.randomUUID()}`,
      ingredientId: ref.ingredientId,
      qty: 2,
      unitPrice: dailyPriceFor(ref.ingredientId, today),
      boughtDay: today,
      expiryDay: addDays(today, shelfLifeDaysFor(ref.ingredientId, shelfLifeFactor(draft.gear))),
    }));
    return { ...draft, lots: [...draft.lots, ...lots], starterPackClaimed: true };
  });
}

/* ---------------- shift lifecycle ---------------- */

export function openShift(userId: string, now: number): StallUserState {
  return update(userId, (draft) => {
    if (draft.shift) return draft;
    const stars = stallStarsForExp(draft.exp);
    // Advertising (Gói H6): a shift opened while an ad runs draws a
    // bigger crowd (the faster arrivals are handled in the tick).
    const quota =
      draft.adUntil > now
        ? Math.round(shiftQuotaForStars(stars) * AD_QUOTA_FACTOR)
        : shiftQuotaForStars(stars);
    return {
      ...draft,
      customers: [],
      shift: {
        id: `shift-${crypto.randomUUID()}`,
        startedAt: now,
        endsAt: now + shiftDurationMs(stars),
        spawnQuota: quota,
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
  // Customers order from the on-sale menu only (Gói H6, mục 8.3):
  // licensed dishes beyond the level's menu cap are simply not sold.
  const menu = effectiveMenuRecipes(draft, user, recipes);
  if (menu.length === 0) return null;
  const stars = stallStarsForExp(draft.exp);
  const tier = rollTier(stars, Math.random(), draft.stallLevel >= 5 ? LEVEL5_VIP_BOOST : 1);
  const dish = pickDishForTier(tier, menu, Math.random());
  if (!dish) return null;
  const usedTables = new Set(
    draft.customers
      .filter((c) => !c.delivery && (c.state === 'waiting' || c.state === 'accepted'))
      .map((c) => c.tableIndex),
  );
  let tableIndex = 0;
  while (usedTables.has(tableIndex)) tableIndex += 1;
  // Picky customers (Gói H5, mục 6.3): a share of arrivals — growing
  // with the stall's stars — carry a special request the dish can
  // actually conflict with; the substitution options themselves are
  // derived from the recipe wherever they are displayed.
  const applicable = applicableRequestsFor(dish);
  let requestKind: RequestKind | undefined;
  if (applicable.length > 0 && Math.random() < pickyRateForStars(stars)) {
    requestKind = applicable[Math.floor(Math.random() * applicable.length)]?.kind;
  }
  return {
    id: `cust-${crypto.randomUUID()}`,
    tier,
    recipeId: dish.id,
    qty: rollQty(tier, stars, Math.random()),
    arrivedAt: now,
    // Decoration (ý tưởng 17): a pleasant yard buys patience.
    patienceMs: Math.round(
      patienceForTier(tier, Math.random()) * decorPatienceFactor(draft.decorIds),
    ),
    state: 'waiting',
    tableIndex,
    ...(requestKind ? { requestKind } : {}),
  };
}

/**
 * A delivery-channel order (Gói H6, mục 8.2): no table, no scene
 * presence — the order lives on the delivery board until the hired
 * server rides it out. Patience is road-length, not table-length.
 */
function spawnDeliveryCustomer(
  draft: StallUserState,
  user: PublicUser,
  recipes: Recipe[],
  now: number,
): StallCustomer | null {
  const menu = effectiveMenuRecipes(draft, user, recipes);
  if (menu.length === 0) return null;
  const stars = stallStarsForExp(draft.exp);
  const tier = rollTier(stars, Math.random(), draft.stallLevel >= 5 ? LEVEL5_VIP_BOOST : 1);
  const dish = pickDishForTier(tier, menu, Math.random());
  if (!dish) return null;
  return {
    id: `cust-${crypto.randomUUID()}`,
    tier,
    recipeId: dish.id,
    qty: rollQty(tier, stars, Math.random()),
    arrivedAt: now,
    patienceMs: Math.round(DELIVERY_PATIENCE_MS * (0.9 + Math.random() * 0.2)),
    state: 'waiting',
    tableIndex: -1,
    delivery: true,
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

    // Background pots (Gói H5): a pot whose simmer time is up lands on
    // the counter as a batch, eating its FIFO lots exactly like an
    // active cook. Pots finish even between shifts — the stove does
    // not care whether the shutters are open.
    const duePots = next.pots.filter((pot) => now >= pot.readyAt);
    if (duePots.length > 0) {
      let working = next;
      let landed = 0;
      for (const pot of duePots) {
        const recipe = recipes.find((r) => r.id === pot.recipeId);
        if (!recipe) continue;
        landed += 1;
        working = consumeToBatch(working, {
          recipe,
          qty: pot.qty,
          qualityScore: pot.qualityScore,
          level: pot.level,
          diagnosis: pot.diagnosis,
        });
      }
      next = { ...working, pots: next.pots.filter((pot) => now < pot.readyAt) };
      // The hired cook worked those pots (Gói H6): landings are orders.
      if (landed > 0 && staffOf(next, 'cook')) {
        next = {
          ...next,
          staff: next.staff.map((m) =>
            m.role === 'cook' ? { ...m, ordersDone: m.ordersDone + landed } : m,
          ),
        };
      }
    }

    const shift = next.shift;
    if (!shift) return next;

    // Crew work (Gói H6, mục 8.1) — the manager takes orders in, the
    // server carries ready dishes out. Both run BEFORE the patience
    // pass: a dish the server lands at the last second still saves
    // the order, exactly as if the player had tapped in time.
    const manager = staffOf(next, 'manager');
    if (manager) {
      let acceptedCount = 0;
      const mapped = next.customers.map((c) => {
        if (!c.delivery && c.state === 'waiting' && now - c.arrivedAt >= MANAGER_AUTO_ACCEPT_MS) {
          acceptedCount += 1;
          return { ...c, state: 'accepted' as const };
        }
        return c;
      });
      if (acceptedCount > 0) {
        next = {
          ...next,
          customers: mapped,
          staff: next.staff.map((m) =>
            m.role === 'manager' ? { ...m, ordersDone: m.ordersDone + acceptedCount } : m,
          ),
        };
      }
    }
    const server = staffOf(next, 'server');
    if (server && now - next.lastAutoServeAt >= serverAutoServeDelayMs(rankForOrders(server.ordersDone))) {
      const bestStars = bestStarsByRecipe(user);
      const candidates = next.customers
        .filter((c) => !c.delivery && c.state === 'accepted')
        .sort((a, b) => a.arrivedAt - b.arrivedAt);
      for (const customer of candidates) {
        const batch = next.batches.find(
          (b) =>
            b.recipeId === customer.recipeId &&
            b.qty === customer.qty &&
            qualityBandForLevel(b.level).sellable,
        );
        if (!batch) continue;
        const recipe = recipes.find((r) => r.id === customer.recipeId);
        if (!recipe) continue;
        const served = serveCore(next, customer, batch, bestStars.get(customer.recipeId) ?? 0, recipe, now);
        if (!served) continue;
        next = {
          ...served.state,
          lastAutoServeAt: now,
          pendingCreditXu: served.state.pendingCreditXu + served.result.totalXu,
          pendingCreditCok: served.state.pendingCreditCok + served.result.cok,
          staff: served.state.staff.map((m) =>
            m.role === 'server' ? { ...m, ordersDone: m.ordersDone + 1 } : m,
          ),
        };
        break;
      }
    }

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

    // Spawning. Seats come from the stall LEVEL since Gói H6 (mục
    // 8.3): size is bought, stars only bring the crowd's quality.
    const activeCount = next.customers.filter(
      (c) => !c.delivery && (c.state === 'waiting' || c.state === 'accepted'),
    ).length;
    const tables = tablesForLevel(next.stallLevel);
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
        // Rush hour (Gói H5, mục 5.8): the middle of the shift spawns
        // at less than half the base interval; the ends stay quiet.
        // Advertising and a gilded sign (Gói H6) pull the stream
        // faster still.
        const phase = shiftPhaseAt(next.shift, now);
        const pullFactor =
          (next.adUntil > now ? AD_SPAWN_FACTOR : 1) * decorSpawnFactor(next.decorIds);
        next = {
          ...next,
          customers: [...next.customers, customer],
          shift: {
            ...next.shift,
            spawned: next.shift.spawned + 1,
            nextSpawnAt:
              now + interval * spawnFactorForPhase(phase) * pullFactor * (0.7 + Math.random() * 0.6),
          },
        };
      } else {
        next = { ...next, shift: { ...next.shift, nextSpawnAt: now + 5000 } };
      }
    }

    // Delivery channel (Gói H6, mục 8.2): from stall level 4 a second
    // order stream trickles in beside the walk-ins, capped at two
    // open orders — the road crew is one server, not a fleet.
    if (next.shift && next.stallLevel >= DELIVERY_MIN_STALL_LEVEL) {
      if (next.nextDeliveryAt === 0) {
        next = { ...next, nextDeliveryAt: now + 45_000 };
      } else if (now >= next.nextDeliveryAt) {
        const activeDelivery = next.customers.filter(
          (c) => c.delivery && (c.state === 'waiting' || c.state === 'accepted'),
        ).length;
        let withOrder = next;
        if (activeDelivery < 2) {
          const deliveryCustomer = spawnDeliveryCustomer(next, user, recipes, now);
          if (deliveryCustomer) {
            withOrder = { ...next, customers: [...next.customers, deliveryCustomer] };
          }
        }
        next = {
          ...withOrder,
          nextDeliveryAt: now + Math.round(120_000 * (0.7 + Math.random() * 0.6)),
        };
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
  /** Gói H5: how the cook handled the order's special request. */
  requestOutcome?: CookedBatch['requestOutcome'];
}

/**
 * The one place a batch is born: consume its ingredients FIFO from the
 * pantry lots (the batch's real cost is what those lots actually cost —
 * mục 6.12) and put the batch on the counter. A failed run still eats
 * its ingredients: a spoiled batch is a lost cost, per the capital law.
 * Units missing from the pantry (the pantry was checked before the run;
 * this is only a safety net) are booked at today's market price. Used
 * by the active sell cook and by background pots alike (Gói H5).
 */
function consumeToBatch(draft: StallUserState, input: FinishCookInput): StallUserState {
  const today = todayKey();
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
  const batch: CookedBatch = {
    id: `batch-${crypto.randomUUID()}`,
    recipeId: input.recipe.id,
    qty: input.qty,
    qualityScore: input.qualityScore,
    level: input.level,
    diagnosis: [...input.diagnosis],
    cost,
    cookedAt: Date.now(),
    ...(input.requestOutcome ? { requestOutcome: input.requestOutcome } : {}),
  };
  return {
    ...draft,
    lots: lots.filter((lot) => lot.qty > 0),
    batches: [...draft.batches, batch],
  };
}

/** A finished active sell cook becomes a counter batch. */
export function finishCook(userId: string, input: FinishCookInput): CookedBatch {
  let batch: CookedBatch | null = null;
  update(userId, (draft) => {
    const next = consumeToBatch(draft, input);
    batch = next.batches[next.batches.length - 1] ?? null;
    return next;
  });
  if (!batch) throw new Error('finishCook produced no batch');
  return batch;
}

/**
 * Put an accepted order on a background pot (Gói H5): the pot simmers
 * in real time while the player cooks something else on the main
 * stove. Legal only when the order is accepted, the pantry covers the
 * batch, a pot slot is free, the order is not already simmering, and
 * no ready batch for it waits on the counter. The quality is rolled
 * now (lib/upgrades) and the lots are eaten when the pot lands.
 * Returns the started pot, or null when the start is not legal.
 */
export function startBackgroundPot(
  userId: string,
  user: PublicUser,
  customerId: string,
  recipes: Recipe[],
  now: number,
): BackgroundPot | null {
  let pot: BackgroundPot | null = null;
  update(userId, (draft) => {
    const customer = draft.customers.find((c) => c.id === customerId);
    if (!customer || customer.state !== 'accepted') return draft;
    if (draft.pots.some((p) => p.customerId === customerId)) return draft;
    if (draft.pots.length >= potCapacityFor(draft.upgrades.pot, draft.gear.extraStoves)) return draft;
    const recipe = recipes.find((r) => r.id === customer.recipeId);
    if (!recipe) return draft;
    if (!canCookBatch(draft, recipe, customer.qty)) return draft;
    const alreadyReady = draft.batches.some(
      (b) => b.recipeId === customer.recipeId && b.qty === customer.qty && b.level !== 'spoiled',
    );
    if (alreadyReady) return draft;
    const bestStars = bestStarsByRecipe(user).get(recipe.id) ?? 0;
    // Support hands and machines (Gói H6): a hired cook minds the pot
    // (faster, steadier — the 78 cap still rules), the dough mixer
    // speeds bánh-group pots. The player's own stove sets the base.
    const cook = staffOf(draft, 'cook');
    const cookMatch = cook ? specialtyMatches(cook.specialty, recipe) : false;
    const qualityScore = Math.min(
      78,
      rollBackgroundQuality(bestStars, draft.upgrades.stove, Math.random()) +
        (cook ? cookQualityBonus(rankForOrders(cook.ordersDone), cookMatch) : 0),
    );
    let durationMs = backgroundPotDurationMs(recipe.difficulty, draft.upgrades.stove);
    if (cook) {
      durationMs *= cookPotDurationFactor(rankForOrders(cook.ordersDone)) * (cookMatch ? 0.9 : 1);
    }
    if (draft.gear.mixer && dishGroupForRecipe(recipe) === 'banh') {
      durationMs *= MIXER_POT_FACTOR;
    }
    pot = {
      id: `pot-${crypto.randomUUID()}`,
      customerId,
      recipeId: recipe.id,
      qty: customer.qty,
      startedAt: now,
      readyAt: now + Math.round(durationMs),
      qualityScore,
      level: backgroundLevelFor(qualityScore),
      diagnosis: diagnoseBackgroundPot(qualityScore),
    };
    return { ...draft, pots: [...draft.pots, pot] };
  });
  return pot;
}

/**
 * Buy the next level of a kitchen line (Gói H5). Returns the price the
 * caller must deduct from the xu wallet through AuthContext (the
 * wallets keep a single writer), or null when the line is maxed.
 */
export function buyUpgrade(userId: string, kind: UpgradeKind): number | null {
  let paid: number | null = null;
  update(userId, (draft) => {
    const price = nextUpgradePrice(kind, draft.upgrades[kind]);
    if (price === null) return draft;
    paid = price;
    return { ...draft, upgrades: { ...draft.upgrades, [kind]: draft.upgrades[kind] + 1 } };
  });
  return paid;
}

export interface ServeResult {
  price: number;
  tip: number;
  totalXu: number;
  cok: number;
  exp: number;
}

/**
 * The one serve calculation (Gói H4, extended by H5/H6), pure on a
 * draft so the player's tap, the server's auto-serve and the delivery
 * ride all book identically:
 *   price = capital-law price × stall-level income factor (mục 6.12 →
 *           8.3, applied at the very end; level 1 is ×1.0, so the H4
 *           arithmetic is untouched for a starter stall);
 *   tip   = patience/quality tip, × the honoured-request factor (H5),
 *           × the cashier's speed factor and the flower decor (H6);
 *   fee   = delivery orders add their delivery fee on top;
 *   cok   = VIPs only, Đạt chuẩn or better; EXP by quality band.
 * Returns null when the serve is not legal (wrong dish, wrong
 * quantity, spoiled batch, customer already gone).
 */
function serveCore(
  draft: StallUserState,
  customer: StallCustomer,
  batch: CookedBatch,
  bestStars: number,
  recipe: Recipe,
  now: number,
): { state: StallUserState; result: ServeResult } | null {
  if (customer.state !== 'accepted' && customer.state !== 'waiting') return null;
  if (batch.recipeId !== customer.recipeId || batch.qty !== customer.qty) return null;
  const band = qualityBandForLevel(batch.level);
  if (!band.sellable) return null;

  const price = Math.round(
    priceForBatch({
      cost: batch.cost,
      grade: dishGradeFor(recipe),
      bestStars,
      level: batch.level,
    }) * incomeFactorForLevel(draft.stallLevel),
  );
  let tip = tipForBatch({
    price,
    level: batch.level,
    patienceLeftRatio: patienceLeftRatio(customer, now),
  });
  // A picky request honoured by the book tips extra (Gói H5, Phần 11:
  // the best tip comes when the order is fast AND right).
  if (batch.requestOutcome === 'ok') {
    tip = Math.round(tip * REQUEST_OK_TIP_FACTOR);
  }
  // Cashier on duty (Gói H6): a fast till reads as a bigger tip.
  const cashier = staffOf(draft, 'cashier');
  if (cashier) {
    tip = Math.round(
      tip * cashierTipFactor(rankForOrders(cashier.ordersDone), specialtyMatches(cashier.specialty, recipe)),
    );
  }
  tip = Math.round(tip * decorTipFactor(draft.decorIds));
  const fee = customer.delivery ? deliveryFeeFor(price) : 0;
  const cok = customer.tier === 'vip' ? cokForServe(batch.level) : 0;
  const exp = band.exp;
  const result: ServeResult = { price, tip, totalXu: price + tip + fee, cok, exp };

  const shift = draft.shift
    ? {
        ...draft.shift,
        revenueXu: draft.shift.revenueXu + result.totalXu,
        revenueCok: draft.shift.revenueCok + cok,
        servedOk: draft.shift.servedOk + (batch.level === 'perfect' || batch.level === 'standard' ? 1 : 0),
        servedPoor: draft.shift.servedPoor + (batch.level === 'good' || batch.level === 'burned' ? 1 : 0),
        expGained: draft.shift.expGained + exp,
      }
    : null;
  const state: StallUserState = {
    ...draft,
    exp: draft.exp + exp,
    totalServed: draft.totalServed + 1,
    staff: cashier
      ? draft.staff.map((m) => (m.role === 'cashier' ? { ...m, ordersDone: m.ordersDone + 1 } : m))
      : draft.staff,
    batches: draft.batches.filter((b) => b.id !== batch.id),
    customers: draft.customers.map((c) =>
      c.id === customer.id ? { ...c, state: 'served' as const, resolvedAt: now } : c,
    ),
    shift,
  };
  return { state, result };
}

/**
 * Serve a ready batch to its customer by hand. Returns the wallet
 * amounts for the caller to apply through AuthContext; null when the
 * serve is not legal. Delivery orders are NOT served here — they
 * need the server (serveDeliveryBatch).
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
    if (!customer || !batch || customer.delivery) return draft;
    const served = serveCore(draft, customer, batch, bestStars, recipe, now);
    if (!served) return draft;
    result = served.result;
    return served.state;
  });
  return result;
}

/**
 * Serve a delivery order (Gói H6): the hired server rides the dish
 * out and collects price + tip + delivery fee. Without a server on
 * staff there is nobody to ride — the serve is refused.
 */
export function serveDeliveryBatch(
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
    if (!customer || !batch || !customer.delivery) return draft;
    const server = staffOf(draft, 'server');
    if (!server) return draft;
    const served = serveCore(draft, customer, batch, bestStars, recipe, now);
    if (!served) return draft;
    result = served.result;
    return {
      ...served.state,
      staff: served.state.staff.map((m) =>
        m.role === 'server' ? { ...m, ordersDone: m.ordersDone + 1 } : m,
      ),
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

/* ---------------- Gói H6: staff (mục 8.1) ---------------- */

/**
 * Hire for a role. Hiring itself is free — the cost of a crew is the
 * daily wage (booked by the day rollover), exactly the plan's design:
 * wages are the recurring xu drain, not a one-off fee. The first hire
 * of any kind needs stall level 2 (mục 8.3); one person per role.
 */
export function hireStaff(userId: string, role: StaffRole): StaffMember | null {
  let hired: StaffMember | null = null;
  update(userId, (draft) => {
    if (draft.stallLevel < HIRE_MIN_STALL_LEVEL) return draft;
    if (draft.staff.some((member) => member.role === role)) return draft;
    hired = {
      id: `staff-${crypto.randomUUID()}`,
      role,
      ordersDone: 0,
      specialty: null,
      hiredDay: todayKey(),
    };
    return { ...draft, staff: [...draft.staff, hired] };
  });
  return hired;
}

/**
 * Train (or re-train) a staffer's specialty (đào tạo chuyên môn).
 * Returns the xu price for the caller to deduct, or null when the
 * training changes nothing.
 */
export function trainStaff(userId: string, staffId: string, group: DishGroup): number | null {
  let paid: number | null = null;
  update(userId, (draft) => {
    const member = draft.staff.find((m) => m.id === staffId);
    if (!member || member.specialty === group) return draft;
    paid = TRAINING_COST;
    return {
      ...draft,
      staff: draft.staff.map((m) => (m.id === staffId ? { ...m, specialty: group } : m)),
    };
  });
  return paid;
}

/* ---------------- Gói H6: gear, cards, decor, ads (mục 8.2) ----------------
 * Every purchase follows the buyUpgrade pattern: the store books the
 * goods first and reports the price, so the wallet is only charged
 * for something that actually landed. */

/** Buy a support gear item (fridge / freezer / slicer / mixer / bếp phụ). */
export function buyGear(userId: string, kind: GearKind): number | null {
  let paid: number | null = null;
  update(userId, (draft) => {
    if (kind === 'extraStove') {
      if (draft.gear.extraStoves >= MAX_EXTRA_STOVES) return draft;
      paid = GEAR_PRICES.extraStove;
      return { ...draft, gear: { ...draft.gear, extraStoves: draft.gear.extraStoves + 1 } };
    }
    if (draft.gear[kind]) return draft;
    paid = GEAR_PRICES[kind];
    return { ...draft, gear: { ...draft.gear, [kind]: true } };
  });
  return paid;
}

/** Buy one one-use card of a kind. Always lands (cards stack). */
export function buyCard(userId: string, kind: CardKind): number {
  let paid = 0;
  update(userId, (draft) => {
    paid = CARD_PRICES[kind];
    return { ...draft, cards: { ...draft.cards, [kind]: draft.cards[kind] + 1 } };
  });
  return paid;
}

/** Buy a decoration piece; owned pieces are placed on the scene at once. */
export function buyDecor(userId: string, kind: DecorKind): number | null {
  let paid: number | null = null;
  update(userId, (draft) => {
    if (draft.decorIds.includes(kind)) return draft;
    paid = DECOR_PRICES[kind];
    return { ...draft, decorIds: [...draft.decorIds, kind] };
  });
  return paid;
}

/** Run an advertising stretch: the crowd pulls faster and thicker. */
export function buyAd(userId: string, now: number): number {
  let paid = 0;
  update(userId, (draft) => {
    paid = AD_PRICE;
    return { ...draft, adUntil: Math.max(now, draft.adUntil) + AD_DURATION_MS };
  });
  return paid;
}

/* ---------------- Gói H6: using cards (mục 8.2) ---------------- */

function activeCustomer(draft: StallUserState, customerId: string): StallCustomer | undefined {
  const customer = draft.customers.find((c) => c.id === customerId);
  if (!customer || (customer.state !== 'waiting' && customer.state !== 'accepted')) return undefined;
  return customer;
}

/** Thẻ kiên nhẫn: +30 seconds on one customer's patience. */
export function usePatienceCard(userId: string, customerId: string): boolean {
  let used = false;
  update(userId, (draft) => {
    if (draft.cards.patience <= 0 || !activeCustomer(draft, customerId)) return draft;
    used = true;
    return {
      ...draft,
      cards: { ...draft.cards, patience: draft.cards.patience - 1 },
      customers: draft.customers.map((c) =>
        c.id === customerId ? { ...c, patienceMs: c.patienceMs + PATIENCE_CARD_MS } : c,
      ),
    };
  });
  return used;
}

/** Thẻ đóng băng: one customer's patience clock stops for a stretch. */
export function useFreezeCard(userId: string, customerId: string, now: number): boolean {
  let used = false;
  update(userId, (draft) => {
    if (draft.cards.freeze <= 0 || !activeCustomer(draft, customerId)) return draft;
    used = true;
    return {
      ...draft,
      cards: { ...draft.cards, freeze: draft.cards.freeze - 1 },
      customers: draft.customers.map((c) => {
        if (c.id !== customerId) return c;
        // Bank a previous, already-finished freeze before re-freezing.
        let banked = c.patienceBankedMs ?? 0;
        if (c.freezeStart !== undefined && c.freezeUntil !== undefined && now >= c.freezeUntil) {
          banked += c.freezeUntil - c.freezeStart;
        }
        return { ...c, patienceBankedMs: banked, freezeStart: now, freezeUntil: now + FREEZE_CARD_MS };
      }),
    };
  });
  return used;
}

/**
 * Thẻ đổi đơn: swap a hard order for the easiest other dish on the
 * menu. The customer's tier, quantity and patience stay — only the
 * dish (and any picky request tied to it) changes.
 */
export function useSwapCard(
  userId: string,
  customerId: string,
  user: PublicUser,
  recipes: Recipe[],
): boolean {
  let used = false;
  update(userId, (draft) => {
    const customer = activeCustomer(draft, customerId);
    if (draft.cards.swap <= 0 || !customer) return draft;
    const candidates = effectiveMenuRecipes(draft, user, recipes)
      .filter((recipe) => recipe.id !== customer.recipeId)
      .sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name));
    const target = candidates[0];
    if (!target) return draft;
    used = true;
    return {
      ...draft,
      cards: { ...draft.cards, swap: draft.cards.swap - 1 },
      customers: draft.customers.map((c) =>
        c.id === customerId ? { ...c, recipeId: target.id, requestKind: undefined } : c,
      ),
    };
  });
  return used;
}

/**
 * Thẻ nêm lại (mục 8.2, nối thẳng chẩn đoán vị mục 6.5): re-season a
 * counter batch whose diagnosis names a seasoning fault. The fault is
 * fixed, quality recovers a step (never to Hoàn hảo), the batch's
 * level is re-banded from its new score — its cost never changes, so
 * the rescue honestly raises the price the capital law will pay.
 */
export function useReseasonCard(userId: string, batchId: string): boolean {
  let used = false;
  update(userId, (draft) => {
    const batch = draft.batches.find((b) => b.id === batchId);
    if (draft.cards.reseason <= 0 || !batch || !isReseasonable(batch.diagnosis)) return draft;
    used = true;
    const qualityScore = Math.min(RESEASON_SCORE_CAP, batch.qualityScore + RESEASON_SCORE_GAIN);
    const diagnosis = batch.diagnosis.filter(
      (key) => key !== 'too-salty' && key !== 'too-bland' && key !== 'season-off',
    );
    return {
      ...draft,
      cards: { ...draft.cards, reseason: draft.cards.reseason - 1 },
      batches: draft.batches.map((b) =>
        b.id === batchId
          ? {
              ...b,
              qualityScore,
              level: qualityBandForScore(qualityScore).level,
              diagnosis: diagnosis.length > 0 ? diagnosis : ['balanced'],
            }
          : b,
      ),
    };
  });
  return used;
}

/* ---------------- Gói H6: market runner (mục 8.1) ---------------- */

/** True when the ingredient appears in any recipe of the group. */
function ingredientInGroup(ingredientId: string, group: DishGroup, recipes: Recipe[]): boolean {
  return recipes.some(
    (recipe) =>
      dishGroupForRecipe(recipe) === group &&
      recipe.ingredients.some((ref) => ref.ingredientId === ingredientId),
  );
}

/** The runner's unit price for an ingredient today (premium included). */
export function remoteUnitPriceFor(
  state: StallUserState,
  ingredientId: string,
  recipes: Recipe[],
  day: string,
): number | null {
  const runner = staffOf(state, 'runner');
  if (!runner) return null;
  const specialty =
    runner.specialty !== null && ingredientInGroup(ingredientId, runner.specialty, recipes);
  return Math.ceil(
    dailyPriceFor(ingredientId, day) *
      runnerPremiumFactor(rankForOrders(runner.ordersDone), specialty),
  );
}

/**
 * Order ingredients through the market runner: delivered to the
 * pantry at once, at the runner's premium — the lot's cost basis is
 * the premium price actually paid, so the capital law stays honest.
 * The runner NEVER buys unprompted (mục 5.9): this runs only when
 * the player places the order. Returns the total for the caller to
 * deduct through the wallet.
 */
export function remoteBuyIngredient(
  userId: string,
  ingredientId: string,
  qty: number,
  recipes: Recipe[],
): number | null {
  const today = todayKey();
  let total: number | null = null;
  update(userId, (draft) => {
    const unit = remoteUnitPriceFor(draft, ingredientId, recipes, today);
    if (unit === null || qty <= 0) return draft;
    total = unit * qty;
    const lot: IngredientLot = {
      id: `lot-${crypto.randomUUID()}`,
      ingredientId,
      qty,
      unitPrice: unit,
      boughtDay: today,
      expiryDay: addDays(today, shelfLifeDaysFor(ingredientId, shelfLifeFactor(draft.gear))),
    };
    return {
      ...draft,
      lots: [...draft.lots, lot],
      staff: draft.staff.map((m) =>
        m.role === 'runner' ? { ...m, ordersDone: m.ordersDone + 1 } : m,
      ),
    };
  });
  return total;
}

/* ---------------- Gói H6: stall level + menu (mục 8.3) ---------------- */

/**
 * Upgrade the stall one level. Conditions (stars, licensed dishes,
 * top-grade dish) are re-validated here; the xu cost is returned for
 * the caller to deduct. Reaching level 3 grants the level's extra
 * stove (bếp phụ) on top of any bought one, up to the stove cap.
 */
export function upgradeStall(userId: string, user: PublicUser, recipes: Recipe[]): number | null {
  let paid: number | null = null;
  update(userId, (draft) => {
    const status = upgradeStatusFor({
      level: draft.stallLevel,
      stars: stallStarsForExp(draft.exp),
      licensed: sellableRecipes(user, recipes),
    });
    if (!status.next || !status.ok) return draft;
    paid = status.next.cost;
    const nextLevel = status.next.level;
    return {
      ...draft,
      stallLevel: nextLevel,
      gear:
        nextLevel === 3
          ? { ...draft.gear, extraStoves: Math.min(MAX_EXTRA_STOVES, draft.gear.extraStoves + 1) }
          : draft.gear,
    };
  });
  return paid;
}

/**
 * Toggle a licensed dish on the curated on-sale menu. The menu can
 * never exceed the level cap and never drops its last dish.
 */
export function setMenuDish(
  userId: string,
  recipeId: string,
  on: boolean,
  user: PublicUser,
  recipes: Recipe[],
): boolean {
  let changed = false;
  update(userId, (draft) => {
    const licensed = sellableRecipes(user, recipes);
    if (!licensed.some((recipe) => recipe.id === recipeId)) return draft;
    const current = effectiveMenuRecipes(draft, user, recipes).map((recipe) => recipe.id);
    if (on) {
      if (current.includes(recipeId)) return draft;
      if (current.length >= menuCapForLevel(draft.stallLevel)) return draft;
      changed = true;
      return { ...draft, menuIds: [...current, recipeId] };
    }
    if (!current.includes(recipeId) || current.length <= 1) return draft;
    changed = true;
    return { ...draft, menuIds: current.filter((id) => id !== recipeId) };
  });
  return changed;
}

/* ---------------- Gói H6: Nồi Nồi skins (ý tưởng 16) ---------------- */

/** Buy a cok-priced skin. Returns the cok price, or null. */
export function buySkin(userId: string, skinId: string): number | null {
  let paid: number | null = null;
  update(userId, (draft) => {
    const skin = skinDef(skinId);
    if (skin.unlock.kind !== 'cok' || draft.ownedSkinIds.includes(skinId)) return draft;
    paid = skin.unlock.price;
    return { ...draft, ownedSkinIds: [...draft.ownedSkinIds, skinId] };
  });
  return paid;
}

/** Wear a skin the player has honestly unlocked. */
export function selectSkin(userId: string, skinId: string): boolean {
  let selected = false;
  update(userId, (draft) => {
    const skin = skinDef(skinId);
    if (
      !skinAvailable(skin, {
        stallLevel: draft.stallLevel,
        totalServed: draft.totalServed,
        ownedSkinIds: draft.ownedSkinIds,
      })
    ) {
      return draft;
    }
    selected = true;
    return { ...draft, noiNoiSkinId: skinId };
  });
  return selected;
}

/* ---------------- Gói H6: wallet settlement ---------------- */

/**
 * The page reports what it actually credited/paid through
 * AuthContext; the store clears exactly those amounts from the
 * pending books (crew credits in, wage debt out).
 */
export function acknowledgeWallet(
  userId: string,
  creditXu: number,
  creditCok: number,
  wagePaidXu: number,
): StallUserState {
  return update(userId, (draft) => ({
    ...draft,
    pendingCreditXu: Math.max(0, draft.pendingCreditXu - Math.max(0, creditXu)),
    pendingCreditCok: Math.max(0, draft.pendingCreditCok - Math.max(0, creditCok)),
    wageDebtXu: Math.max(0, draft.wageDebtXu - Math.max(0, wagePaidXu)),
  }));
}

/* ---------------- Gói H6: AFK settlement (mục 5.9) ---------------- */

/**
 * Settle the time since the stall was last tended. Runs on the stall
 * page's mount: a shift left open is finalized as live play first
 * (AFK never stacks on top of a shift), then — when the away span is
 * real — the crew's session is simulated honestly from the pantry:
 * staff-quality dishes (capped like background pots), FIFO costs, the
 * level's income factor, AFK efficiency pacing, and a hard stop the
 * moment no menu dish can be cooked any more. Revenue lands in the
 * pending credits for the page to pay through the wallet; the report
 * waits in state until the player reads it.
 */
export function settleAfk(
  userId: string,
  user: PublicUser,
  recipes: Recipe[],
  now: number,
): AfkReport | null {
  let report: AfkReport | null = null;
  update(userId, (draft) => {
    const lastSeen = draft.lastSeenAt;
    if (lastSeen <= 0 || draft.afkReport) return draft;
    let working = draft;
    let afkStart = lastSeen;
    if (draft.shift) {
      if (now < draft.shift.endsAt) return draft; // shift still live
      afkStart = Math.max(lastSeen, draft.shift.endsAt);
      working = finalizeShift(draft, now);
    }
    if (now - afkStart < AFK_MIN_AWAY_MS) return working;

    const menu = effectiveMenuRecipes(working, user, recipes);
    const spoiledWhileAway = working.spoiledNotices
      .filter((notice) => notice.day >= dayKeyOf(new Date(lastSeen)))
      .map((notice) => ({ ingredientId: notice.ingredientId, qty: notice.qty }));
    const essential = afkEssentialFor(working.staff);
    if (!essential.ok) {
      // No crew, no sales — but only report when there was something
      // to sell; a player without licenses has no stall to close.
      if (menu.length === 0) return working;
      report = {
        startedAt: afkStart,
        endedAt: now,
        revenueXu: 0,
        revenueCok: 0,
        servedCount: 0,
        dishes: [],
        spoiledLots: spoiledWhileAway,
        wasted: [],
        closedReason: 'staff',
      };
      return { ...working, afkReport: report };
    }
    if (menu.length === 0) return working;

    const stars = stallStarsForExp(working.exp);
    const efficiency = afkEfficiencyFor(working.staff);
    const interval = afkCustomerIntervalMs(stars, efficiency);
    const bestStars = bestStarsByRecipe(user);
    const cook = staffOf(working, 'cook');
    const dishQty = new Map<string, number>();
    const wastedMap = new Map<string, number>();
    let revenueXu = 0;
    let revenueCok = 0;
    let served = 0;
    let cooked = 0;
    let closedReason: 'time' | 'ingredients' = 'time';
    let simNow = afkStart;
    let iterations = 0;
    while (simNow < now && iterations < AFK_MAX_CUSTOMERS) {
      iterations += 1;
      simNow += Math.round(interval * (0.8 + Math.random() * 0.4));
      if (simNow > now) break;
      const cookable = menu.filter((recipe) => canCookBatch(working, recipe, 1));
      if (cookable.length === 0) {
        closedReason = 'ingredients';
        break;
      }
      const tier = rollTier(stars, Math.random(), working.stallLevel >= 5 ? LEVEL5_VIP_BOOST : 1);
      const dish = pickDishForTier(tier, cookable, Math.random());
      if (!dish) continue;
      const qty = rollQty(tier, stars, Math.random());
      if (!canCookBatch(working, dish, qty)) continue;
      const qualityScore = Math.min(
        78,
        rollBackgroundQuality(bestStars.get(dish.id) ?? 0, working.upgrades.stove, Math.random()) +
          (cook
            ? cookQualityBonus(rankForOrders(cook.ordersDone), specialtyMatches(cook.specialty, dish))
            : 0),
      );
      const level = backgroundLevelFor(qualityScore);
      const withBatch = consumeToBatch(working, {
        recipe: dish,
        qty,
        qualityScore,
        level,
        diagnosis: diagnoseBackgroundPot(qualityScore),
      });
      const batch = withBatch.batches[withBatch.batches.length - 1];
      if (!batch) continue;
      // AFK dishes never stock the counter: served (or lost) at once.
      working = { ...withBatch, batches: withBatch.batches.slice(0, -1) };
      cooked += 1;
      if (Math.random() < AFK_WALK_AWAY_RATE) {
        wastedMap.set(dish.id, (wastedMap.get(dish.id) ?? 0) + qty);
        continue;
      }
      const price = Math.round(
        priceForBatch({
          cost: batch.cost,
          grade: dishGradeFor(dish),
          bestStars: bestStars.get(dish.id) ?? 0,
          level,
        }) * incomeFactorForLevel(working.stallLevel),
      );
      const tip = Math.round(price * 0.1 * efficiency);
      revenueXu += price + tip;
      if (tier === 'vip') revenueCok += cokForServe(level);
      served += 1;
      dishQty.set(dish.id, (dishQty.get(dish.id) ?? 0) + qty);
    }

    // The crew worked what it cooked/served: cook on every batch,
    // cashier and manager on every served order (rank + wages follow).
    const bumpedStaff = working.staff.map((member) => {
      if (member.role === 'cook') return { ...member, ordersDone: member.ordersDone + cooked };
      if (member.role === 'cashier' || member.role === 'manager') {
        return { ...member, ordersDone: member.ordersDone + served };
      }
      return member;
    });
    report = {
      startedAt: afkStart,
      endedAt: now,
      revenueXu,
      revenueCok,
      servedCount: served,
      dishes: [...dishQty.entries()].map(([recipeId, qty]) => ({ recipeId, qty })),
      spoiledLots: spoiledWhileAway,
      wasted: [...wastedMap.entries()].map(([recipeId, qty]) => ({ recipeId, qty })),
      closedReason,
    };
    return {
      ...working,
      staff: bumpedStaff,
      pendingCreditXu: working.pendingCreditXu + revenueXu,
      pendingCreditCok: working.pendingCreditCok + revenueCok,
      totalServed: working.totalServed + served,
      afkReport: report,
    };
  });
  return report;
}

/** The player has read the AFK report; the cash box is emptied. */
export function dismissAfkReport(userId: string): StallUserState {
  return update(userId, (draft) => ({ ...draft, afkReport: null }));
}

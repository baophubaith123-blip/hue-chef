import type { CustomerTier } from '@/components/theme-d/assets';
import type { DiagnosisKey } from '@/features/stall/lib/diagnosis';
import type { RequestKind } from '@/features/stall/lib/substitutions';

/**
 * Sell-loop (vòng BÁN) state — Kế hoạch hợp nhất, Phần 5 + 6.
 * Everything here is per-player and persisted in localStorage under the
 * stall key; the learning loop's records (users store) are never touched
 * except the two wallets (xu already there, cok added beside it).
 */

export type { CustomerTier };

/** Five sell quality levels of a cooked batch (mục 6.5), best first. */
export type SellQualityLevel = 'perfect' | 'standard' | 'good' | 'burned' | 'spoiled';

/** One purchase lot in the pantry: real price paid, real purchase day —
 * the batch cost of a dish is the FIFO sum of its lots (mục 6.12). */
export interface IngredientLot {
  id: string;
  ingredientId: string;
  qty: number;
  /** Xu actually paid per unit on the purchase day. */
  unitPrice: number;
  /** Game day of purchase, yyyy-mm-dd. */
  boughtDay: string;
  /** Last game day the lot is still usable, yyyy-mm-dd. */
  expiryDay: string;
}

/** A cooked dish waiting on the counter to be served or discarded. */
export interface CookedBatch {
  id: string;
  recipeId: string;
  /** Portions in this batch (the order quantity it was cooked for). */
  qty: number;
  /** 0–100 quality score converted from the run's score ratio. */
  qualityScore: number;
  level: SellQualityLevel;
  /** Flavour diagnosis keys (features/stall/lib/diagnosis), worst first. */
  diagnosis: string[];
  /** Real ingredient cost of the batch in xu (FIFO lots). */
  cost: number;
  cookedAt: number;
  /**
   * How the batch handled its customer's special request (Gói H5,
   * mục 6.3): 'ok' = substituted by the book (tip bonus at serve),
   * 'wrong' / 'ignored' = the heavy quality penalty was already booked
   * into qualityScore at conversion time. Absent = the order carried
   * no special request.
   */
  requestOutcome?: 'ok' | 'wrong' | 'ignored';
}

export type StallCustomerState = 'waiting' | 'accepted' | 'served' | 'left';

/** A customer in the stall scene; the customer IS the order (mục 5.3). */
export interface StallCustomer {
  id: string;
  tier: CustomerTier;
  recipeId: string;
  qty: number;
  arrivedAt: number;
  patienceMs: number;
  state: StallCustomerState;
  /** Scene table slot (0-based) the customer occupies. */
  tableIndex: number;
  /**
   * Special request of a picky customer (Gói H5, mục 6.3): the cook
   * must substitute ingredients by the dish's substitution law. The
   * concrete options are derived from the recipe on demand
   * (lib/substitutions), so only the kind is stored. Absent = a
   * regular order with no request.
   */
  requestKind?: RequestKind;
  /** Set when the customer resolves (served / left) for the exit beat. */
  resolvedAt?: number;
}

export interface StallShift {
  id: string;
  startedAt: number;
  endsAt: number;
  /** How many customers this shift will receive in total. */
  spawnQuota: number;
  spawned: number;
  nextSpawnAt: number;
  revenueXu: number;
  revenueCok: number;
  /** Orders served at Đạt chuẩn or better. */
  servedOk: number;
  /** Orders served below Đạt chuẩn (Tốt / Cháy). */
  servedPoor: number;
  /** Orders lost to an empty patience bar during the shift. */
  lost: number;
  /** Customers still waiting when the shift closed. */
  unserved: number;
  /** Batches discarded as spoiled during the shift. */
  spoiledBatches: number;
  expGained: number;
}

export interface ShiftSummary extends StallShift {
  endedAt: number;
  starsBefore: number;
  starsAfter: number;
}

export interface SpoilageNotice {
  ingredientId: string;
  qty: number;
  /** Game day the lot was written off, yyyy-mm-dd. */
  day: string;
}

/**
 * A batch cooking itself on a background pot (Gói H5, ý tưởng 6):
 * while the player actively cooks one order on the main stove, a
 * background pot simmers another accepted order in real time. Its
 * quality is rolled when the pot starts — honest mid-tier cooking:
 * a background pot can reach Đạt chuẩn but never Hoàn hảo, so the
 * active stove stays the place for the best dishes.
 */
export interface BackgroundPot {
  id: string;
  customerId: string;
  recipeId: string;
  qty: number;
  startedAt: number;
  readyAt: number;
  /** 0–100 quality rolled at start (capped below Hoàn hảo). */
  qualityScore: number;
  level: SellQualityLevel;
  diagnosis: DiagnosisKey[];
}

/**
 * Kitchen equipment bought with xu (Gói H5, ý tưởng 5): levels per
 * line, 0 = the worn starter kit. Distinct from the H6 support gear
 * (fridge / freezer / machines / extra stove) — these three lines are
 * the cook's own tools: knife, stove fire, big pot.
 */
export interface KitchenUpgrades {
  /** Dao bếp — widens the tolerance of knife-work gestures. */
  knife: number;
  /** Bếp lửa — widens the fire zone; background pots simmer faster. */
  stove: number;
  /** Nồi lớn — each level adds one background pot slot. */
  pot: number;
}

export interface StallUserState {
  /** Cumulative stall EXP; stall stars derive from it (mục 6.7). */
  exp: number;
  lots: IngredientLot[];
  batches: CookedBatch[];
  /** Background pots currently simmering (Gói H5). */
  pots: BackgroundPot[];
  /** Kitchen equipment levels (Gói H5); absent on legacy records. */
  upgrades: KitchenUpgrades;
  shift: StallShift | null;
  customers: StallCustomer[];
  lastSummary: ShiftSummary | null;
  /** Spoilage written off on the latest day rollovers, newest last. */
  spoiledNotices: SpoilageNotice[];
  /** One-time starter ingredient pack already granted (anti soft-lock). */
  starterPackClaimed: boolean;
  /** Last game day the spoilage pass ran for, yyyy-mm-dd. */
  lastDay: string;
}

export function emptyStallState(day: string): StallUserState {
  return {
    exp: 0,
    lots: [],
    batches: [],
    pots: [],
    upgrades: { knife: 0, stove: 0, pot: 0 },
    shift: null,
    customers: [],
    lastSummary: null,
    spoiledNotices: [],
    starterPackClaimed: false,
    lastDay: day,
  };
}

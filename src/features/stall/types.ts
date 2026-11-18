import type { CustomerTier } from '@/components/theme-d/assets';

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

export interface StallUserState {
  /** Cumulative stall EXP; stall stars derive from it (mục 6.7). */
  exp: number;
  lots: IngredientLot[];
  batches: CookedBatch[];
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
    shift: null,
    customers: [],
    lastSummary: null,
    spoiledNotices: [],
    starterPackClaimed: false,
    lastDay: day,
  };
}

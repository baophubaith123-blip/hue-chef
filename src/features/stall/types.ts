import type { CustomerTier } from '@/components/theme-d/assets';
import type { DiagnosisKey } from '@/features/stall/lib/diagnosis';
import type { RequestKind } from '@/features/stall/lib/substitutions';
import type { CardKind, DecorKind, DishGroup, GearKind, StaffRole } from '@/features/stall/lib/support';

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
  /**
   * Gói H6: a delivery-channel order (mục 8.2). Delivery customers
   * never sit in the scene (tableIndex is −1); they live on the
   * delivery board, are cooked for like any order, and can only be
   * served by the hired server — somebody has to ride the road.
   */
  delivery?: boolean;
  /**
   * Gói H6 freeze card (mục 8.2): while now < freezeUntil the
   * patience clock stands still at freezeStart; afterwards the whole
   * frozen span is excluded from the elapsed time. patienceBankedMs
   * accumulates spans of earlier, already-finished freezes.
   */
  freezeStart?: number;
  freezeUntil?: number;
  patienceBankedMs?: number;
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
  /** Gói H7: a Night Festival shift (lib/festival) — faster spawns,
   * fatter tips, a cok bonus at closing. Absent = a normal shift. */
  festival?: boolean;
}

export interface ShiftSummary extends StallShift {
  endedAt: number;
  starsBefore: number;
  starsAfter: number;
  /** Gói H7: cok bonus a festival shift earned at closing (lib/festival). */
  festivalCokBonus?: number;
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

/* ---------------- Gói H6: support systems (Phần 8) ---------------- */

/** One hired staffer (mục 8.1). Rank derives from ordersDone. */
export interface StaffMember {
  id: string;
  role: StaffRole;
  /** Lifetime orders this staffer has worked — rank and wage follow. */
  ordersDone: number;
  /** Training specialty (đào tạo chuyên môn); null = untrained. */
  specialty: DishGroup | null;
  /** Game day the staffer was hired, yyyy-mm-dd. */
  hiredDay: string;
}

/**
 * Support gear (mục 8.2), distinct from the H5 kitchen lines: cold
 * storage stretches shelf life, the two machines feed the gesture
 * engine and the pots, extra stoves add parallel pots.
 */
export interface SupportGear {
  fridge: boolean;
  freezer: boolean;
  slicer: boolean;
  mixer: boolean;
  /** Extra stoves owned: one bought at the market, one granted at stall level 3. */
  extraStoves: number;
}

/** The return report of an AFK session (mục 5.9): what the crew sold,
 * what ran out, what spoiled or was wasted while the owner was away. */
export interface AfkReport {
  startedAt: number;
  endedAt: number;
  revenueXu: number;
  revenueCok: number;
  servedCount: number;
  /** Dishes sold, aggregated per recipe. */
  dishes: { recipeId: string; qty: number }[];
  /** Ingredient lots that expired during the absence. */
  spoiledLots: { ingredientId: string; qty: number }[];
  /** Batches cooked but lost to a walk-away customer. */
  wasted: { recipeId: string; qty: number }[];
  /** Why the stall stopped: the away time simply ran out, the pantry
   * ran dry, or the essential crew was never complete (stall closed). */
  closedReason: 'time' | 'ingredients' | 'staff';
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

  /* ---- Gói H6 fields (absent on legacy records; safe defaults) ---- */
  /** Stall SIZE level 1–5 (mục 8.3) — not the star reputation. */
  stallLevel: number;
  /** Hired crew, at most one per role. */
  staff: StaffMember[];
  gear: SupportGear;
  /** One-use rescue / re-season cards on hand, by kind. */
  cards: Record<CardKind, number>;
  /** Decoration owned and placed on the scene (ý tưởng 17). */
  decorIds: DecorKind[];
  /**
   * The player's chosen on-sale menu (recipe ids). Null = the first
   * menuCap licensed dishes, until the player curates their own.
   */
  menuIds: string[] | null;
  /** Advertising runs until this timestamp (0 = no ad running). */
  adUntil: number;
  /** Wages booked by day rollovers, waiting for the wallet to pay. */
  wageDebtXu: number;
  /**
   * Xu/cok earned by crew work (auto-serve, AFK) that the page still
   * has to credit through AuthContext — the wallets keep one writer.
   */
  pendingCreditXu: number;
  pendingCreditCok: number;
  /** Last moment the stall was tended; AFK measures from here. */
  lastSeenAt: number;
  /** Unread AFK return report, if the crew worked (or waited) away. */
  afkReport: AfkReport | null;
  /** Lifetime orders served at this stall (skin unlocks read it). */
  totalServed: number;
  /** Nồi Nồi skin currently worn + skins bought with cok. */
  noiNoiSkinId: string;
  ownedSkinIds: string[];
  /** Last time the server auto-served a dish (tick pacing). */
  lastAutoServeAt: number;
  /** Next moment a delivery order may arrive (0 = unscheduled). */
  nextDeliveryAt: number;
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
    stallLevel: 1,
    staff: [],
    gear: { fridge: false, freezer: false, slicer: false, mixer: false, extraStoves: 0 },
    cards: { patience: 0, swap: 0, freeze: 0, reseason: 0 },
    decorIds: [],
    menuIds: null,
    adUntil: 0,
    wageDebtXu: 0,
    pendingCreditXu: 0,
    pendingCreditCok: 0,
    lastSeenAt: 0,
    afkReport: null,
    totalServed: 0,
    noiNoiSkinId: 'mac-dinh',
    ownedSkinIds: [],
    lastAutoServeAt: 0,
    nextDeliveryAt: 0,
  };
}

export type { CardKind, DecorKind, GearKind };

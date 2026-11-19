import type { Recipe } from '@/data/types';

/**
 * Support systems (Kế hoạch hợp nhất, Phần 8 + Phần 11) — pure rules
 * for the people, gear and consumables that keep the stall earning:
 * staff with ranks and daily wages, storage/machine gear, one-use
 * rescue cards, advertising, decoration and Nồi Nồi skins.
 *
 * Every number here is a starting parameter for playtesting (Phần 11
 * spirit), kept in this one module so H10 can re-tune the whole
 * support economy from a single place.
 */

/* ---------------- dish groups (đào tạo chuyên môn, mục 8.1) ---------------- */

/**
 * The three training specialties. Recipe categories map onto them by
 * kitchen craft: 'bun' and 'com' are pot dishes (món nước), 'banh' and
 * 'nem' are wrapping / frying work (bánh), 'che' is its own sweet-soup
 * craft. Editor-made categories fall back to món nước.
 */
export type DishGroup = 'nuoc' | 'banh' | 'che';

export const DISH_GROUPS: DishGroup[] = ['nuoc', 'banh', 'che'];

export function dishGroupForRecipe(recipe: { category: string }): DishGroup {
  if (recipe.category === 'che') return 'che';
  if (recipe.category === 'banh' || recipe.category === 'nem') return 'banh';
  return 'nuoc';
}

/* ---------------- staff (mục 8.1) ---------------- */

export type StaffRole = 'cook' | 'server' | 'cashier' | 'runner' | 'manager';

export const STAFF_ROLES: StaffRole[] = ['cook', 'server', 'cashier', 'runner', 'manager'];

/** The first hire unlocks at stall level 2 (mục 8.3). */
export const HIRE_MIN_STALL_LEVEL = 2;

/** One of each role: the plan's đội hình is five positions, not an army. */
export const STAFF_PER_ROLE = 1;

/** Rank indexes: 0 học việc → 1 lành nghề → 2 kỳ cựu. */
export type StaffRank = 0 | 1 | 2;

/** Orders a staffer must work to reach lành nghề, then kỳ cựu. */
export const RANK_ORDER_THRESHOLDS = [20, 60];

export function rankForOrders(ordersDone: number): StaffRank {
  if (ordersDone >= RANK_ORDER_THRESHOLDS[1]) return 2;
  if (ordersDone >= RANK_ORDER_THRESHOLDS[0]) return 1;
  return 0;
}

/**
 * Base daily wage in xu per role (Phần 11: the whole team's wages
 * should run at roughly 15–25% of a stall's daily revenue — a full
 * học-việc team costs 200 xu/day, a kỳ-cựu team 440).
 */
export const STAFF_BASE_WAGE: Record<StaffRole, number> = {
  cook: 40,
  server: 35,
  cashier: 35,
  runner: 30,
  manager: 60,
};

export const RANK_WAGE_FACTOR: Record<StaffRank, number> = { 0: 1, 1: 1.5, 2: 2.2 };

export function wageFor(role: StaffRole, rank: StaffRank): number {
  return Math.round(STAFF_BASE_WAGE[role] * RANK_WAGE_FACTOR[rank]);
}

/** Xu charged per staffer per game day, summed over the whole team. */
export function dailyWageTotal(staff: { role: StaffRole; ordersDone: number }[]): number {
  return staff.reduce((sum, member) => sum + wageFor(member.role, rankForOrders(member.ordersDone)), 0);
}

/** Xu to set or change a staffer's specialty (đào tạo chuyên môn). */
export const TRAINING_COST = 150;

/* Staff effects — every effect is an engine/economy parameter, never a
 * score edit (same doctrine as skills and kitchen upgrades). */

/** Phụ bếp: background pots simmer faster in trained hands. */
export function cookPotDurationFactor(rank: StaffRank): number {
  return [0.85, 0.75, 0.65][rank] ?? 1;
}

/** Phụ bếp: steadier seasoning on background pots (cap 78 still rules). */
export function cookQualityBonus(rank: StaffRank, specialtyMatch: boolean): number {
  return rank * 3 + (specialtyMatch ? 4 : 0);
}

/** Thu ngân: faster checkout reads as bigger tips (mục 8.1). */
export function cashierTipFactor(rank: StaffRank, specialtyMatch: boolean): number {
  return 1 + [0.08, 0.15, 0.22][rank] + (specialtyMatch ? 0.05 : 0);
}

/** Người đi chợ hộ: remote orders carry a premium over market price. */
export function runnerPremiumFactor(rank: StaffRank, specialtyMatch: boolean): number {
  return [1.25, 1.2, 1.15][rank] - (specialtyMatch ? 0.05 : 0);
}

/** Nhân viên phục vụ: delay before the server auto-serves a ready dish. */
export function serverAutoServeDelayMs(rank: StaffRank): number {
  return [5000, 3500, 2000][rank] ?? 5000;
}

/** Quản lý quầy: a waiting order is auto-accepted after this long. */
export const MANAGER_AUTO_ACCEPT_MS = 12_000;

/* ---------------- gear (mục 8.2) ---------------- */

export type GearKind = 'fridge' | 'freezer' | 'slicer' | 'mixer' | 'extraStove';

export const GEAR_KINDS: GearKind[] = ['fridge', 'freezer', 'slicer', 'mixer', 'extraStove'];

export const GEAR_PRICES: Record<GearKind, number> = {
  fridge: 800,
  freezer: 2000,
  slicer: 600,
  mixer: 600,
  extraStove: 900,
};

/** Extra stoves a stall can run: one bought, one granted at level 3. */
export const MAX_EXTRA_STOVES = 2;

/**
 * Shelf-life multiplier of the cold storage (Phần 11): tủ lạnh ×2,
 * tủ đông ×4. Owning both still means ×4 — the freezer does the work.
 */
export function shelfLifeFactor(gear: { fridge: boolean; freezer: boolean }): number {
  if (gear.freezer) return 4;
  if (gear.fridge) return 2;
  return 1;
}

/** Máy nhồi bột: background pots of bánh-group dishes knead faster. */
export const MIXER_POT_FACTOR = 0.85;

/* ---------------- one-use cards (mục 8.2) ---------------- */

export type CardKind = 'patience' | 'swap' | 'freeze' | 'reseason';

export const CARD_KINDS: CardKind[] = ['patience', 'swap', 'freeze', 'reseason'];

export const CARD_PRICES: Record<CardKind, number> = {
  patience: 60,
  swap: 80,
  freeze: 100,
  reseason: 50,
};

/** Thẻ kiên nhẫn: +30 seconds on one customer's patience (mục 8.2). */
export const PATIENCE_CARD_MS = 30_000;

/** Thẻ đóng băng: one customer's patience stops draining this long. */
export const FREEZE_CARD_MS = 45_000;

/**
 * Thẻ nêm lại: re-seasoning a batch whose diagnosis names a seasoning
 * fault recovers this many quality points, capped below Hoàn hảo —
 * a rescued batch can reach Đạt chuẩn, never perfection.
 */
export const RESEASON_SCORE_GAIN = 15;
export const RESEASON_SCORE_CAP = 89;

/** Diagnosis keys a re-season card can fix (nối thẳng mục 6.5). */
export const RESEASONABLE_DIAGNOSIS = ['too-salty', 'too-bland', 'season-off'] as const;

export function isReseasonable(diagnosis: string[]): boolean {
  return diagnosis.some((key) => (RESEASONABLE_DIAGNOSIS as readonly string[]).includes(key));
}

/* ---------------- advertising (mục 8.2) ---------------- */

export const AD_PRICE = 150;
/** "Vài giờ" of game time: two real hours of livelier foot traffic. */
export const AD_DURATION_MS = 2 * 60 * 60 * 1000;
/** While an ad runs, customers arrive this much faster… */
export const AD_SPAWN_FACTOR = 0.6;
/** …and a shift opened under an ad receives this much more quota. */
export const AD_QUOTA_FACTOR = 1.3;

/* ---------------- decoration (ý tưởng 17, mục 5.6) ---------------- */

export type DecorKind = 'lanterns' | 'flowers' | 'goldSign' | 'plant';

export const DECOR_KINDS: DecorKind[] = ['lanterns', 'flowers', 'goldSign', 'plant'];

export const DECOR_PRICES: Record<DecorKind, number> = {
  lanterns: 150,
  flowers: 200,
  goldSign: 400,
  plant: 250,
};

/** Đèn lồng + cây cảnh make the yard pleasant: customers wait longer. */
export function decorPatienceFactor(decor: DecorKind[]): number {
  let factor = 1;
  if (decor.includes('lanterns')) factor += 0.05;
  if (decor.includes('plant')) factor += 0.05;
  return factor;
}

/** Chậu hoa at the tables: a small, steady tip lift. */
export function decorTipFactor(decor: DecorKind[]): number {
  return decor.includes('flowers') ? 1.05 : 1;
}

/** Biển hiệu sơn son draws the eye: customers arrive a little faster. */
export function decorSpawnFactor(decor: DecorKind[]): number {
  return decor.includes('goldSign') ? 0.92 : 1;
}

/* ---------------- Nồi Nồi skins (ý tưởng 16) ---------------- */

export type SkinUnlock =
  | { kind: 'free' }
  | { kind: 'level'; level: number }
  | { kind: 'cok'; price: number }
  | { kind: 'served'; count: number };

export interface NoiNoiSkinDef {
  id: string;
  /** Small badge shown on the mascot frame. */
  badge: string;
  /** Ring colour of the mascot frame (Theme D palette only). */
  ring: string;
  unlock: SkinUnlock;
}

/**
 * Skins are earned, never bought with real money (ý tưởng 16): the
 * festival looks open by stall level, long service, or cok saved from
 * VIP orders.
 */
export const NOI_NOI_SKINS: NoiNoiSkinDef[] = [
  { id: 'mac-dinh', badge: '🍲', ring: '#E9A23B', unlock: { kind: 'free' } },
  { id: 'non-la', badge: '🌾', ring: '#7A9A4D', unlock: { kind: 'level', level: 2 } },
  { id: 'hoa-le-hoi', badge: '🌸', ring: '#B03E26', unlock: { kind: 'cok', price: 3 } },
  { id: 'khan-dong', badge: '👑', ring: '#C9962E', unlock: { kind: 'cok', price: 5 } },
  { id: 'ky-cuu', badge: '✨', ring: '#8A5A2B', unlock: { kind: 'served', count: 50 } },
];

export function skinDef(skinId: string): NoiNoiSkinDef {
  return NOI_NOI_SKINS.find((skin) => skin.id === skinId) ?? NOI_NOI_SKINS[0];
}

/** Whether the player may wear a skin right now. */
export function skinAvailable(
  skin: NoiNoiSkinDef,
  progress: { stallLevel: number; totalServed: number; ownedSkinIds: string[] },
): boolean {
  switch (skin.unlock.kind) {
    case 'free':
      return true;
    case 'level':
      return progress.stallLevel >= skin.unlock.level;
    case 'served':
      return progress.totalServed >= skin.unlock.count;
    case 'cok':
      return progress.ownedSkinIds.includes(skin.id);
  }
}

/* ---------------- delivery channel (mục 8.2, cấp quầy 4) ---------------- */

/** The delivery channel opens at stall level 4 (mục 8.3). */
export const DELIVERY_MIN_STALL_LEVEL = 4;
/** Delivery customers wait longer than walk-ins — the road takes time. */
export const DELIVERY_PATIENCE_MS = 600_000;
/** Delivery fee: a flat call-out plus a share of the dish price. */
export const DELIVERY_FEE_FLAT = 10;
export const DELIVERY_FEE_RATIO = 0.15;

export function deliveryFeeFor(price: number): number {
  return DELIVERY_FEE_FLAT + Math.round(price * DELIVERY_FEE_RATIO);
}

/** Helper: does this recipe belong to a staffer's specialty group? */
export function specialtyMatches(specialty: DishGroup | null, recipe: Recipe): boolean {
  return specialty !== null && dishGroupForRecipe(recipe) === specialty;
}

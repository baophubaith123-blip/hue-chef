import type { GestureId } from '@/data/gesture-map';
import type { SkillBranchId, SkillTiers } from '@/features/skills/types';

/**
 * Chef skill tree — pure rules (Kế hoạch hợp nhất, mục 4.4).
 * The player earns 1 skill point per player level above level 1 and
 * spends points on four branches; each branch supports one group of
 * cooking moves in BOTH loops (the learning loop and the sell loop).
 * This module is pure: no storage, no React, no stall import — the
 * kitchen-upgrade levels arrive as plain numbers from the caller.
 */

export const SKILL_MAX_TIER = 5;

export const SKILL_BRANCH_IDS: SkillBranchId[] = ['knife', 'fire', 'seasoning', 'speed'];

/**
 * Gesture groups per branch (14 gestures covered by 3 branches; the
 * speed branch is global and has no gesture group of its own).
 * Gestures in no group ('day-nap', 'trang-tri') are never scaled.
 */
export const GESTURES_BY_BRANCH: Record<'knife' | 'fire' | 'seasoning', GestureId[]> = {
  knife: ['thai', 'cham-nhip', 'gap-tha', 'trang-tri'],
  fire: ['giu-lua', 'chien', 'xao', 'hap', 'luoc', 'day-nap'],
  seasoning: ['nem', 'rot', 'tron', 'khuay'],
};

export function emptySkillTiers(): SkillTiers {
  return { knife: 0, fire: 0, seasoning: 0, speed: 0 };
}

/**
 * Total skill points a player level is worth: 1 point per level above
 * level 1. Because the total is derived from the current level,
 * veteran players are credited retroactively for levels already held.
 */
export function skillPointsTotalForLevel(level: number): number {
  return Math.max(0, level - 1);
}

/** Points already spent: every unlocked tier costs exactly 1 point. */
/**
 * Points still unspent. Clamped at 0: tiers are spent from the level
 * total, and even if a stored record ever disagreed with the level
 * (hand-edited data, a future level rebalance), the balance a player
 * sees — and the unlock gate — never goes negative.
 */
export function skillPointsAvailable(level: number, tiers: SkillTiers): number {
  return Math.max(0, skillPointsTotalForLevel(level) - skillPointsSpent(tiers));
}

export function skillPointsSpent(tiers: SkillTiers): number {
  return tiers.knife + tiers.fire + tiers.seasoning + tiers.speed;
}

function branchOfGesture(gesture: GestureId): 'knife' | 'fire' | 'seasoning' | null {
  if (GESTURES_BY_BRANCH.knife.includes(gesture)) return 'knife';
  if (GESTURES_BY_BRANCH.fire.includes(gesture)) return 'fire';
  if (GESTURES_BY_BRANCH.seasoning.includes(gesture)) return 'seasoning';
  return null;
}

/**
 * Multiplier on a gesture's standard target-zone width.
 * Knife moves scale with the knife branch and the kitchen knife
 * upgrade; fire moves with the fire branch and the stove upgrade;
 * seasoning moves with the seasoning branch alone. The combined
 * factor is capped at 1.6 so zones never swallow the whole track.
 *
 * Support machines (Gói H6, mục 8.2) are distinct from the H5 kitchen
 * lines: the slicer (máy thái) widens only the slicing gesture it
 * replaces by hand, the dough mixer (máy nhồi bột) only the mixing
 * gesture — each a flat ×1.15 inside the same cap.
 */
export function gestureZoneScale(
  gesture: GestureId,
  tiers: SkillTiers,
  kitchen: { knife: number; stove: number },
  machines?: { slicer?: boolean; mixer?: boolean },
): number {
  const branch = branchOfGesture(gesture);
  let scale = 1;
  if (branch === 'knife') {
    scale = (1 + 0.06 * tiers.knife) * (1 + 0.1 * kitchen.knife);
  } else if (branch === 'fire') {
    scale = (1 + 0.06 * tiers.fire) * (1 + 0.1 * kitchen.stove);
  } else if (branch === 'seasoning') {
    scale = 1 + 0.06 * tiers.seasoning;
  }
  if (gesture === 'thai' && machines?.slicer) scale *= 1.15;
  if (gesture === 'tron' && machines?.mixer) scale *= 1.15;
  return Math.min(scale, 1.6);
}

/** Multiplier on every move's time budget (speed branch, global). */
export function gestureTimeScale(tiers: SkillTiers): number {
  return 1 + 0.05 * tiers.speed;
}

/** Multiplier on the seasoning bar's standard zone (seasoning branch). */
export function seasonZoneScale(tiers: SkillTiers): number {
  return 1 + 0.06 * tiers.seasoning;
}

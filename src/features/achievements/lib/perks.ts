import type { Achievement, AchievementPerk, PerkKind } from '@/data/types';
import type { ResolvedStageConfig } from '@/features/cooking/lib/stage-config';

export const PERK_KINDS: PerkKind[] = [
  'coin-bonus-pct',
  'xp-bonus-pct',
  'market-time-plus',
  'peek-cheaper',
  'catch-radius-plus',
  'season-zone-plus',
  'cook-time-plus',
  'finish-window-plus',
  'quiz-time-plus',
  'combo-shield',
  'quiz-second-chance',
];

/** The perk's value when it is of the requested kind, otherwise 0. */
export function perkValueOf(perk: AchievementPerk | null | undefined, kind: PerkKind): number {
  return perk && perk.kind === kind ? perk.value : 0;
}

/**
 * Resolve the active perk for a player: the perk of their single equipped
 * achievement, only when that achievement exists and is unlocked for them.
 */
export function resolveEquippedPerk(
  equippedAchievementId: string | null | undefined,
  achievements: Achievement[],
  isUnlocked: boolean,
): AchievementPerk | null {
  if (!equippedAchievementId || !isUnlocked) return null;
  const found = achievements.find((a) => a.id === equippedAchievementId);
  return found?.perk ?? null;
}

/**
 * Fold the stage-shaping perks into a resolved stage config. Time/reward
 * perks (cook time, coins, XP, quiz) are applied by their own owners.
 */
export function applyPerkToStageConfig(
  config: ResolvedStageConfig,
  perk: AchievementPerk | null | undefined,
): ResolvedStageConfig {
  if (!perk) return config;
  const next = { ...config };
  if (perk.kind === 'market-time-plus') {
    next.marketSeconds = config.marketSeconds + perk.value;
  } else if (perk.kind === 'peek-cheaper') {
    next.marketPeekCostSeconds = Math.max(0, config.marketPeekCostSeconds - perk.value);
  } else if (perk.kind === 'catch-radius-plus') {
    next.catchRadiusPx = Math.round(config.catchRadiusPx * (1 + perk.value / 100));
  } else if (perk.kind === 'finish-window-plus') {
    next.finishWindowScale = config.finishWindowScale * (1 + perk.value / 100);
  }
  return next;
}

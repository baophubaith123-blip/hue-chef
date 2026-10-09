import type { Achievement } from '@/data/types';
import type { PublicUser } from '@/features/auth/types';

export interface PlayerAchievementProgress {
  totalCookCount: number;
  cookCountByCategory: Record<string, number>;
  totalScore: number;
  perfectScoreCount: number;
  noMistakeCookCount: number;
  categoriesCooked: string[];
  allRecipesCooked: boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export interface AchievementContextValue {
  allAchievements: Achievement[];
  unlockedForUser: (userId: string) => UnlockedAchievement[];
  isUnlocked: (userId: string, achievementId: string) => boolean;
  checkAndUnlockForUser: (user: PublicUser, progress: Partial<PlayerAchievementProgress>) => Achievement[];
  getProgressPct: (user: PublicUser, achievementId: Achievement['id'], progress: Partial<PlayerAchievementProgress>) => number;
}

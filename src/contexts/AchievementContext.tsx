import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import { SEED_ACHIEVEMENTS } from '@/data/achievements';
import { getRecipeById } from '@/data/recipes';
import type { Achievement, RecipeCategory } from '@/data/types';
import { findUserById, loadUsers, saveUsers, updateStoredUserById } from '@/features/auth/store';
import type { CookedRecipeEntry, PublicUser } from '@/features/auth/types';
import type {
  AchievementContextValue,
  PlayerAchievementProgress,
  UnlockedAchievement,
} from '@/features/achievements/types';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

const AchievementContext = createContext<AchievementContextValue | null>(null);

interface AchievementStore {
  byUser: Record<string, UnlockedAchievement[]>;
}

function emptyStore(): AchievementStore {
  return { byUser: {} };
}

function loadStore(): AchievementStore {
  const stored = getJsonStorage<AchievementStore>(STORAGE_KEYS.achievements);
  if (!stored || typeof stored !== 'object' || !stored.byUser) {
    setJsonStorage(STORAGE_KEYS.achievements, emptyStore());
    return emptyStore();
  }
  return stored;
}

function saveStore(store: AchievementStore): void {
  setJsonStorage(STORAGE_KEYS.achievements, store);
}

function getCookedEntries(user: PublicUser): CookedRecipeEntry[] {
  if (!user || !Array.isArray(user.cookedRecipes)) return [];
  return user.cookedRecipes;
}

function getRecipeIds(entries: CookedRecipeEntry[]): string[] {
  return entries.map((e) => e.recipeId);
}

function countByCategoryFromEntries(entries: CookedRecipeEntry[], category?: RecipeCategory): number {
  if (!category) return entries.length;
  let count = 0;
  for (const entry of entries) {
    if (entry.category === category) count += 1;
  }
  return count;
}

function categoriesFromEntries(entries: CookedRecipeEntry[]): Set<RecipeCategory> {
  const set = new Set<RecipeCategory>();
  for (const entry of entries) {
    if (entry.category) {
      set.add(entry.category as RecipeCategory);
    }
  }
  return set;
}

function sumTotalScore(entries: CookedRecipeEntry[]): number {
  let total = 0;
  for (const entry of entries) {
    total += Number(entry.score) || 0;
  }
  return total;
}

function countPerfectScore(entries: CookedRecipeEntry[], extraPerfectCount?: number): number {
  let count = 0;
  for (const entry of entries) {
    if (entry.stars === 5) count += 1;
  }
  return count + (extraPerfectCount ?? 0);
}

function evaluate(
  achievement: Achievement,
  user: PublicUser,
  progress: Partial<PlayerAchievementProgress>,
): { unlocked: boolean; pct: number; current: number; target: number } {
  const cond = achievement.condition;
  const entries = getCookedEntries(user);
  const recipeIds = getRecipeIds(entries);

  switch (cond.type) {
    case 'cook_count': {
      const count = cond.category
        ? countByCategoryFromEntries(entries, cond.category)
        : recipeIds.length;
      const target = cond.count;
      if (target === 0) return { unlocked: true, pct: 100, current: count, target };
      const pct = Math.min(100, Math.round((count / target) * 100));
      return { unlocked: count >= target, pct, current: count, target };
    }
    case 'perfect_score': {
      const count = countPerfectScore(entries, progress.perfectScoreCount ?? 0);
      const target = 1;
      const pct = Math.min(100, count * 100);
      return { unlocked: count >= target, pct, current: count, target };
    }
    case 'no_mistakes': {
      const progressCount = progress.noMistakeCookCount ?? 0;
      const target = cond.count || 1;
      const pct = Math.min(100, Math.round((progressCount / target) * 100));
      return { unlocked: progressCount >= target, pct, current: progressCount, target };
    }
    case 'all_categories': {
      const cookedCategories = categoriesFromEntries(entries);
      const categories: RecipeCategory[] = ['bun', 'com', 'banh', 'che', 'nem'];
      const total = categories.length;
      for (const c of categories) cookedCategories.has(c);
      const current = cookedCategories.size;
      const pct = Math.min(100, Math.round((current / total) * 100));
      return { unlocked: current >= total, pct, current, target: total };
    }
    case 'score_threshold': {
      const storedTotal = sumTotalScore(entries);
      const added = progress.totalScore ?? 0;
      const score = storedTotal + added;
      const target = cond.score;
      const pct = Math.min(100, Math.round((score / target) * 100));
      return { unlocked: score >= target, pct, current: score, target };
    }
    case 'level': {
      const lvl = user.level ?? 1;
      const target = cond.level;
      const pct = Math.min(100, Math.round((lvl / target) * 100));
      return { unlocked: lvl >= target, pct, current: lvl, target };
    }
    case 'perfect_count': {
      // Entries already include the just-finished cook (see CookingPage),
      // so count entries only — adding progress.perfectScoreCount would double-count.
      const count = countPerfectScore(entries, 0);
      const target = cond.count;
      const pct = Math.min(100, Math.round((count / target) * 100));
      return { unlocked: count >= target, pct, current: count, target };
    }
    case 'cook_difficulty': {
      let count = 0;
      for (const entry of entries) {
        const recipe = getRecipeById(entry.recipeId);
        if (recipe && recipe.difficulty >= cond.difficulty) count += 1;
      }
      const target = cond.count;
      const pct = Math.min(100, Math.round((count / target) * 100));
      return { unlocked: count >= target, pct, current: count, target };
    }
  }
}

export function AchievementProvider({ children }: { children: ReactNode }) {
  const unlockedForUser = useCallback((userId: string): UnlockedAchievement[] => {
    const store = loadStore();
    return store.byUser[userId] ?? [];
  }, []);

  const isUnlocked = useCallback(
    (userId: string, achievementId: string) => {
      const list = unlockedForUser(userId);
      return list.some((u) => u.id === achievementId);
    },
    [unlockedForUser],
  );

  const checkAndUnlockForUser = useCallback(
    (user: PublicUser, progress: Partial<PlayerAchievementProgress>): Achievement[] => {
      const store = loadStore();
      const current = new Set((store.byUser[user.id] ?? []).map((a) => a.id));
      const unlockedNow: Achievement[] = [];
      for (const achievement of SEED_ACHIEVEMENTS) {
        if (current.has(achievement.id)) continue;
        const { unlocked } = evaluate(achievement, user, progress);
        if (unlocked) {
          unlockedNow.push(achievement);
          current.add(achievement.id);
        }
      }
      if (unlockedNow.length > 0) {
        const entries = Array.from(current).map(
          (id) =>
            ({
              id,
              unlockedAt: new Date().toISOString(),
            }) satisfies UnlockedAchievement,
        );
        store.byUser[user.id] = entries;
        saveStore(store);

        const users = loadUsers();
        const stored = findUserById(users, user.id);
        if (stored) {
          const patched = updateStoredUserById(users, user.id, {
            unlockedAchievements: entries.map((e) => e.id),
          });
          saveUsers(patched);
        }
      }
      return unlockedNow;
    },
    [],
  );

  const getProgressPct = useCallback(
    (user: PublicUser, achievementId: string, progress: Partial<PlayerAchievementProgress>): number => {
      const achievement = SEED_ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!achievement) return 0;
      return evaluate(achievement, user, progress).pct;
    },
    [],
  );

  const getProgressDetail = useCallback(
    (
      user: PublicUser,
      achievementId: string,
      progress: Partial<PlayerAchievementProgress>,
    ): { current: number; target: number; pct: number } => {
      const achievement = SEED_ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!achievement) return { current: 0, target: 0, pct: 0 };
      const result = evaluate(achievement, user, progress);
      return { current: result.current, target: result.target, pct: result.pct };
    },
    [],
  );

  const value = useMemo<AchievementContextValue>(
    () => ({
      allAchievements: SEED_ACHIEVEMENTS,
      unlockedForUser,
      isUnlocked,
      checkAndUnlockForUser,
      getProgressPct,
      getProgressDetail,
    }),
    [unlockedForUser, isUnlocked, checkAndUnlockForUser, getProgressPct, getProgressDetail],
  );

  return <AchievementContext.Provider value={value}>{children}</AchievementContext.Provider>;
}

export function useAchievements(): AchievementContextValue {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievements must be used within AchievementProvider');
  return ctx;
}

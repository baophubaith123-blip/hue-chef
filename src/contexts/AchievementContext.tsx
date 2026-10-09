import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import { SEED_ACHIEVEMENTS } from '@/data/achievements';
import type { Achievement, RecipeCategory } from '@/data/types';
import { findUserById, loadUsers, saveUsers } from '@/features/auth/store';
import type { PublicUser } from '@/features/auth/types';
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

function countByCategory(cookedIds: string[], recipesById: Map<string, Achievement>): Record<string, number> {
  void recipesById;
  void cookedIds;
  return {};
}

function evaluate(
  achievement: Achievement,
  user: PublicUser,
  progress: Partial<PlayerAchievementProgress>,
  recipesCategoryById: Map<string, RecipeCategory | undefined>,
): { unlocked: boolean; pct: number } {
  const cond = achievement.condition;
  const cookedIds = progress.allRecipesCooked
    ? []
    : (user.cookedRecipes ?? []);
  const categoryCount = (cat?: RecipeCategory) => {
    if (!cat) return cookedIds.length;
    let count = 0;
    for (const id of cookedIds) {
      if (recipesCategoryById.get(id) === cat) count += 1;
    }
    return count;
  };

  switch (cond.type) {
    case 'cook_count': {
      const count = categoryCount(cond.category);
      const target = cond.count;
      if (target === 0) return { unlocked: true, pct: 100 };
      const pct = Math.min(100, Math.round((count / target) * 100));
      return { unlocked: count >= target, pct };
    }
    case 'perfect_score': {
      const count = progress.perfectScoreCount ?? 0;
      return { unlocked: count >= 1, pct: Math.min(100, count * 100) };
    }
    case 'no_mistakes': {
      const count = progress.noMistakeCookCount ?? 0;
      const target = cond.count || 1;
      const pct = Math.min(100, Math.round((count / target) * 100));
      return { unlocked: count >= target, pct };
    }
    case 'all_categories': {
      const cooked = new Set<string>();
      for (const id of cookedIds) {
        const c = recipesCategoryById.get(id);
        if (c) cooked.add(c);
      }
      const categories: RecipeCategory[] = ['bun', 'com', 'banh', 'che', 'nem'];
      const total = categories.length;
      const pct = Math.min(100, Math.round((cooked.size / total) * 100));
      return { unlocked: cooked.size >= total, pct };
    }
    case 'score_threshold': {
      const score = progress.totalScore ?? 0;
      const target = cond.score;
      const pct = Math.min(100, Math.round((score / target) * 100));
      return { unlocked: score >= target, pct };
    }
    case 'level': {
      const lvl = user.level ?? 1;
      const target = cond.level;
      const pct = Math.min(100, Math.round((lvl / target) * 100));
      return { unlocked: lvl >= target, pct };
    }
  }
  void countByCategory;
}

export function AchievementProvider({ children }: { children: ReactNode }) {
  const recipesCategoryById = useMemo(() => {
    const map = new Map<string, RecipeCategory | undefined>();
    const rStore = getJsonStorage<{ id: string; category: RecipeCategory }[]>(STORAGE_KEYS.recipes);
    if (Array.isArray(rStore)) {
      for (const r of rStore) map.set(r.id, r.category);
    }
    return map;
  }, []);

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
        const { unlocked } = evaluate(achievement, user, progress, recipesCategoryById);
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
          stored.unlockedAchievements = entries.map((e) => e.id);
          saveUsers(users);
        }
      }
      return unlockedNow;
    },
    [recipesCategoryById],
  );

  const getProgressPct = useCallback(
    (user: PublicUser, achievementId: string, progress: Partial<PlayerAchievementProgress>): number => {
      const achievement = SEED_ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!achievement) return 0;
      return evaluate(achievement, user, progress, recipesCategoryById).pct;
    },
    [recipesCategoryById],
  );

  const value = useMemo<AchievementContextValue>(
    () => ({
      allAchievements: SEED_ACHIEVEMENTS,
      unlockedForUser,
      isUnlocked,
      checkAndUnlockForUser,
      getProgressPct,
    }),
    [unlockedForUser, isUnlocked, checkAndUnlockForUser, getProgressPct],
  );

  return <AchievementContext.Provider value={value}>{children}</AchievementContext.Provider>;
}

export function useAchievements(): AchievementContextValue {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievements must be used within AchievementProvider');
  return ctx;
}

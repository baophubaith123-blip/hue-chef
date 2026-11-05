import { SEED_USERS } from '@/data/users';
import type { CookedRecipeEntry, StoredUser } from '@/features/auth/types';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

function isLegacyCookedId(entry: unknown): entry is string {
  return typeof entry === 'string';
}

function migrateCookedRecipes(raw: unknown[] | undefined): CookedRecipeEntry[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (isLegacyCookedId(item)) {
      return {
        recipeId: item,
        recipeName: 'Công thức cũ',
        score: 0,
        stars: 1 as const,
        timeUsed: 0,
        cookedAt: new Date().toISOString(),
        image: '',
      };
    }
    if (
      item &&
      typeof item === 'object' &&
      'recipeId' in (item as Record<string, unknown>)
    ) {
      return item as CookedRecipeEntry;
    }
    return {
      recipeId: String(item),
      recipeName: 'Công thức cũ',
      score: 0,
      stars: 1 as const,
      timeUsed: 0,
      cookedAt: new Date().toISOString(),
      image: '',
    };
  });
}

export function loadUsers(): StoredUser[] {
  const stored = getJsonStorage<StoredUser[]>(STORAGE_KEYS.users);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    setJsonStorage(STORAGE_KEYS.users, SEED_USERS);
    return SEED_USERS.map((user) => ({ ...user }));
  }
  const migrated = stored.map((u) => ({
    ...u,
    // Seed accounts used external DiceBear avatars; when that host is
    // unreachable they render as broken images, so fall back to initials.
    avatar: typeof u.avatar === 'string' && u.avatar.includes('api.dicebear.com') ? '' : u.avatar,
    level: typeof u.level === 'number' ? u.level : 1,
    exp: typeof u.exp === 'number' ? u.exp : 0,
    maxExp: typeof u.maxExp === 'number' ? u.maxExp : 1000,
    cookedRecipes: migrateCookedRecipes(u.cookedRecipes as unknown[] | undefined),
    unlockedAchievements: Array.isArray(u.unlockedAchievements)
      ? (u.unlockedAchievements as string[])
      : [],
    warningCount: typeof u.warningCount === 'number' ? u.warningCount : 0,
  }));
  // Merge in any seed accounts this browser predates (e.g. the 40 leaderboard
  // players) without touching progress already stored for existing users.
  const knownIds = new Set(migrated.map((u) => u.id));
  const knownEmails = new Set(migrated.map((u) => u.email.toLowerCase()));
  const newcomers = SEED_USERS.filter(
    (u) => !knownIds.has(u.id) && !knownEmails.has(u.email.toLowerCase()),
  );
  if (newcomers.length > 0) {
    const merged = [...migrated, ...newcomers.map((u) => ({ ...u }))];
    setJsonStorage(STORAGE_KEYS.users, merged);
    return merged;
  }
  return migrated;
}

export function saveUsers(users: StoredUser[]): void {
  setJsonStorage(STORAGE_KEYS.users, users);
}

export function findUserByEmail(users: StoredUser[], email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return users.find((user) => user.email.toLowerCase() === normalized);
}

export function findUserById(users: StoredUser[], id: string): StoredUser | undefined {
  return users.find((user) => user.id === id);
}

export function updateStoredUserById(
  users: StoredUser[],
  userId: string,
  patch: Partial<StoredUser>,
): StoredUser[] {
  return users.map((u) => (u.id === userId ? { ...u, ...patch } : u));
}

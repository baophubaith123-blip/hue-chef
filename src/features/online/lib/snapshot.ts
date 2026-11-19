import { findUserById, loadUsers, saveUsers, updateStoredUserById } from '@/features/auth/store';
import type { CookedRecipeEntry } from '@/features/auth/types';
import type { EventsUserState } from '@/features/events/types';
import type { SkillTiers } from '@/features/skills/types';
import type { StallUserState } from '@/features/stall/types';
import type { ProgressSnapshot } from '@/features/online/types';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

/**
 * Progress snapshots (Gói H9, mục 9.3): the whole syncable progress
 * of one local player, built from — and applied back to — the very
 * stores offline play already uses. The profile slice mirrors the
 * users store record; stall / events / skills travel as their whole
 * per-user state, read and written through their byUser storage
 * shapes, so the sync layer never reaches inside game logic.
 */

interface ByUserShape<T> {
  byUser: Record<string, T>;
}

function readByUser<T>(key: string, userId: string): T | null {
  const raw = getJsonStorage<ByUserShape<T>>(key);
  if (!raw || typeof raw !== 'object' || typeof raw.byUser !== 'object' || raw.byUser === null) {
    return null;
  }
  return raw.byUser[userId] ?? null;
}

function writeByUser<T>(key: string, userId: string, value: T | null): void {
  const raw = getJsonStorage<ByUserShape<T>>(key);
  const shape: ByUserShape<T> =
    raw && typeof raw === 'object' && typeof raw.byUser === 'object' && raw.byUser !== null
      ? raw
      : { byUser: {} };
  if (value === null) {
    delete shape.byUser[userId];
  } else {
    shape.byUser[userId] = value;
  }
  setJsonStorage(key, shape);
}

export function buildSnapshot(localUserId: string, updatedAt: number): ProgressSnapshot | null {
  const user = findUserById(loadUsers(), localUserId);
  if (!user) return null;
  return {
    version: 1,
    updatedAt,
    profile: {
      name: user.name,
      avatar: user.avatar,
      level: user.level ?? 1,
      exp: user.exp ?? 0,
      maxExp: user.maxExp ?? 1000,
      coins: user.coins ?? 0,
      totalCoinsEarned: user.totalCoinsEarned ?? 0,
      cok: user.cok ?? 0,
      ownedRecipeIds: [...(user.ownedRecipeIds ?? [])],
      cookedRecipes: [...(user.cookedRecipes ?? [])],
      unlockedAchievements: [...(user.unlockedAchievements ?? [])],
      sellLicenses: [...(user.sellLicenses ?? [])],
      equippedAchievementId: user.equippedAchievementId ?? null,
    },
    stall: readByUser<StallUserState>(STORAGE_KEYS.stall, localUserId),
    events: readByUser<EventsUserState>(STORAGE_KEYS.events, localUserId),
    skills: readByUser<SkillTiers>(STORAGE_KEYS.skills, localUserId),
  };
}

function unionStrings(base: string[], other: string[]): string[] {
  const seen = new Set(base);
  const out = [...base];
  for (const item of other) {
    if (!seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function cookedKey(entry: CookedRecipeEntry): string {
  return `${entry.recipeId}|${entry.cookedAt}`;
}

function unionCooked(
  base: CookedRecipeEntry[],
  other: CookedRecipeEntry[],
): CookedRecipeEntry[] {
  const byKey = new Map<string, CookedRecipeEntry>();
  for (const entry of other) byKey.set(cookedKey(entry), entry);
  // Base is written last: on a key collision the newer side's record
  // (the base is the snapshot with the newer updatedAt) wins.
  for (const entry of base) byKey.set(cookedKey(entry), entry);
  return [...byKey.values()].sort((a, b) => {
    if (a.cookedAt !== b.cookedAt) return a.cookedAt < b.cookedAt ? -1 : 1;
    return a.recipeId < b.recipeId ? -1 : a.recipeId > b.recipeId ? 1 : 0;
  });
}

/**
 * Merge law (luật hợp nhất) — two devices, one player:
 * — base = the snapshot with the newer updatedAt (ties keep local):
 *   it donates the profile's identity/progress fields and the whole
 *   stall / events / skills states;
 * — money NEVER shrinks because an old device synced late: coins,
 *   cok and totalCoinsEarned take the MAX of both sides;
 * — history only grows: cookedRecipes merge by recipeId|cookedAt,
 *   ownedRecipeIds / sellLicenses / unlockedAchievements merge as
 *   sets;
 * — updatedAt of the result is the max of both.
 */
export function mergeSnapshots(
  local: ProgressSnapshot,
  remote: ProgressSnapshot,
): ProgressSnapshot {
  const base = remote.updatedAt > local.updatedAt ? remote : local;
  const other = base === local ? remote : local;
  return {
    version: 1,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    profile: {
      ...base.profile,
      coins: Math.max(local.profile.coins, remote.profile.coins),
      cok: Math.max(local.profile.cok, remote.profile.cok),
      totalCoinsEarned: Math.max(
        local.profile.totalCoinsEarned,
        remote.profile.totalCoinsEarned,
      ),
      cookedRecipes: unionCooked(base.profile.cookedRecipes, other.profile.cookedRecipes),
      ownedRecipeIds: unionStrings(base.profile.ownedRecipeIds, other.profile.ownedRecipeIds),
      sellLicenses: unionStrings(base.profile.sellLicenses, other.profile.sellLicenses),
      unlockedAchievements: unionStrings(
        base.profile.unlockedAchievements,
        other.profile.unlockedAchievements,
      ),
    },
    stall: base.stall,
    events: base.events,
    skills: base.skills,
  };
}

/**
 * Write a snapshot back into the local stores: the profile slice
 * lands on the users record (every other user untouched), and the
 * stall / events / skills slices land in their byUser shapes (again
 * per-user — a null slice clears that user's entry, matching the
 * snapshot exactly).
 */
export function applySnapshot(localUserId: string, snapshot: ProgressSnapshot): void {
  const profile = snapshot.profile;
  const users = updateStoredUserById(loadUsers(), localUserId, {
    name: profile.name,
    avatar: profile.avatar,
    level: profile.level,
    exp: profile.exp,
    maxExp: profile.maxExp,
    coins: profile.coins,
    totalCoinsEarned: profile.totalCoinsEarned,
    cok: profile.cok,
    ownedRecipeIds: [...profile.ownedRecipeIds],
    cookedRecipes: [...profile.cookedRecipes],
    unlockedAchievements: [...profile.unlockedAchievements],
    sellLicenses: [...profile.sellLicenses],
    equippedAchievementId: profile.equippedAchievementId,
  });
  saveUsers(users);
  writeByUser<StallUserState>(STORAGE_KEYS.stall, localUserId, snapshot.stall);
  writeByUser<EventsUserState>(STORAGE_KEYS.events, localUserId, snapshot.events);
  writeByUser<SkillTiers>(STORAGE_KEYS.skills, localUserId, snapshot.skills);
}

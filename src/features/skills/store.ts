import { useSyncExternalStore } from 'react';

import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';
import {
  SKILL_BRANCH_IDS,
  SKILL_MAX_TIER,
  emptySkillTiers,
  skillPointsAvailable,
} from '@/features/skills/lib/skills';
import type { SkillBranchId, SkillTiers } from '@/features/skills/types';

/**
 * Skill-tree store (Kế hoạch hợp nhất, mục 4.4): one localStorage
 * record per player, following the same byUser pattern as the stall
 * store. All rules live in features/skills/lib; this module owns
 * persistence and the single unlock transition only. Points are never
 * stored — the total is derived from the player level, so unlocking
 * only ever writes the tiers themselves.
 */

interface SkillsStoreShape {
  byUser: Record<string, SkillTiers>;
}

function clampTier(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(SKILL_MAX_TIER, Math.max(0, Math.floor(value)));
}

/** Coerce an untrusted stored record into valid tiers (0..max, missing = 0). */
function sanitizeTiers(raw: unknown): SkillTiers {
  if (!raw || typeof raw !== 'object') return emptySkillTiers();
  const record = raw as Record<string, unknown>;
  const tiers = emptySkillTiers();
  for (const branch of SKILL_BRANCH_IDS) {
    tiers[branch] = clampTier(record[branch]);
  }
  return tiers;
}

function loadAll(): SkillsStoreShape {
  const raw = getJsonStorage<SkillsStoreShape>(STORAGE_KEYS.skills);
  if (!raw || typeof raw !== 'object' || typeof raw.byUser !== 'object' || raw.byUser === null) {
    return { byUser: {} };
  }
  return raw;
}

function saveAll(shape: SkillsStoreShape): void {
  setJsonStorage(STORAGE_KEYS.skills, shape);
}

export function loadSkillTiers(userId: string): SkillTiers {
  const shape = loadAll();
  return sanitizeTiers(shape.byUser[userId]);
}

function update(userId: string, fn: (draft: SkillTiers) => SkillTiers): SkillTiers {
  const shape = loadAll();
  const current = sanitizeTiers(shape.byUser[userId]);
  const next = fn(current);
  shape.byUser[userId] = next;
  saveAll(shape);
  emit();
  return next;
}

/* ---------------- subscription (useSyncExternalStore) ---------------- */

const listeners = new Set<() => void>();
let cache: { userId: string; tiers: SkillTiers } | null = null;

function emit(): void {
  cache = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(userId: string): SkillTiers {
  if (cache && cache.userId === userId) return cache.tiers;
  const tiers = loadSkillTiers(userId);
  cache = { userId, tiers };
  return tiers;
}

export function useSkills(userId: string | null): SkillTiers | null {
  return useSyncExternalStore(
    subscribe,
    () => (userId ? snapshot(userId) : null),
    () => null,
  );
}

/* ---------------- unlock ---------------- */

/**
 * Spend 1 skill point on the next tier of a branch. Legal only while
 * the branch is below the max tier and the player still has unspent
 * points (total from level − already spent ≥ 1). Returns false and
 * writes nothing when the unlock is not legal.
 */
export function unlockSkillTier(
  userId: string,
  branch: SkillBranchId,
  playerLevel: number,
): boolean {
  const current = loadSkillTiers(userId);
  if (current[branch] >= SKILL_MAX_TIER) return false;
  const available = skillPointsAvailable(playerLevel, current);
  if (available < 1) return false;
  update(userId, (draft) => ({ ...draft, [branch]: draft[branch] + 1 }));
  return true;
}

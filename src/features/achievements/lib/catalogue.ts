import { SEED_ACHIEVEMENTS } from '@/data/achievements';
import type { Achievement } from '@/data/types';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

/**
 * The admin achievement catalogue lives in its OWN storage keys so it can
 * never collide with the player unlock store (`hue-chef-achievements`,
 * owned by AchievementContext). Admin edits are stored as overrides of the
 * seed catalogue plus a deleted-ids list; the effective catalogue players
 * see is the merge of all three.
 */
export function loadAchievementOverrides(): Achievement[] {
  const data = getJsonStorage<Achievement[]>(STORAGE_KEYS.adminAchievements);
  return Array.isArray(data) ? data : [];
}

export function saveAchievementOverrides(list: Achievement[]): void {
  setJsonStorage(STORAGE_KEYS.adminAchievements, list);
}

export function loadDeletedAchievementIds(): string[] {
  const data = getJsonStorage<string[]>(STORAGE_KEYS.adminAchievementsDeleted);
  return Array.isArray(data) ? data : [];
}

export function saveDeletedAchievementIds(ids: string[]): void {
  setJsonStorage(STORAGE_KEYS.adminAchievementsDeleted, ids);
}

export function mergeAchievementCatalogue(): Achievement[] {
  const deleted = new Set(loadDeletedAchievementIds());
  const overrides = loadAchievementOverrides();
  const overrideById = new Map(overrides.map((a) => [a.id, a]));
  const merged: Achievement[] = [];
  for (const seed of SEED_ACHIEVEMENTS) {
    if (deleted.has(seed.id)) continue;
    merged.push(overrideById.get(seed.id) ?? seed);
    overrideById.delete(seed.id);
  }
  for (const extra of overrideById.values()) {
    if (!deleted.has(extra.id)) merged.push(extra);
  }
  return merged;
}

/**
 * Editor-submitted achievements live in their own store with a review
 * status. They only join the player catalogue when an admin approves them
 * (AdminContext copies the achievement into the overrides store), mirroring
 * the recipe draft → pending → approved flow.
 */
export type EditorAchievementStatus = 'pending' | 'approved' | 'rejected';

export interface EditorAchievementSubmission {
  achievement: Achievement;
  status: EditorAchievementStatus;
  submittedBy: string;
  submittedAt: string;
  reviewedAt?: string;
}

export function loadEditorAchievementSubmissions(): EditorAchievementSubmission[] {
  const data = getJsonStorage<EditorAchievementSubmission[]>(STORAGE_KEYS.editorAchievements);
  return Array.isArray(data) ? data : [];
}

export function saveEditorAchievementSubmissions(list: EditorAchievementSubmission[]): void {
  setJsonStorage(STORAGE_KEYS.editorAchievements, list);
}

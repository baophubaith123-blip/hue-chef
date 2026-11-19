import type { CookedRecipeEntry } from '@/features/auth/types';
import type { EventsUserState } from '@/features/events/types';
import type { SkillTiers } from '@/features/skills/types';
import type { StallUserState } from '@/features/stall/types';

/**
 * Gói H9 — Online arena contracts (Kế hoạch hợp nhất, mục 9.3 + Phần 10).
 * The online layer is strictly additive: local accounts, local stores
 * and offline play never depend on anything in this feature. Every type
 * here describes data that crosses the wire to Supabase (anon key only,
 * RLS-guarded — see supabase/migrations).
 */

/** A row of the public player directory (online_profiles). */
export interface OnlineProfile {
  id: string;
  displayName: string;
  level: number;
}

/** One finished stage of a recorded run, with its wall-clock stamp. */
export interface GhostStage {
  /** Run stage key: market | catch | cook | season | finish | quiz. */
  key: string;
  /** Banked points of that stage (lib/score scale, rescaled parts). */
  score: number;
  /** Milliseconds from run start until this stage completed. */
  atMs: number;
}

/**
 * A recorded run replayed as the opponent's "ghost" (ý tưởng 8): the
 * challenger's score unfolds stage by stage while the answerer cooks.
 */
export interface GhostRun {
  totalScore: number;
  stars: number;
  durationMs: number;
  stages: GhostStage[];
  recordedAt: string;
}

export type ChallengeStatus = 'pending' | 'done';

/** One asynchronous duel (challenges table). */
export interface Challenge {
  id: string;
  challengerId: string;
  opponentId: string;
  recipeId: string;
  status: ChallengeStatus;
  challengerScore: number;
  challengerGhost: GhostRun;
  opponentScore: number | null;
  opponentGhost: GhostRun | null;
  /** Null while pending, and null again on a draw once done. */
  winnerId: string | null;
  createdAt: string;
  completedAt: string | null;
}

/** One weekly-tournament board row (tournament_entries table). */
export interface TournamentEntry {
  weekKey: string;
  userId: string;
  displayName: string;
  recipeId: string;
  score: number;
  stars: number;
  submittedAt: string;
}

/** The public, read-only picture of another player's stall. */
export interface StallVisit {
  userId: string;
  displayName: string;
  stallLevel: number;
  stars: number;
  decorIds: string[];
  menuIds: string[];
  updatedAt: string;
}

/** The profile slice of a progress snapshot — mirrors StoredUser. */
export interface SnapshotProfile {
  name: string;
  avatar: string;
  level: number;
  exp: number;
  maxExp: number;
  coins: number;
  totalCoinsEarned: number;
  cok: number;
  ownedRecipeIds: string[];
  cookedRecipes: CookedRecipeEntry[];
  unlockedAchievements: string[];
  sellLicenses: string[];
  equippedAchievementId: string | null;
}

/**
 * The whole syncable progress of one local player (progress_snapshots
 * .snapshot). Stall/events/skills travel as their whole per-user state,
 * exactly as the local stores keep them — the sync layer never reaches
 * inside game logic (mục 9.3).
 */
export interface ProgressSnapshot {
  version: 1;
  /** Epoch ms of the newest local change folded into this snapshot. */
  updatedAt: number;
  profile: SnapshotProfile;
  stall: StallUserState | null;
  events: EventsUserState | null;
  skills: SkillTiers | null;
}

/** The local link between a device account and an online account. */
export interface OnlineLink {
  onlineId: string;
  email: string;
  displayName: string;
  lastSyncAt: number | null;
}

/** A duel run waiting to be played or answered from the duels page. */
export interface DuelSession {
  mode: 'create' | 'answer';
  recipeId: string;
  /** Create mode: who will receive the challenge. */
  opponentId?: string;
  opponentName?: string;
  /** Answer mode: the challenge being answered + its ghost. */
  challengeId?: string;
  ghost?: GhostRun;
}

/** Per-local-user online state (storage key hue-chef-online). */
export interface OnlineUserState {
  link: OnlineLink | null;
  duelSession: DuelSession | null;
}

export type SyncStatus =
  | 'unconfigured'
  | 'signed-out'
  | 'synced'
  | 'error';

export interface SyncResult {
  status: SyncStatus;
  at: number;
}

import type { SupabaseClient } from '@supabase/supabase-js';

import { AppError } from '@/lib/errors';
import { decideWinner } from '@/features/online/lib/ghost';
import { getSupabase } from '@/features/online/lib/supabase';
import { isTournamentOpen } from '@/features/online/lib/tournament';
import type {
  Challenge,
  GhostRun,
  OnlineProfile,
  StallVisit,
  TournamentEntry,
} from '@/features/online/types';

/**
 * Online API (Gói H9): every call to the dedicated Supabase project
 * goes through here. Contract:
 * — unconfigured (no env) → AppError ONLINE_UNCONFIGURED;
 * — a call that needs an account without a session → ONLINE_SIGNED_OUT;
 * — any PostgREST / auth failure (including the tables not existing
 *   yet) → an AppError whose code names the failed operation, so the
 *   UI can degrade to offline play instead of crashing.
 * Rows cross the wire in snake_case and are mapped to the camelCase
 * contracts of types.ts here, narrowing unknown data field by field
 * (no `any`, per AGENTS.md).
 */

/* ---------------- narrowing helpers ---------------- */

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function strField(rec: Record<string, unknown>, key: string, fallback = ''): string {
  const value = rec[key];
  return typeof value === 'string' ? value : fallback;
}

function numField(rec: Record<string, unknown>, key: string, fallback = 0): number {
  const value = rec[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nullableNumField(rec: Record<string, unknown>, key: string): number | null {
  const value = rec[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function nullableStrField(rec: Record<string, unknown>, key: string): string | null {
  const value = rec[key];
  return typeof value === 'string' ? value : null;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function parseGhost(value: unknown): GhostRun {
  const rec = asRecord(value);
  if (!rec) return { totalScore: 0, stars: 0, durationMs: 0, stages: [], recordedAt: '' };
  const rawStages = Array.isArray(rec.stages) ? rec.stages : [];
  return {
    totalScore: numField(rec, 'totalScore'),
    stars: numField(rec, 'stars'),
    durationMs: numField(rec, 'durationMs'),
    stages: rawStages
      .map((stage) => asRecord(stage))
      .filter((stage): stage is Record<string, unknown> => stage !== null)
      .map((stage) => ({
        key: strField(stage, 'key'),
        score: numField(stage, 'score'),
        atMs: numField(stage, 'atMs'),
      })),
    recordedAt: strField(rec, 'recordedAt'),
  };
}

function parseNullableGhost(value: unknown): GhostRun | null {
  if (value === null || value === undefined) return null;
  return parseGhost(value);
}

/* ---------------- row mappers ---------------- */

function mapProfile(row: unknown): OnlineProfile | null {
  const rec = asRecord(row);
  if (!rec) return null;
  const id = strField(rec, 'id');
  if (!id) return null;
  return { id, displayName: strField(rec, 'display_name'), level: numField(rec, 'level', 1) };
}

function mapChallenge(row: unknown): Challenge | null {
  const rec = asRecord(row);
  if (!rec) return null;
  const id = strField(rec, 'id');
  if (!id) return null;
  return {
    id,
    challengerId: strField(rec, 'challenger_id'),
    opponentId: strField(rec, 'opponent_id'),
    recipeId: strField(rec, 'recipe_id'),
    status: rec.status === 'done' ? 'done' : 'pending',
    challengerScore: numField(rec, 'challenger_score'),
    challengerGhost: parseGhost(rec.challenger_ghost),
    opponentScore: nullableNumField(rec, 'opponent_score'),
    opponentGhost: parseNullableGhost(rec.opponent_ghost),
    winnerId: nullableStrField(rec, 'winner_id'),
    createdAt: strField(rec, 'created_at'),
    completedAt: nullableStrField(rec, 'completed_at'),
  };
}

function mapTournamentEntry(row: unknown): TournamentEntry | null {
  const rec = asRecord(row);
  if (!rec) return null;
  const userId = strField(rec, 'user_id');
  if (!userId) return null;
  return {
    weekKey: strField(rec, 'week_key'),
    userId,
    displayName: strField(rec, 'display_name'),
    recipeId: strField(rec, 'recipe_id'),
    score: numField(rec, 'score'),
    stars: numField(rec, 'stars'),
    submittedAt: strField(rec, 'submitted_at'),
  };
}

function mapStallVisit(row: unknown): StallVisit | null {
  const rec = asRecord(row);
  if (!rec) return null;
  const userId = strField(rec, 'user_id');
  if (!userId) return null;
  return {
    userId,
    displayName: strField(rec, 'display_name'),
    stallLevel: numField(rec, 'stall_level', 1),
    stars: numField(rec, 'stars', 1),
    decorIds: strArray(rec.decor_ids),
    menuIds: strArray(rec.menu_ids),
    updatedAt: strField(rec, 'updated_at'),
  };
}

/* ---------------- session plumbing ---------------- */

function requireClient(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new AppError('Online features are not configured on this build.', 'ONLINE_UNCONFIGURED');
  }
  return client;
}

interface OnlineIdentity {
  userId: string;
  email: string;
}

async function requireSessionUser(client: SupabaseClient): Promise<OnlineIdentity> {
  const { data, error } = await client.auth.getSession();
  if (error) {
    throw new AppError(`Could not read the online session: ${error.message}`, 'SESSION_LOAD_FAILED');
  }
  const user = data.session?.user;
  if (!user) {
    throw new AppError('No online account is signed in.', 'ONLINE_SIGNED_OUT');
  }
  return { userId: user.id, email: user.email ?? '' };
}

function requestFailed(operation: string, code: string, message: string): AppError {
  return new AppError(`${operation} failed: ${message}`, code);
}

/* ---------------- auth ---------------- */

export async function signUpOnline(
  email: string,
  password: string,
  displayName: string,
): Promise<{ userId: string; email: string; needsConfirmation: boolean }> {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) {
    throw new AppError(`Sign-up failed: ${error.message}`, 'ONLINE_AUTH_FAILED');
  }
  const user = data.user;
  if (!user) {
    throw new AppError('Sign-up failed: no account was returned.', 'ONLINE_AUTH_FAILED');
  }
  const needsConfirmation = !data.session;
  if (data.session) {
    // Best effort: the directory row is (re)ensured by syncNow on
    // every sync, so a failure here (e.g. tables not created yet)
    // must not fail the sign-up itself.
    try {
      await client
        .from('online_profiles')
        .insert({ id: user.id, display_name: displayName, level: 1 });
    } catch {
      // ignored — syncNow owns this row.
    }
  }
  return { userId: user.id, email: user.email ?? email, needsConfirmation };
}

export async function signInOnline(
  email: string,
  password: string,
): Promise<{ userId: string; email: string }> {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new AppError(`Sign-in failed: ${error.message}`, 'ONLINE_AUTH_FAILED');
  }
  const user = data.user;
  if (!user) {
    throw new AppError('Sign-in failed: no account was returned.', 'ONLINE_AUTH_FAILED');
  }
  return { userId: user.id, email: user.email ?? email };
}

export async function signOutOnline(): Promise<void> {
  const client = requireClient();
  const { error } = await client.auth.signOut();
  if (error) {
    throw new AppError(`Sign-out failed: ${error.message}`, 'ONLINE_AUTH_FAILED');
  }
}

export async function currentOnlineUser(): Promise<OnlineIdentity | null> {
  const client = requireClient();
  const { data, error } = await client.auth.getSession();
  if (error) {
    throw new AppError(`Could not read the online session: ${error.message}`, 'SESSION_LOAD_FAILED');
  }
  const user = data.session?.user;
  if (!user) return null;
  return { userId: user.id, email: user.email ?? '' };
}

/* ---------------- directory ---------------- */

export async function fetchDirectory(): Promise<OnlineProfile[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('online_profiles')
    .select('id, display_name, level')
    .order('display_name', { ascending: true });
  if (error) {
    throw requestFailed('Loading the player directory', 'DIRECTORY_LOAD_FAILED', error.message);
  }
  const rows: unknown = data;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => mapProfile(row))
    .filter((profile): profile is OnlineProfile => profile !== null);
}

/* ---------------- challenges (duels) ---------------- */

export async function createChallenge(
  opponentId: string,
  recipeId: string,
  ghost: GhostRun,
): Promise<Challenge> {
  const client = requireClient();
  const me = await requireSessionUser(client);
  const { data, error } = await client
    .from('challenges')
    .insert({
      challenger_id: me.userId,
      opponent_id: opponentId,
      recipe_id: recipeId,
      status: 'pending',
      challenger_score: ghost.totalScore,
      challenger_ghost: ghost,
    })
    .select()
    .single();
  if (error) {
    throw requestFailed('Creating the challenge', 'CHALLENGE_CREATE_FAILED', error.message);
  }
  const challenge = mapChallenge(data as unknown);
  if (!challenge) {
    throw new AppError('Creating the challenge failed: malformed response.', 'CHALLENGE_CREATE_FAILED');
  }
  return challenge;
}

export async function fetchChallenges(onlineId: string): Promise<Challenge[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('challenges')
    .select('*')
    .or(`challenger_id.eq.${onlineId},opponent_id.eq.${onlineId}`)
    .order('created_at', { ascending: false });
  if (error) {
    throw requestFailed('Loading challenges', 'CHALLENGE_LOAD_FAILED', error.message);
  }
  const rows: unknown = data;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => mapChallenge(row))
    .filter((challenge): challenge is Challenge => challenge !== null);
}

export async function submitChallengeAnswer(
  challengeId: string,
  ghost: GhostRun,
): Promise<Challenge> {
  const client = requireClient();
  const me = await requireSessionUser(client);
  const { data: existingData, error: loadError } = await client
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();
  if (loadError) {
    throw requestFailed('Loading the challenge', 'CHALLENGE_LOAD_FAILED', loadError.message);
  }
  const existing = mapChallenge(existingData as unknown);
  if (!existing) {
    throw new AppError('Loading the challenge failed: malformed response.', 'CHALLENGE_LOAD_FAILED');
  }
  const winnerId = decideWinner(
    existing.challengerScore,
    ghost.totalScore,
    existing.challengerId,
    existing.opponentId || me.userId,
  );
  const { data, error } = await client
    .from('challenges')
    .update({
      opponent_score: ghost.totalScore,
      opponent_ghost: ghost,
      status: 'done',
      winner_id: winnerId,
      completed_at: new Date().toISOString(),
    })
    .eq('id', challengeId)
    .select()
    .single();
  if (error) {
    throw requestFailed('Submitting the answer', 'CHALLENGE_ANSWER_FAILED', error.message);
  }
  const updated = mapChallenge(data as unknown);
  if (!updated) {
    throw new AppError('Submitting the answer failed: malformed response.', 'CHALLENGE_ANSWER_FAILED');
  }
  return updated;
}

/* ---------------- weekly tournament ---------------- */

export async function fetchTournamentEntries(weekKey: string): Promise<TournamentEntry[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('tournament_entries')
    .select('*')
    .eq('week_key', weekKey)
    .order('score', { ascending: false });
  if (error) {
    throw requestFailed('Loading the tournament board', 'TOURNAMENT_LOAD_FAILED', error.message);
  }
  const rows: unknown = data;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => mapTournamentEntry(row))
    .filter((entry): entry is TournamentEntry => entry !== null);
}

export async function fetchMyTournamentEntry(
  weekKey: string,
  onlineId: string,
): Promise<TournamentEntry | null> {
  const client = requireClient();
  const { data, error } = await client
    .from('tournament_entries')
    .select('*')
    .eq('week_key', weekKey)
    .eq('user_id', onlineId)
    .maybeSingle();
  if (error) {
    throw requestFailed('Loading your tournament entry', 'TOURNAMENT_LOAD_FAILED', error.message);
  }
  if (data === null || data === undefined) return null;
  return mapTournamentEntry(data as unknown);
}

export async function submitTournamentEntry(
  weekKey: string,
  recipeId: string,
  displayName: string,
  score: number,
  stars: number,
): Promise<TournamentEntry> {
  if (!isTournamentOpen()) {
    throw new AppError('This tournament week has closed.', 'TOURNAMENT_CLOSED');
  }
  const client = requireClient();
  const me = await requireSessionUser(client);
  const existing = await fetchMyTournamentEntry(weekKey, me.userId);
  // The board keeps each player's BEST run: a score that does not
  // beat the booked one (a tie keeps the earlier run) writes nothing.
  if (existing && existing.score >= score) return existing;
  const submittedAt = new Date().toISOString();
  const { data, error } = await client
    .from('tournament_entries')
    .upsert(
      {
        week_key: weekKey,
        user_id: me.userId,
        display_name: displayName,
        recipe_id: recipeId,
        score,
        stars,
        submitted_at: submittedAt,
      },
      { onConflict: 'week_key,user_id' },
    )
    .select()
    .single();
  if (error) {
    throw requestFailed('Submitting the tournament entry', 'TOURNAMENT_SUBMIT_FAILED', error.message);
  }
  const entry = mapTournamentEntry(data as unknown);
  if (!entry) {
    return { weekKey, userId: me.userId, displayName, recipeId, score, stars, submittedAt };
  }
  return entry;
}

/* ---------------- stall visits ---------------- */

export async function fetchStallVisit(userId: string): Promise<StallVisit | null> {
  const client = requireClient();
  const { data, error } = await client
    .from('stall_snapshots')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    throw requestFailed('Loading the stall postcard', 'STALL_VISIT_LOAD_FAILED', error.message);
  }
  if (data === null || data === undefined) return null;
  return mapStallVisit(data as unknown);
}

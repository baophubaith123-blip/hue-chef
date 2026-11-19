import { SEED_RECIPES } from '@/data/recipes';
import { findUserById, loadUsers } from '@/features/auth/store';
import { toPublicUser } from '@/features/auth/types';
import { sellableRecipes } from '@/features/journey/lib/journey';
import { getSupabase, isOnlineConfigured } from '@/features/online/lib/supabase';
import {
  applySnapshot,
  buildSnapshot,
  mergeSnapshots,
} from '@/features/online/lib/snapshot';
import { loadOnlineUserState, patchOnlineUserState } from '@/features/online/store';
import type { ProgressSnapshot, SyncResult } from '@/features/online/types';
import { stallStarsForExp } from '@/features/stall/lib/pricing-sell';

/**
 * Cross-device progress sync (Gói H9, mục 9.3): pull my snapshot,
 * merge it with the local one under snapshot.ts's merge law, apply
 * the winner locally, push it back, refresh my directory row and my
 * stall postcard, and stamp the link. syncNow NEVER throws: every
 * failure mode (unconfigured build, signed out, tables not created
 * yet, offline network) folds into the returned SyncResult so the UI
 * can show a status instead of an error.
 */

function asProgressSnapshot(value: unknown): ProgressSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const rec = value as Record<string, unknown>;
  if (typeof rec.updatedAt !== 'number') return null;
  if (!rec.profile || typeof rec.profile !== 'object') return null;
  return value as ProgressSnapshot;
}

export async function syncNow(localUserId: string): Promise<SyncResult> {
  const at = Date.now();
  if (!isOnlineConfigured()) return { status: 'unconfigured', at };
  const client = getSupabase();
  if (!client) return { status: 'unconfigured', at };
  try {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) return { status: 'error', at: Date.now() };
    const user = sessionData.session?.user;
    if (!user) return { status: 'signed-out', at: Date.now() };

    const local = buildSnapshot(localUserId, Date.now());
    if (!local) return { status: 'error', at: Date.now() };

    const { data: remoteRow, error: fetchError } = await client
      .from('progress_snapshots')
      .select('snapshot')
      .eq('user_id', user.id)
      .maybeSingle();
    if (fetchError) return { status: 'error', at: Date.now() };
    const remoteRecord =
      remoteRow && typeof remoteRow === 'object'
        ? (remoteRow as Record<string, unknown>)
        : null;
    const remote = remoteRecord ? asProgressSnapshot(remoteRecord.snapshot) : null;

    const merged = remote ? mergeSnapshots(local, remote) : local;
    const changed =
      remote !== null &&
      (merged.updatedAt !== local.updatedAt ||
        JSON.stringify(merged) !== JSON.stringify(local));
    if (changed) {
      applySnapshot(localUserId, merged);
    }

    const { error: snapshotError } = await client.from('progress_snapshots').upsert(
      {
        user_id: user.id,
        snapshot: merged,
        updated_at: new Date(merged.updatedAt).toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (snapshotError) return { status: 'error', at: Date.now() };

    const { error: profileError } = await client.from('online_profiles').upsert(
      { id: user.id, display_name: merged.profile.name, level: merged.profile.level },
      { onConflict: 'id' },
    );
    if (profileError) return { status: 'error', at: Date.now() };

    await publishStallVisit(localUserId);

    const existingLink = loadOnlineUserState(localUserId).link;
    patchOnlineUserState(localUserId, {
      link: {
        onlineId: user.id,
        email: user.email ?? existingLink?.email ?? '',
        displayName: merged.profile.name,
        lastSyncAt: Date.now(),
      },
    });

    if (changed && typeof window !== 'undefined') {
      // AuthContext listens for 'storage' to resync its in-memory
      // user — nudge it so an applied remote snapshot shows at once.
      window.dispatchEvent(new Event('storage'));
    }
    return { status: 'synced', at: Date.now() };
  } catch {
    return { status: 'error', at: Date.now() };
  }
}

/**
 * Publish the public postcard of this player's stall (stall level,
 * stars, decorations, on-sale menu) for friend visits. Best-effort
 * by design: every failure is swallowed — a missing postcard must
 * never break a sync or a page.
 */
export async function publishStallVisit(localUserId: string): Promise<void> {
  try {
    const client = getSupabase();
    if (!client) return;
    const { data } = await client.auth.getSession();
    const user = data.session?.user;
    if (!user) return;
    const snapshot = buildSnapshot(localUserId, Date.now());
    if (!snapshot) return;
    const stall = snapshot.stall;
    let menuIds: string[];
    if (stall?.menuIds) {
      menuIds = [...stall.menuIds];
    } else {
      const stored = findUserById(loadUsers(), localUserId);
      menuIds = sellableRecipes(stored ? toPublicUser(stored) : null, SEED_RECIPES).map(
        (recipe) => recipe.id,
      );
    }
    await client.from('stall_snapshots').upsert(
      {
        user_id: user.id,
        display_name: snapshot.profile.name,
        stall_level: stall?.stallLevel ?? 1,
        stars: stallStarsForExp(stall?.exp ?? 0),
        decor_ids: [...(stall?.decorIds ?? [])],
        menu_ids: menuIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  } catch {
    // Best-effort postcard — silence is the contract.
  }
}

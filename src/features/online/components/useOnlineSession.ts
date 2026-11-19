import { useCallback, useEffect, useRef, useState } from 'react';

import type { PublicUser } from '@/features/auth/types';
import {
  currentOnlineUser,
  fetchDirectory,
  signInOnline,
  signOutOnline,
  signUpOnline,
} from '@/features/online/lib/api';
import { isOnlineConfigured } from '@/features/online/lib/supabase';
import { syncNow } from '@/features/online/lib/sync';
import { loadOnlineUserState, patchOnlineUserState } from '@/features/online/store';
import type { OnlineLink, SyncResult } from '@/features/online/types';

export interface SignUpOutcome {
  ok: boolean;
  needsConfirmation: boolean;
}

export interface OnlineSession {
  configured: boolean;
  link: OnlineLink | null;
  busy: boolean;
  syncResult: SyncResult | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (displayName: string, email: string, password: string) => Promise<SignUpOutcome>;
  signOut: () => Promise<void>;
  runSync: () => Promise<void>;
}

/**
 * Online session hook (Gói H9, lát B): the single entry point every
 * online page uses. It mirrors the per-local-user link kept in the
 * online store, restores a link from a live Supabase session on mount,
 * and funnels every auth / sync transition through here so pages never
 * touch the api layer directly. All failures are swallowed into return
 * values / syncResult — nothing throws into the UI.
 */
export function useOnlineSession(localUser: PublicUser | null): OnlineSession {
  const [configured] = useState<boolean>(() => isOnlineConfigured());
  const [link, setLink] = useState<OnlineLink | null>(() =>
    localUser ? loadOnlineUserState(localUser.id).link : null,
  );
  const [busy, setBusy] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const restoreAttemptedForRef = useRef<string | null>(null);

  const localUserId = localUser?.id ?? null;

  /** Run one sync for the given local user and refresh the link mirror. */
  const runSyncFor = useCallback(async (userId: string): Promise<void> => {
    setBusy(true);
    try {
      const result = await syncNow(userId);
      setSyncResult(result);
    } catch {
      setSyncResult({ status: 'error', at: Date.now() });
    } finally {
      // syncNow stamps link.lastSyncAt in the store — re-read the mirror.
      setLink(loadOnlineUserState(userId).link);
      setBusy(false);
    }
  }, []);

  const runSync = useCallback(async (): Promise<void> => {
    if (!localUserId) return;
    await runSyncFor(localUserId);
  }, [localUserId, runSyncFor]);

  // Keep the link mirror in step with the local account, and restore a
  // link from a live online session when the store has none yet.
  useEffect(() => {
    if (!localUserId) {
      setLink(null);
      return;
    }
    const stored = loadOnlineUserState(localUserId).link;
    setLink(stored);
    if (stored || !configured) return;
    if (restoreAttemptedForRef.current === localUserId) return;
    restoreAttemptedForRef.current = localUserId;

    let cancelled = false;
    void (async () => {
      try {
        const onlineUser = await currentOnlineUser();
        if (!onlineUser || cancelled) return;
        let displayName = onlineUser.email;
        try {
          const directory = await fetchDirectory();
          const profile = directory.find((p) => p.id === onlineUser.userId);
          if (profile) displayName = profile.displayName;
        } catch {
          // Directory is best-effort here — the email is a fine fallback.
        }
        if (cancelled) return;
        const restored: OnlineLink = {
          onlineId: onlineUser.userId,
          email: onlineUser.email,
          displayName,
          lastSyncAt: null,
        };
        patchOnlineUserState(localUserId, { link: restored });
        setLink(restored);
        await runSyncFor(localUserId);
      } catch {
        // No live session / offline — the gate simply stays signed out.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [localUserId, configured, runSyncFor]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!localUserId) return false;
      setBusy(true);
      try {
        const result = await signInOnline(email, password);
        let displayName = result.email;
        try {
          const directory = await fetchDirectory();
          const profile = directory.find((p) => p.id === result.userId);
          if (profile) displayName = profile.displayName;
        } catch {
          // Best-effort only — fall back to the email as display name.
        }
        const next: OnlineLink = {
          onlineId: result.userId,
          email: result.email,
          displayName,
          lastSyncAt: null,
        };
        patchOnlineUserState(localUserId, { link: next });
        setLink(next);
        await runSyncFor(localUserId);
        return true;
      } catch {
        return false;
      } finally {
        setBusy(false);
      }
    },
    [localUserId, runSyncFor],
  );

  const signUp = useCallback(
    async (displayName: string, email: string, password: string): Promise<SignUpOutcome> => {
      if (!localUserId) return { ok: false, needsConfirmation: false };
      setBusy(true);
      try {
        const result = await signUpOnline(email, password, displayName);
        if (result.needsConfirmation) {
          // No live session until the email is confirmed — do not link
          // yet; the gate shows the confirmation note instead.
          return { ok: true, needsConfirmation: true };
        }
        const next: OnlineLink = {
          onlineId: result.userId,
          email: result.email,
          displayName,
          lastSyncAt: null,
        };
        patchOnlineUserState(localUserId, { link: next });
        setLink(next);
        await runSyncFor(localUserId);
        return { ok: true, needsConfirmation: false };
      } catch {
        return { ok: false, needsConfirmation: false };
      } finally {
        setBusy(false);
      }
    },
    [localUserId, runSyncFor],
  );

  const signOut = useCallback(async (): Promise<void> => {
    setBusy(true);
    try {
      await signOutOnline();
    } catch {
      // Even if the remote sign-out fails, the local link is dropped.
    } finally {
      if (localUserId) {
        patchOnlineUserState(localUserId, { link: null, duelSession: null });
      }
      setLink(null);
      setSyncResult(null);
      setBusy(false);
    }
  }, [localUserId]);

  return { configured, link, busy, syncResult, signIn, signUp, signOut, runSync };
}

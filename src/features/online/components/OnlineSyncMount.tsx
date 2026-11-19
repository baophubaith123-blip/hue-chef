import { useEffect, useRef } from 'react';

import { isOnlineConfigured } from '@/features/online/lib/supabase';
import { syncNow } from '@/features/online/lib/sync';
import { loadOnlineUserState } from '@/features/online/store';

/**
 * Keeps the cloud snapshot fresh (Gói H9): when a player who linked an
 * online account opens the app or refocuses the tab, their progress
 * syncs quietly in the background — pull, merge, push, publish the
 * stall postcard. Throttled to one attempt per 30 seconds; every
 * failure is silent by design, offline play never notices.
 */
export function OnlineSyncMount({ userId }: { userId: string | null }) {
  const lastAttemptRef = useRef(0);

  useEffect(() => {
    if (!userId || !isOnlineConfigured()) return undefined;
    const attempt = () => {
      if (!loadOnlineUserState(userId).link) return;
      const now = Date.now();
      if (now - lastAttemptRef.current < 30_000) return;
      lastAttemptRef.current = now;
      void syncNow(userId);
    };
    attempt();
    window.addEventListener('focus', attempt);
    return () => window.removeEventListener('focus', attempt);
  }, [userId]);

  return null;
}

import { getJsonStorage, setJsonStorage } from '@/lib/storage';
import type { OnlineUserState } from '@/features/online/types';

/**
 * Local side of the online layer (Gói H9): the link between a device
 * account and its online account, plus a duel run waiting to be
 * played. One localStorage record per local player, following the
 * same byUser pattern as the stall / events / skills stores. The key
 * is declared here (not in lib/storage) so the online layer stays
 * additive — offline code never learns this key exists.
 */

const ONLINE_STORAGE_KEY = 'hue-chef-online';

interface OnlineStoreShape {
  byUser: Record<string, OnlineUserState>;
}

function emptyOnlineState(): OnlineUserState {
  return { link: null, duelSession: null };
}

function loadAll(): OnlineStoreShape {
  const raw = getJsonStorage<OnlineStoreShape>(ONLINE_STORAGE_KEY);
  if (!raw || typeof raw !== 'object' || typeof raw.byUser !== 'object' || raw.byUser === null) {
    return { byUser: {} };
  }
  return raw;
}

function saveAll(shape: OnlineStoreShape): void {
  setJsonStorage(ONLINE_STORAGE_KEY, shape);
}

export function loadOnlineUserState(userId: string): OnlineUserState {
  const stored = loadAll().byUser[userId];
  if (!stored || typeof stored !== 'object') return emptyOnlineState();
  return {
    link: stored.link ?? null,
    duelSession: stored.duelSession ?? null,
  };
}

export function saveOnlineUserState(userId: string, state: OnlineUserState): void {
  const shape = loadAll();
  shape.byUser[userId] = state;
  saveAll(shape);
}

export function patchOnlineUserState(
  userId: string,
  patch: Partial<OnlineUserState>,
): OnlineUserState {
  const next = { ...loadOnlineUserState(userId), ...patch };
  saveOnlineUserState(userId, next);
  return next;
}

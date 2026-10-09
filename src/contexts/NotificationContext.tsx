import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import type { AppNotification, NotificationType } from '@/features/notifications/types';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

export interface NotificationContextValue {
  push: (args: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    relatedId?: string;
  }) => AppNotification;
  listForUser: (userId: string) => AppNotification[];
  unreadCount: (userId: string) => number;
  markRead: (notificationId: string) => void;
  markAllReadForUser: (userId: string) => void;
  dismiss: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

type NotificationStore = Record<string, AppNotification[]>;

function emptyStore(): NotificationStore {
  return {};
}

function loadStore(): NotificationStore {
  const stored = getJsonStorage<NotificationStore>(STORAGE_KEYS.notifications);
  if (!stored || typeof stored !== 'object') {
    return emptyStore();
  }
  return stored;
}

function saveStore(store: NotificationStore): void {
  setJsonStorage(STORAGE_KEYS.notifications, store);
}

function createId(): string {
  return `notif-${crypto.randomUUID()}`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const push = useCallback<NotificationContextValue['push']>((args) => {
    const store = loadStore();
    const notif: AppNotification = {
      id: createId(),
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      link: args.link,
      relatedId: args.relatedId,
      createdAt: new Date().toISOString(),
    };
    const arr = store[args.userId] ?? [];
    store[args.userId] = [notif, ...arr].slice(0, 200);
    saveStore(store);
    return notif;
  }, []);

  const listForUser = useCallback((userId: string): AppNotification[] => {
    const store = loadStore();
    return store[userId] ?? [];
  }, []);

  const unreadCount = useCallback((userId: string): number => {
    const list = listForUser(userId);
    return list.filter((n) => !n.readAt).length;
  }, [listForUser]);

  const markRead = useCallback((notificationId: string): void => {
    const store = loadStore();
    let found = false;
    for (const userId of Object.keys(store)) {
      const arr = store[userId];
      for (let i = 0; i < arr.length; i += 1) {
        if (arr[i].id === notificationId && !arr[i].readAt) {
          arr[i] = { ...arr[i], readAt: new Date().toISOString() };
          found = true;
        }
      }
    }
    if (found) saveStore(store);
  }, []);

  const markAllReadForUser = useCallback((userId: string): void => {
    const store = loadStore();
    const arr = store[userId];
    if (!arr) return;
    const now = new Date().toISOString();
    let changed = false;
    const next = arr.map((n) => {
      if (n.readAt) return n;
      changed = true;
      return { ...n, readAt: now };
    });
    if (changed) {
      store[userId] = next;
      saveStore(store);
    }
  }, []);

  const dismiss = useCallback((notificationId: string): void => {
    const store = loadStore();
    let changed = false;
    for (const userId of Object.keys(store)) {
      const arr = store[userId];
      const len = arr.length;
      const filtered = arr.filter((n) => n.id !== notificationId);
      if (filtered.length !== len) {
        store[userId] = filtered;
        changed = true;
      }
    }
    if (changed) saveStore(store);
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({ push, listForUser, unreadCount, markRead, markAllReadForUser, dismiss }),
    [push, listForUser, unreadCount, markRead, markAllReadForUser, dismiss],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}

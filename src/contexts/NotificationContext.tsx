import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
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
  const [store, setStore] = useState<NotificationStore>(() => loadStore());

  const push = useCallback<NotificationContextValue['push']>((args) => {
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
    setStore((prev) => {
      const arr = prev[args.userId] ?? [];
      const updated = {
        ...prev,
        [args.userId]: [notif, ...arr].slice(0, 200),
      };
      saveStore(updated);
      return updated;
    });
    return notif;
  }, []);

  const listForUser = useCallback(
    (userId: string): AppNotification[] => {
      return store[userId] ?? [];
    },
    [store],
  );

  const unreadCount = useCallback(
    (userId: string): number => {
      const list = store[userId] ?? [];
      return list.filter((n) => !n.readAt).length;
    },
    [store],
  );

  const markRead = useCallback((notificationId: string): void => {
    setStore((prev) => {
      let found = false;
      const next: NotificationStore = { ...prev };
      for (const userId of Object.keys(next)) {
        const arr = next[userId];
        if (!arr) continue;
        const newArr = arr.map((item) => {
          if (item.id === notificationId && !item.readAt) {
            found = true;
            return { ...item, readAt: new Date().toISOString() };
          }
          return item;
        });
        if (found) {
          next[userId] = newArr;
        }
      }
      if (found) {
        saveStore(next);
        return next;
      }
      return prev;
    });
  }, []);

  const markAllReadForUser = useCallback((userId: string): void => {
    setStore((prev) => {
      const arr = prev[userId];
      if (!arr || arr.length === 0) return prev;
      const now = new Date().toISOString();
      let changed = false;
      const nextArr = arr.map((n) => {
        if (n.readAt) return n;
        changed = true;
        return { ...n, readAt: now };
      });
      if (!changed) return prev;
      const updated = { ...prev, [userId]: nextArr };
      saveStore(updated);
      return updated;
    });
  }, []);

  const dismiss = useCallback((notificationId: string): void => {
    setStore((prev) => {
      let changed = false;
      const next: NotificationStore = { ...prev };
      for (const userId of Object.keys(next)) {
        const arr = next[userId];
        if (!arr) continue;
        const filtered = arr.filter((n) => n.id !== notificationId);
        if (filtered.length !== arr.length) {
          next[userId] = filtered;
          changed = true;
        }
      }
      if (changed) {
        saveStore(next);
        return next;
      }
      return prev;
    });
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

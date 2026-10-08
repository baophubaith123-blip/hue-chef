import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Appeal, AppealStatus, AppealType } from '@/features/support/types';
import { AppError } from '@/lib/errors';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

interface AppealContextValue {
  appeals: Appeal[];
  isLoading: boolean;
  createAppealFromThread: (input: {
    threadId: string;
    appellantId: string;
    type: AppealType;
    subject: string;
    summary: string;
    supportId?: string;
  }) => Appeal;
  listAppeals: (filters?: {
    status?: AppealStatus;
    appellantId?: string;
    supportId?: string;
  }) => Appeal[];
  getAppeal: (appealId: string) => Appeal | undefined;
  updateStatus: (
    appealId: string,
    status: AppealStatus,
    opts?: { supportId?: string; adminId?: string; resolution?: string },
  ) => Appeal;
}

const AppealContext = createContext<AppealContextValue | null>(null);

function loadAppeals(): Appeal[] {
  const stored = getJsonStorage<Appeal[]>(STORAGE_KEYS.appeals);
  return Array.isArray(stored) ? stored : [];
}

function makeAppealId(): string {
  return `appeal-${crypto.randomUUID()}`;
}

export function AppealProvider({ children }: { children: ReactNode }) {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAppeals(loadAppeals());
    setIsLoading(false);
  }, []);

  const persist = useCallback((next: Appeal[]) => {
    setAppeals(next);
    setJsonStorage(STORAGE_KEYS.appeals, next);
  }, []);

  const createAppealFromThread = useCallback(
    (input: {
      threadId: string;
      appellantId: string;
      type: AppealType;
      subject: string;
      summary: string;
      supportId?: string;
    }): Appeal => {
      const now = new Date().toISOString();
      const appeal: Appeal = {
        id: makeAppealId(),
        threadId: input.threadId,
        appellantId: input.appellantId,
        type: input.type,
        subject: input.subject,
        summary: input.summary,
        status: 'open',
        supportId: input.supportId,
        createdAt: now,
        updatedAt: now,
      };
      persist([appeal, ...appeals]);
      return appeal;
    },
    [appeals, persist],
  );

  const listAppeals = useCallback(
    (filters: {
      status?: AppealStatus;
      appellantId?: string;
      supportId?: string;
    } = {}) =>
      appeals
        .filter((a) => (filters.status ? a.status === filters.status : true))
        .filter((a) => (filters.appellantId ? a.appellantId === filters.appellantId : true))
        .filter((a) => (filters.supportId ? a.supportId === filters.supportId : true))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [appeals],
  );

  const getAppeal = useCallback(
    (appealId: string) => appeals.find((a) => a.id === appealId),
    [appeals],
  );

  const updateStatus = useCallback(
    (
      appealId: string,
      status: AppealStatus,
      opts: { supportId?: string; adminId?: string; resolution?: string } = {},
    ): Appeal => {
      const appeal = appeals.find((a) => a.id === appealId);
      if (!appeal) throw new AppError('Appeal not found', 'APPEAL_NOT_FOUND');
      const updated: Appeal = {
        ...appeal,
        status,
        supportId: opts.supportId ?? appeal.supportId,
        adminId: opts.adminId ?? appeal.adminId,
        resolution: opts.resolution ?? appeal.resolution,
        updatedAt: new Date().toISOString(),
      };
      const next = appeals.map((a) => (a.id === appealId ? updated : a));
      persist(next);
      return updated;
    },
    [appeals, persist],
  );

  const value = useMemo(
    () => ({
      appeals,
      isLoading,
      createAppealFromThread,
      listAppeals,
      getAppeal,
      updateStatus,
    }),
    [appeals, isLoading, createAppealFromThread, listAppeals, getAppeal, updateStatus],
  );

  return <AppealContext.Provider value={value}>{children}</AppealContext.Provider>;
}

export function useAppeals(): AppealContextValue {
  const ctx = useContext(AppealContext);
  if (!ctx) {
    throw new AppError('useAppeals must be used within AppealProvider', 'APPEAL_CONTEXT');
  }
  return ctx;
}

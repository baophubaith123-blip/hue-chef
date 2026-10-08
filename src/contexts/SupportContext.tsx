import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { StoredUser, UserRole } from '@/features/auth/types';
import { loadUsers } from '@/features/auth/store';
import type {
  ChatAttachment,
  ChatMessage,
  ChatThread,
} from '@/features/support/types';
import { useTranslation } from '@/i18n/useTranslation';
import { AppError } from '@/lib/errors';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

interface SupportContextValue {
  threads: ChatThread[];
  messages: ChatMessage[];
  isLoading: boolean;
  getOrCreateThreadWithSupport: (userId: string, starterRole: UserRole, subject?: string) => ChatThread;
  listThreadsByParticipant: (userId: string) => ChatThread[];
  listThreadsForSupport: () => ChatThread[];
  getThread: (threadId: string) => ChatThread | undefined;
  getMessages: (threadId: string) => ChatMessage[];
  sendMessage: (
    threadId: string,
    senderId: string,
    content: string,
    attachments?: ChatAttachment[],
  ) => ChatMessage;
  markThreadRead: (threadId: string, readerId: string) => void;
  closeThread: (threadId: string, actorId: string) => void;
  findUserById: (id: string) => StoredUser | undefined;
}

const SupportContext = createContext<SupportContextValue | null>(null);

function loadThreads(): ChatThread[] {
  const stored = getJsonStorage<ChatThread[]>(STORAGE_KEYS.chatThreads);
  return Array.isArray(stored) ? stored : [];
}

function loadMessages(): ChatMessage[] {
  const stored = getJsonStorage<ChatMessage[]>(STORAGE_KEYS.chatMessages);
  return Array.isArray(stored) ? stored : [];
}

function makeThreadId(): string {
  return `thread-${crypto.randomUUID()}`;
}

function makeMessageId(): string {
  return `msg-${crypto.randomUUID()}`;
}

function findSupportUser(): StoredUser | undefined {
  const users = loadUsers();
  return users.find((u) => u.role === 'support');
}

export function SupportProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    setThreads(loadThreads());
    setMessages(loadMessages());
    setIsLoading(false);
  }, []);

  const persistThreads = useCallback((next: ChatThread[]) => {
    setThreads(next);
    setJsonStorage(STORAGE_KEYS.chatThreads, next);
  }, []);

  const persistMessages = useCallback((next: ChatMessage[]) => {
    setMessages(next);
    setJsonStorage(STORAGE_KEYS.chatMessages, next);
  }, []);

  const getOrCreateThreadWithSupport = useCallback(
    (userId: string, starterRole: UserRole, subject?: string): ChatThread => {
      const support = findSupportUser();
      const supportId = support?.id ?? 'seed-support';
      const existing = threads.find(
        (th) =>
          th.closed === false &&
          th.participantIds.includes(userId) &&
          th.participantIds.includes(supportId),
      );
      if (existing) return existing;

      const now = new Date().toISOString();
      const newThread: ChatThread = {
        id: makeThreadId(),
        participantIds: [userId, supportId],
        starterRole,
        subject: subject || t('support.chatTitle'),
        createdAt: now,
        lastMessageAt: now,
        closed: false,
      };
      persistThreads([newThread, ...threads]);
      return newThread;
    },
    [persistThreads, threads, t],
  );

  const listThreadsByParticipant = useCallback(
    (userId: string) =>
      threads
        .filter((th) => th.participantIds.includes(userId))
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
    [threads],
  );

  const listThreadsForSupport = useCallback(
    () =>
      [...threads].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
    [threads],
  );

  const getThread = useCallback(
    (threadId: string) => threads.find((th) => th.id === threadId),
    [threads],
  );

  const getMessages = useCallback(
    (threadId: string) =>
      messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages],
  );

  const sendMessage = useCallback(
    (
      threadId: string,
      senderId: string,
      content: string,
      attachments: ChatAttachment[] = [],
    ): ChatMessage => {
      const thread = threads.find((th) => th.id === threadId);
      if (!thread) throw new AppError('Thread does not exist', 'THREAD_NOT_FOUND');
      if (thread.closed) throw new AppError('Thread already closed', 'CANNOT_CLOSE_THREAD');
      const text = content.trim();
      if (!text && attachments.length === 0) {
        throw new AppError('Empty message', 'MESSAGE_EMPTY');
      }
      const msg: ChatMessage = {
        id: makeMessageId(),
        threadId,
        senderId,
        content: text,
        attachments,
        createdAt: new Date().toISOString(),
        read: false,
      };
      const updatedThreads = threads.map((th) =>
        th.id === threadId ? { ...th, lastMessageAt: msg.createdAt } : th,
      );
      persistThreads(updatedThreads);
      persistMessages([msg, ...messages]);
      return msg;
    },
    [messages, persistMessages, persistThreads, threads],
  );

  const markThreadRead = useCallback(
    (threadId: string, readerId: string) => {
      const next = messages.map((m) =>
        m.threadId === threadId && m.senderId !== readerId ? { ...m, read: true } : m,
      );
      persistMessages(next);
    },
    [messages, persistMessages],
  );

  const closeThread = useCallback(
    (threadId: string, actorId: string) => {
      const thread = threads.find((th) => th.id === threadId);
      if (!thread) throw new AppError('Thread not found', 'THREAD_NOT_FOUND');
      if (!thread.participantIds.includes(actorId)) {
        // Support can close any thread, regular users only their own
        const users = loadUsers();
        const actor = users.find((u) => u.id === actorId);
        if (actor?.role !== 'support' && actor?.role !== 'admin') {
          throw new AppError('No permission to close thread', 'CANNOT_CLOSE_THREAD');
        }
      }
      const next = threads.map((th) =>
        th.id === threadId
          ? { ...th, closed: true, closedAt: new Date().toISOString() }
          : th,
      );
      persistThreads(next);
    },
    [persistThreads, threads],
  );

  const findUserByIdCtx = useCallback((id: string): StoredUser | undefined => {
    return loadUsers().find((u) => u.id === id);
  }, []);

  const value = useMemo(
    () => ({
      threads,
      messages,
      isLoading,
      getOrCreateThreadWithSupport,
      listThreadsByParticipant,
      listThreadsForSupport,
      getThread,
      getMessages,
      sendMessage,
      markThreadRead,
      closeThread,
      findUserById: findUserByIdCtx,
    }),
    [
      threads,
      messages,
      isLoading,
      getOrCreateThreadWithSupport,
      listThreadsByParticipant,
      listThreadsForSupport,
      getThread,
      getMessages,
      sendMessage,
      markThreadRead,
      closeThread,
      findUserByIdCtx,
    ],
  );

  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>;
}

export function useSupport(): SupportContextValue {
  const ctx = useContext(SupportContext);
  if (!ctx) {
    throw new AppError('useSupport must be used within SupportProvider', 'SUPPORT_CONTEXT');
  }
  return ctx;
}

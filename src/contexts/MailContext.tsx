import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { MailMessage, MailType } from '@/features/mail/types';
import { AppError } from '@/lib/errors';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

interface MailContextValue {
  mails: MailMessage[];
  isLoading: boolean;
  getInboxForUser: (userId: string) => MailMessage[];
  getUnreadCount: (userId: string) => number;
  markAsRead: (mailId: string, userId: string) => void;
  sendRecipeApprovedMail: (editorId: string, recipeId: string, recipeName: string) => void;
  sendRecipeRejectedMail: (
    editorId: string,
    recipeId: string,
    recipeName: string,
    reason: string,
  ) => void;
}

const MailContext = createContext<MailContextValue | null>(null);

function loadMails(): MailMessage[] {
  const stored = getJsonStorage<MailMessage[]>(STORAGE_KEYS.inbox);
  if (!stored || !Array.isArray(stored)) {
    return [];
  }
  return stored;
}

function createMailId(): string {
  return `mail-${crypto.randomUUID()}`;
}

function buildMail(
  userId: string,
  type: MailType,
  subject: string,
  body: string,
  extra: Pick<MailMessage, 'recipeId' | 'rejectionReason'> = {},
): MailMessage {
  return {
    id: createMailId(),
    userId,
    type,
    subject,
    body,
    createdAt: new Date().toISOString(),
    read: false,
    ...extra,
  };
}

export function MailProvider({ children }: { children: ReactNode }) {
  const [mails, setMails] = useState<MailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMails(loadMails());
    setIsLoading(false);
  }, []);

  const persist = useCallback((next: MailMessage[]) => {
    setMails(next);
    setJsonStorage(STORAGE_KEYS.inbox, next);
  }, []);

  const appendMail = useCallback(
    (mail: MailMessage) => {
      persist([mail, ...mails]);
    },
    [mails, persist],
  );

  const getInboxForUser = useCallback(
    (userId: string) =>
      mails
        .filter((mail) => mail.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [mails],
  );

  const getUnreadCount = useCallback(
    (userId: string) => mails.filter((mail) => mail.userId === userId && !mail.read).length,
    [mails],
  );

  const markAsRead = useCallback(
    (mailId: string, userId: string) => {
      const next = mails.map((mail) =>
        mail.id === mailId && mail.userId === userId ? { ...mail, read: true } : mail,
      );
      persist(next);
    },
    [mails, persist],
  );

  const sendRecipeApprovedMail = useCallback(
    (editorId: string, recipeId: string, recipeName: string) => {
      appendMail(
        buildMail(
          editorId,
          'recipe-approved',
          'Recipe approved',
          `Your recipe "${recipeName}" is now live for players.`,
          { recipeId },
        ),
      );
    },
    [appendMail],
  );

  const sendRecipeRejectedMail = useCallback(
    (editorId: string, recipeId: string, recipeName: string, reason: string) => {
      appendMail(
        buildMail(
          editorId,
          'recipe-rejected',
          'Recipe needs changes',
          `Your recipe "${recipeName}" was not approved.`,
          { recipeId, rejectionReason: reason },
        ),
      );
    },
    [appendMail],
  );

  const value = useMemo(
    () => ({
      mails,
      isLoading,
      getInboxForUser,
      getUnreadCount,
      markAsRead,
      sendRecipeApprovedMail,
      sendRecipeRejectedMail,
    }),
    [
      mails,
      isLoading,
      getInboxForUser,
      getUnreadCount,
      markAsRead,
      sendRecipeApprovedMail,
      sendRecipeRejectedMail,
    ],
  );

  return <MailContext.Provider value={value}>{children}</MailContext.Provider>;
}

export function useMail(): MailContextValue {
  const ctx = useContext(MailContext);
  if (!ctx) {
    throw new AppError('useMail must be used within MailProvider', 'MAIL_CONTEXT');
  }
  return ctx;
}

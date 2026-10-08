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
import { loadUsers, saveUsers } from '@/features/auth/store';
import type { MailMessage, MailType } from '@/features/mail/types';
import { useTranslation } from '@/i18n/useTranslation';
import { AppError } from '@/lib/errors';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

export type BroadcastTarget = 'player' | 'editor' | 'support' | 'all';

interface MailContextValue {
  mails: MailMessage[];
  isLoading: boolean;
  getInboxForUser: (userId: string) => MailMessage[];
  getUnreadCount: (userId: string) => number;
  getMail: (mailId: string, userId: string) => MailMessage | undefined;
  markAsRead: (mailId: string, userId: string) => void;
  markAllRead: (userId: string) => void;
  sendRecipeApprovedMail: (editorId: string, recipeId: string, recipeName: string) => void;
  sendRecipeRejectedMail: (
    editorId: string,
    recipeId: string,
    recipeName: string,
    reason: string,
  ) => void;
  sendBroadcastMail: (
    senderId: string,
    target: BroadcastTarget,
    subject: string,
    body: string,
  ) => { count: number; recipients: string[] };
  sendBanNoticeMail: (
    userId: string,
    reason: string,
    until?: string,
  ) => { banUntil?: string; permanent: boolean };
  sendWarningMail: (userId: string, autoBanAtThird?: boolean) => { newCount: number; banned: boolean };
  sendSupportMail: (
    userId: string,
    subject: string,
    body: string,
    extras?: Pick<MailMessage, 'threadId' | 'appealId'>,
  ) => void;
  banUser: (userId: string, reason: string, until?: string, actorId?: string) => StoredUser;
  unbanUser: (userId: string, actorId?: string) => StoredUser;
  incrementWarningCount: (
    userId: string,
    actorId?: string,
  ) => { count: number; banned: boolean };
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

type MailExtra = Partial<
  Pick<
    MailMessage,
    | 'recipeId'
    | 'rejectionReason'
    | 'appealId'
    | 'threadId'
    | 'banReason'
    | 'banUntil'
    | 'warningCount'
    | 'broadcastTarget'
    | 'senderId'
  >
>;

function buildMail(
  userId: string,
  type: MailType,
  subject: string,
  body: string,
  extra: MailExtra = {},
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

const THREE_WARNINGS_LIMIT = 3;

export function MailProvider({ children }: { children: ReactNode }) {
  const [mails, setMails] = useState<MailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    setMails(loadMails());
    setIsLoading(false);
  }, []);

  const persist = useCallback((next: MailMessage[]) => {
    setMails(next);
    setJsonStorage(STORAGE_KEYS.inbox, next);
  }, []);

  const appendMails = useCallback(
    (newMails: MailMessage[]) => {
      persist([...newMails, ...mails]);
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

  const getMail = useCallback(
    (mailId: string, userId: string) =>
      mails.find((mail) => mail.id === mailId && mail.userId === userId),
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

  const markAllRead = useCallback(
    (userId: string) => {
      const next = mails.map((mail) =>
        mail.userId === userId ? { ...mail, read: true } : mail,
      );
      persist(next);
    },
    [mails, persist],
  );

  const sendRecipeApprovedMail = useCallback(
    (editorId: string, recipeId: string, recipeName: string) => {
      const subject = t('mail.approvedSubject');
      const body = t('mail.approvedBody', { recipeName }) as unknown as string;
      appendMails([buildMail(editorId, 'recipe-approved', subject, body, { recipeId })]);
    },
    [appendMails, t],
  );

  const sendRecipeRejectedMail = useCallback(
    (editorId: string, recipeId: string, recipeName: string, reason: string) => {
      const subject = t('mail.rejectedSubject');
      const body = t('mail.rejectedBody', { recipeName }) as unknown as string;
      appendMails([
        buildMail(editorId, 'recipe-rejected', subject, body, {
          recipeId,
          rejectionReason: reason,
        }),
      ]);
    },
    [appendMails, t],
  );

  const sendBroadcastMail = useCallback(
    (
      senderId: string,
      target: BroadcastTarget,
      subject: string,
      body: string,
    ): { count: number; recipients: string[] } => {
      if (!subject.trim() || !body.trim()) {
        throw new AppError('Broadcast empty', 'BROADCAST_EMPTY');
      }
      const users = loadUsers();
      const recipients: StoredUser[] =
        target === 'all' ? users : users.filter((u) => u.role === (target as UserRole));
      const prefixedSubject = (t('mail.broadcastSubjectPrefix') || '') + subject;
      const mailsToAdd = recipients.map((u) =>
        buildMail(u.id, 'broadcast', prefixedSubject, body, {
          senderId,
          broadcastTarget: target,
        }),
      );
      appendMails(mailsToAdd);
      return { count: recipients.length, recipients: recipients.map((u) => u.id) };
    },
    [appendMails, t],
  );

  const banUser = useCallback(
    (userId: string, reason: string, until?: string, actorId?: string): StoredUser => {
      const users = loadUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx === -1) throw new AppError('User not found', 'USER_NOT_FOUND');
      const updated: StoredUser = { ...users[idx], status: 'banned' };
      users[idx] = updated;
      saveUsers(users);
      void actorId;
      void reason;
      void until;
      return updated;
    },
    [],
  );

  const sendBanNoticeMail = useCallback(
    (
      userId: string,
      reason: string,
      until?: string,
    ): { banUntil?: string; permanent: boolean } => {
      const permanent = !until;
      const untilLabel = permanent ? t('ban.permanent') : until;
      const subject = t('mail.banSubject');
      const body = t('mail.banBody', { reason, until: untilLabel }) as unknown as string;
      appendMails([
        buildMail(userId, 'ban-notice', subject, body, {
          banReason: reason,
          banUntil: permanent ? 'permanent' : until,
        }),
      ]);
      return { banUntil: until, permanent };
    },
    [appendMails, t],
  );

  const incrementWarningCount = useCallback(
    (
      userId: string,
      actorId?: string,
    ): { count: number; banned: boolean } => {
      void actorId;
      const users = loadUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx === -1) throw new AppError('User not found', 'USER_NOT_FOUND');
      const user = users[idx];
      const currentCount = user.warningCount ?? 0;
      const newCount = currentCount + 1;
      const banned = newCount >= THREE_WARNINGS_LIMIT;
      users[idx] = {
        ...user,
        warningCount: newCount,
        status: banned ? 'banned' : user.status,
      };
      saveUsers(users);
      return { count: newCount, banned };
    },
    [],
  );

  const sendWarningMail = useCallback(
    (userId: string, autoBanAtThird: boolean = true): { newCount: number; banned: boolean } => {
      const { count, banned } = incrementWarningCount(userId);
      const subject = t('mail.warningSubject', { count }) as unknown as string;
      const body = t('mail.warningBody', { count }) as unknown as string;
      appendMails([
        buildMail(userId, 'warning', subject, body, { warningCount: count }),
      ]);
      if (banned && autoBanAtThird) {
        sendBanNoticeMail(userId, 'Đạt 3 lần cảnh cáo');
      }
      return { newCount: count, banned };
    },
    [appendMails, incrementWarningCount, sendBanNoticeMail, t],
  );

  const sendSupportMail = useCallback(
    (
      userId: string,
      subject: string,
      body: string,
      extras: Pick<MailMessage, 'threadId' | 'appealId'> = {},
    ) => {
      const subjectFinal = subject || t('mail.supportSubject');
      appendMails([buildMail(userId, 'support', subjectFinal, body, extras)]);
    },
    [appendMails, t],
  );

  const unbanUser = useCallback((userId: string, actorId?: string): StoredUser => {
    void actorId;
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new AppError('User not found', 'USER_NOT_FOUND');
    if (users[idx].status !== 'banned') {
      throw new AppError('User is not banned', 'NOT_BANNED');
    }
    const updated: StoredUser = { ...users[idx], status: 'active', warningCount: 0 };
    users[idx] = updated;
    saveUsers(users);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      mails,
      isLoading,
      getInboxForUser,
      getUnreadCount,
      getMail,
      markAsRead,
      markAllRead,
      sendRecipeApprovedMail,
      sendRecipeRejectedMail,
      sendBroadcastMail,
      sendBanNoticeMail,
      sendWarningMail,
      sendSupportMail,
      banUser,
      unbanUser,
      incrementWarningCount,
    }),
    [
      mails,
      isLoading,
      getInboxForUser,
      getUnreadCount,
      getMail,
      markAsRead,
      markAllRead,
      sendRecipeApprovedMail,
      sendRecipeRejectedMail,
      sendBroadcastMail,
      sendBanNoticeMail,
      sendWarningMail,
      sendSupportMail,
      banUser,
      unbanUser,
      incrementWarningCount,
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

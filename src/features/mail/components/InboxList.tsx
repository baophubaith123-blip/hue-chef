import { useMemo, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useMail } from '@/contexts/MailContext';
import { useNotification } from '@/contexts/NotificationContext';
import type { MailMessage, MailType } from '@/features/mail/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/mail/components/InboxList.module.css';

interface InboxListProps {
  userId: string;
  emptyHint?: string;
  headerExtra?: ReactNode;
  emptyAction?: ReactNode;
  baseDetailPath?: string;
  onSelect?: (mailId: string) => void;
}

interface UnifiedItem {
  id: string;
  isNotif: boolean;
  type: string;
  icon: string;
  typeLabel: string;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
  link: string;
  mail?: MailMessage;
}

const TYPE_ICON: Record<MailType, string> = {
  broadcast: '📢',
  'ban-notice': '🚫',
  warning: '⚠️',
  support: '💬',
  'recipe-approved': '✅',
  'recipe-rejected': '📝',
};

export function InboxList({
  userId,
  headerExtra,
  emptyAction,
  emptyHint,
  baseDetailPath = '/inbox',
  onSelect,
}: InboxListProps) {
  const { t, dict } = useTranslation();
  const {
    getInboxForUser,
    markAllRead: markAllMailsRead,
    getUnreadCount: getMailUnreadCount,
    markAsRead: markMailRead,
  } = useMail();
  const {
    listForUser,
    markAllReadForUser,
    markRead: markNotifRead,
    unreadCount: getNotifUnreadCount,
  } = useNotification();
  const navigate = useNavigate();

  const inbox = useMemo(() => getInboxForUser(userId), [userId, getInboxForUser]);
  const notifs = useMemo(() => listForUser(userId), [userId, listForUser]);

  const allItems = useMemo<UnifiedItem[]>(() => {
    const mailItems: UnifiedItem[] = inbox.map((mail) => ({
      id: mail.id,
      isNotif: false,
      type: mail.type,
      icon: TYPE_ICON[mail.type] ?? '✉️',
      typeLabel: dict.mail.typeLabels[mail.type] || mail.type,
      subject: mail.subject || '(No subject)',
      body: mail.body,
      createdAt: mail.createdAt,
      read: mail.read,
      link: `${baseDetailPath}/${mail.id}`,
      mail,
    }));

    const notifItems: UnifiedItem[] = notifs.map((n) => ({
      id: n.id,
      isNotif: true,
      type: n.type,
      icon: n.type === 'achievement.unlocked' ? '🏆' : '🔔',
      typeLabel:
        n.type === 'achievement.unlocked'
          ? (dict.achievements?.title || 'Thành tích')
          : 'Thông báo',
      subject: n.title,
      body: n.body,
      createdAt: n.createdAt,
      read: Boolean(n.readAt),
      link: n.link || '/achievements',
    }));

    return [...mailItems, ...notifItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [inbox, notifs, dict, baseDetailPath]);

  const totalUnread = getMailUnreadCount(userId) + getNotifUnreadCount(userId);

  const handleMarkAll = () => {
    markAllMailsRead(userId);
    markAllReadForUser(userId);
  };

  const handleItemClick = (item: UnifiedItem) => {
    if (item.isNotif) {
      if (!item.read) markNotifRead(item.id);
      if (item.link) navigate(item.link);
    } else {
      if (!item.read && item.mail) markMailRead(item.mail.id, userId);
      onSelect?.(item.id);
      if (item.link) navigate(item.link);
    }
  };

  if (allItems.length === 0) {
    return (
      <EmptyState
        title={t('inbox.empty')}
        description={emptyHint ?? t('inbox.hint')}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            📬 {t('mail.inboxTitle')}
            {totalUnread > 0 ? (
              <span className={styles.unreadBadge} aria-label={`${totalUnread} unread`}>
                {totalUnread}
              </span>
            ) : null}
          </h2>
        </div>
        <div className={styles.headerRight}>
          {totalUnread > 0 ? (
            <Button variant="ghost" onClick={handleMarkAll}>
              {t('common.markRead')} tất cả
            </Button>
          ) : null}
          {headerExtra}
        </div>
      </header>

      <ul className={styles.list}>
        {allItems.map((item) => (
          <li key={item.id}>
            <Link
              className={`${styles.row} ${item.read ? '' : styles.unread}`}
              to={item.link}
              onClick={(e) => {
                e.preventDefault();
                handleItemClick(item);
              }}
            >
              <div className={`${styles.icon} ${styles[`icon_${item.type}`] ?? ''}`} aria-hidden>
                {item.icon}
              </div>
              <div className={styles.body}>
                <div className={styles.meta}>
                  <span className={styles.typeChip}>{item.typeLabel}</span>
                  <span className={styles.date}>
                    {new Date(item.createdAt).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <h3 className={styles.subject}>{item.subject}</h3>
                <p className={styles.preview}>
                  {item.body.slice(0, 120)}
                  {item.body.length > 120 ? '…' : ''}
                </p>
              </div>
              {!item.read ? (
                <span className={styles.dotUnread} aria-label="Unread" />
              ) : (
                <span className={styles.chev}>›</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

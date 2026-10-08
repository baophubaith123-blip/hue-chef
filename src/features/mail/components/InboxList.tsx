import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useMail } from '@/contexts/MailContext';
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
  const { getInboxForUser, markAllRead, getUnreadCount } = useMail();
  const inbox = useMemo(() => getInboxForUser(userId), [userId, getInboxForUser]);
  const unread = getUnreadCount(userId);

  if (inbox.length === 0) {
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
            {unread > 0 ? (
              <span className={styles.unreadBadge} aria-label={`${unread} unread`}>
                {unread}
              </span>
            ) : null}
          </h2>
        </div>
        <div className={styles.headerRight}>
          {unread > 0 ? (
            <Button variant="ghost" onClick={() => markAllRead(userId)}>
              {t('common.markRead')} tất cả
            </Button>
          ) : null}
          {headerExtra}
        </div>
      </header>

      <ul className={styles.list}>
        {inbox.map((mail) => (
          <MailRow
            key={mail.id}
            mail={mail}
            baseDetailPath={baseDetailPath}
            typeLabel={dict.mail.typeLabels[mail.type]}
            onClick={() => onSelect?.(mail.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function MailRow({
  mail,
  baseDetailPath,
  typeLabel,
  onClick,
}: {
  mail: MailMessage;
  baseDetailPath: string;
  typeLabel: string;
  onClick: () => void;
}) {
  const { markAsRead } = useMail();
  const icon = TYPE_ICON[mail.type] ?? '✉️';
  const subject = mail.subject || '(No subject)';

  const handleClick = () => {
    if (!mail.read) markAsRead(mail.id, mail.userId);
    onClick();
  };

  return (
    <li>
      <Link
        className={`${styles.row} ${mail.read ? '' : styles.unread}`}
        to={`${baseDetailPath}/${mail.id}`}
        onClick={handleClick}
      >
        <div className={`${styles.icon} ${styles[`icon_${mail.type}`]}`} aria-hidden>
          {icon}
        </div>
        <div className={styles.body}>
          <div className={styles.meta}>
            <span className={styles.typeChip}>{typeLabel}</span>
            <span className={styles.date}>
              {new Date(mail.createdAt).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          <h3 className={styles.subject}>{subject}</h3>
          <p className={styles.preview}>{mail.body.slice(0, 120)}{mail.body.length > 120 ? '…' : ''}</p>
        </div>
        {!mail.read ? (
          <span className={styles.dotUnread} aria-label="Unread" />
        ) : (
          <span className={styles.chev}>›</span>
        )}
      </Link>
    </li>
  );
}

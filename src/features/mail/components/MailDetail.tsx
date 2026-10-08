import { useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useMail } from '@/contexts/MailContext';
import type { MailMessage } from '@/features/mail/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/mail/components/MailDetail.module.css';

interface MailDetailProps {
  mailId: string;
  userId: string;
  backHref?: string;
  backText?: string;
  extraFooter?: ReactNode;
}

const TYPE_ICON = {
  broadcast: '📢',
  'ban-notice': '🚫',
  warning: '⚠️',
  support: '💬',
  'recipe-approved': '✅',
  'recipe-rejected': '📝',
} as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });
}

export function MailDetail({
  mailId,
  userId,
  backHref = '/inbox',
  backText,
  extraFooter,
}: MailDetailProps) {
  const { t, dict } = useTranslation();
  const { getMail, markAsRead } = useMail();
  const mail: MailMessage | undefined = useMemo(
    () => getMail(mailId, userId),
    [mailId, userId, getMail],
  );

  useEffect(() => {
    if (mail && !mail.read) {
      markAsRead(mail.id, mail.userId);
    }
  }, [mail, markAsRead]);

  const icon = mail ? (TYPE_ICON[mail.type as keyof typeof TYPE_ICON] ?? '✉️') : '✉️';
  const typeLabel = mail ? dict.mail.typeLabels[mail.type] : '';
  const subject = mail?.subject || t('mail.noSubject');

  const Banner = (() => {
    if (!mail) return null;
    switch (mail.type) {
      case 'ban-notice':
        return (
          <div className={`${styles.banner} ${styles.bannerDanger}`}>
            <strong>{dict.ban.reasonLabel}</strong> {mail.banReason ?? '-'}
            <br />
            <strong>{dict.ban.untilLabel}</strong>{' '}
            {mail.banUntil === 'permanent' ? dict.ban.permanent : mail.banUntil ?? dict.ban.permanent}
          </div>
        );
      case 'warning':
        return (
          <div className={`${styles.banner} ${styles.bannerWarning}`}>
            ⚠️ Cảnh báo lần #{mail.warningCount ?? 1}/3 · Nếu vi phạm thêm tài khoản sẽ bị khóa.
          </div>
        );
      case 'recipe-rejected':
        return mail.rejectionReason ? (
          <div className={`${styles.banner} ${styles.bannerMuted}`}>
            <strong>Lý do từ chối: </strong>
            {mail.rejectionReason}
          </div>
        ) : null;
      default:
        return null;
    }
  })();

  return (
    <div className={styles.wrap}>
      <div className={styles.actionsRow}>
        <Link to={backHref} className={styles.backLink}>
          ← {backText ?? t('inbox.back')}
        </Link>
        <Button variant="ghost" onClick={() => history.back()}>
          {t('common.back')}
        </Button>
      </div>

      {!mail ? (
        <Card title={t('inbox.detail')}>
          <p className={styles.notFound}>{t('errors.appealNotFound')}</p>
        </Card>
      ) : (
        <Card>
          <header className={styles.header}>
            <div className={`${styles.icon} ${styles[`icon_${mail.type}`]}`} aria-hidden>
              {icon}
            </div>
            <div className={styles.headerBody}>
              <div className={styles.metaRow}>
                <span className={styles.typeChip}>{typeLabel}</span>
                <span className={styles.date}>{formatDate(mail.createdAt)}</span>
              </div>
              <h2 className={styles.subject}>{subject}</h2>
            </div>
          </header>

          {Banner}

          <div className={styles.body}>
            <p className={styles.bodyText}>{mail.body}</p>
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerMeta}>
              {mail.recipeId ? (
                <Link to={`/editor/recipes/${mail.recipeId}`} className={styles.footerLink}>
                  📋 Xem công thức #{mail.recipeId}
                </Link>
              ) : null}
              {mail.threadId ? (
                <Link to={`/support/chat?threadId=${mail.threadId}`} className={styles.footerLink}>
                  💬 Mở hội thoại #{mail.threadId}
                </Link>
              ) : null}
            </div>
            {extraFooter}
          </footer>
        </Card>
      )}
    </div>
  );
}

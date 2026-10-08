import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useMail } from '@/contexts/MailContext';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/mail/components/BanNoticePopup.module.css';

interface BanNoticePopupProps {
  isOpen: boolean;
  onAfterLogout?: () => void;
  extraContent?: ReactNode;
}

export function BanNoticePopup({
  isOpen,
  onAfterLogout,
  extraContent,
}: BanNoticePopupProps) {
  const { t, dict } = useTranslation();
  const { user, logout } = useAuth();
  const { getInboxForUser } = useMail();

  const { reason, until } = useMemo(() => {
    if (!user) {
      return { reason: '-', until: dict.ban.permanent };
    }
    const banMails = getInboxForUser(user.id).filter((m) => m.type === 'ban-notice');
    const latest = banMails.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
    return {
      reason: latest?.banReason ?? user.status === 'banned' ? 'Vi phạm quy định cộng đồng.' : '-',
      until:
        latest?.banUntil === 'permanent' || !latest?.banUntil
          ? dict.ban.permanent
          : latest.banUntil,
    };
  }, [dict.ban.permanent, getInboxForUser, user]);

  return (
    <Modal
      title={dict.ban.noticeTitle}
      isOpen={isOpen}
      footer={
        <div className={styles.footer}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              logout();
              onAfterLogout?.();
            }}
            fullWidth
          >
            {t('auth.logout')}
          </Button>
          <Link to="/support/chat" className={`${styles.ctaLink} ${styles.ctaPrimary}`}>
            {dict.ban.contactSupport} →
          </Link>
        </div>
      }
    >
      <div className={styles.content}>
        <div className={styles.banner}>🚫 {dict.roles.banned ?? 'TÀI KHOẢN ĐÃ BỊ KHÓA'}</div>
        <p className={styles.body}>{dict.ban.noticeBody}</p>

        <dl className={styles.infoList}>
          <dt>{dict.ban.reasonLabel}</dt>
          <dd>{reason}</dd>
          <dt>{dict.ban.untilLabel}</dt>
          <dd className={until === dict.ban.permanent ? styles.permanent : ''}>{until}</dd>
        </dl>

        <p className={styles.hint}>
          💡 Nếu bạn cho rằng đây là lỗi, bấm <strong>{dict.ban.contactSupport}</strong> bên dưới để trò chuyện
          trực tiếp với nhân viên hỗ trợ. Họ sẽ tạo phiếu khiếu nại và gửi cho quản trị viên xem xét.
        </p>

        {extraContent}
      </div>
    </Modal>
  );
}

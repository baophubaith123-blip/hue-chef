import { useMemo } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useMail } from '@/contexts/MailContext';
import { useTranslation } from '@/i18n/useTranslation';
import { AppError } from '@/lib/errors';

import styles from '@/features/mail/components/WarningPopup.module.css';

interface WarningPopupProps {
  isOpen: boolean;
  count: number;
  onClose: () => void;
  onAfterAutoBan?: () => void;
}

export function WarningPopup({
  isOpen,
  count,
  onClose,
  onAfterAutoBan,
}: WarningPopupProps) {
  const { t, dict } = useTranslation();
  const { user, logout } = useAuth();
  const { incrementWarningCount, sendBanNoticeMail, banUser, sendWarningMail } = useMail();

  const safeCount = count >= 3 ? 3 : count <= 0 ? 1 : count;

  const title = useMemo(
    () => (typeof dict.warning.popupTitle === 'function' ? dict.warning.popupTitle(safeCount) : `⚠️ Cảnh báo lần ${safeCount}/3`),
    [dict.warning.popupTitle, safeCount],
  );
  const body = useMemo(
    () => (typeof dict.warning.popupBody === 'function' ? dict.warning.popupBody(safeCount) : ''),
    [dict.warning.popupBody, safeCount],
  );
  const buttonLabel = useMemo(
    () => (typeof dict.warning.ackButton === 'function' ? dict.warning.ackButton(safeCount) : t('common.ok')),
    [dict.warning.ackButton, safeCount, t],
  );
  const critical = safeCount >= 3;

  const handleAck = () => {
    try {
      if (!user) return onClose();
      if (critical) {
        try {
          const updated = banUser(user.id, 'Đạt 3 cảnh báo', 'permanent', 'system');
          sendBanNoticeMail(user.id, updated.status === 'banned' ? 'Tự động khóa do 3 cảnh cáo' : '3 cảnh cáo accum');
          setTimeout(() => {
            logout();
            onAfterAutoBan?.();
          }, 150);
        } catch (err) {
          if (err instanceof AppError) {
            logout();
            onAfterAutoBan?.();
          }
        }
      } else {
        const { banned } = sendWarningMail(user.id);
        if (banned) {
          setTimeout(() => {
            logout();
            onAfterAutoBan?.();
          }, 150);
        }
      }
    } finally {
      onClose();
    }
    void incrementWarningCount;
  };

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={critical ? undefined : onClose}
      footer={
        <div className={styles.footer}>
          {!critical ? (
            <Button type="button" variant="ghost" onClick={onClose}>
              Để sau
            </Button>
          ) : null}
          <Button
            type="button"
            variant={critical ? 'primary' : 'secondary'}
            fullWidth={critical}
            onClick={handleAck}
            className={critical ? styles.ctaDanger : ''}
          >
            {buttonLabel}
          </Button>
        </div>
      }
    >
      <div className={`${styles.content} ${critical ? styles.critical : ''}`}>
        <div className={critical ? styles.bannerDanger : styles.bannerWarn}>
          <span className={styles.bannerCount}>{safeCount}/3</span>
          {critical ? 'SẮP BỊ KHÓA TÀI KHOẢN' : 'LƯU Ý VI PHẠM'}
        </div>
        <p className={styles.body}>{body}</p>
        {critical ? (
          <ul className={styles.steps}>
            <li>⚠️ Tài khoản sẽ bị khóa vĩnh viễn sau khi bạn xác nhận.</li>
            <li>💬 Nếu cho đây là lỗi, <strong>liên hệ hỗ trợ</strong> để được xem xét.</li>
          </ul>
        ) : (
          <p className={styles.hint}>
            📌 Hãy đọc lại và tuân thủ quy định cộng đồng. Vi phạm tới lần 3 tài khoản sẽ bị khóa
            tự động và không thể khôi phục.
          </p>
        )}
      </div>
    </Modal>
  );
}

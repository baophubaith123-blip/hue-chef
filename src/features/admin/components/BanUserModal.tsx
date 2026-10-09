import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/admin/components/BanUserModal.module.css';

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, until: string | 'permanent') => void;
  userName: string;
}

export function BanUserModal({ isOpen, onClose, onSubmit, userName }: BanUserModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);

  const handleReasonChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setReason(event.target.value);
  };

  const handleUntilChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUntil(event.target.value);
  };

  const handlePermanentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.checked;
    setIsPermanent(next);
    if (next) {
      setUntil('');
    }
  };

  const resetForm = () => {
    setReason('');
    setUntil('');
    setIsPermanent(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const untilValue: string | 'permanent' = isPermanent ? 'permanent' : until;
    onSubmit(reason.trim(), untilValue);
    resetForm();
  };

  const canSubmit = reason.trim().length > 0 && (isPermanent || until.length > 0);

  return (
    <Modal
      title={`${t('admin.banUser')}: ${userName}`}
      isOpen={isOpen}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="ban-form" disabled={!canSubmit}>
            {t('admin.banUser')}
          </Button>
        </>
      }
    >
      <form id="ban-form" className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="ban-reason" className={styles.label}>
            {t('admin.banReason')}
          </label>
          <textarea
            id="ban-reason"
            className={styles.textarea}
            value={reason}
            onChange={handleReasonChange}
            rows={4}
            required
            placeholder={t('admin.banReason')}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="ban-until" className={styles.label}>
            {t('admin.banUntil')}
          </label>
          <input
            id="ban-until"
            type="date"
            className={styles.input}
            value={until}
            onChange={handleUntilChange}
            disabled={isPermanent}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className={styles.checkboxField}>
          <input
            id="ban-permanent"
            type="checkbox"
            className={styles.checkbox}
            checked={isPermanent}
            onChange={handlePermanentChange}
          />
          <label htmlFor="ban-permanent" className={styles.checkboxLabel}>
            {t('admin.banPermanent')}
          </label>
        </div>
      </form>
    </Modal>
  );
}

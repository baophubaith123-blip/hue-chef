import { useEffect } from 'react';

import styles from '@/components/Toast.module.css';

export interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
  duration?: number;
}

export function Toast({ message, type = 'info', onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (duration <= 0 || !onClose) return;
    const timer = window.setTimeout(() => {
      onClose();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  const typeClass =
    type === 'success'
      ? styles.success
      : type === 'warning'
        ? styles.warning
        : type === 'error'
          ? styles.error
          : styles.info;

  return (
    <div
      className={`${styles.toast} ${typeClass}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <span className={styles.message}>{message}</span>
      {onClose ? (
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

import styles from '@/components/theme-d/Toast.module.css';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  tone?: ToastTone;
  className?: string;
}

/** Theme D toast — paper slip pinned with a gold tack (Kế hoạch 1, Phần 2.2). */
export function Toast({ message, tone = 'info', className = '' }: ToastProps) {
  return (
    <div className={`${styles.toast} ${styles[tone]} ${className}`} role="status">
      <span className={styles.icon} aria-hidden>
        {tone === 'success' ? '✓' : tone === 'error' ? '!' : 'i'}
      </span>
      <span className={styles.message}>{message}</span>
    </div>
  );
}

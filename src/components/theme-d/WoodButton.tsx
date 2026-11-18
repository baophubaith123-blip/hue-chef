import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from '@/components/theme-d/Buttons.module.css';

interface WoodButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
}

/** Theme D secondary action button — wooden face, cream text (Kế hoạch 1, Phần 2.2). */
export function WoodButton({ loading = false, disabled, children, className = '', type = 'button', ...rest }: WoodButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.woodButton} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : null}
      <span className={styles.label}>{children}</span>
    </button>
  );
}

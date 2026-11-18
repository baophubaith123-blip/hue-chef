import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from '@/components/theme-d/Buttons.module.css';

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
}

/** Theme D primary action button — gold face, dark brown text (Kế hoạch 1, Phần 2.2). */
export function GoldButton({ loading = false, disabled, children, className = '', type = 'button', ...rest }: GoldButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.goldButton} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : null}
      <span className={styles.label}>{children}</span>
    </button>
  );
}

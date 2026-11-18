import type { ReactNode } from 'react';

import styles from '@/components/theme-d/Badge.module.css';

interface BadgeProps {
  children: ReactNode;
  tone?: 'gold' | 'brick' | 'paper' | 'cok';
  className?: string;
}

/** Theme D small badge — achievement tags, status chips (Kế hoạch 1, Phần 2.2). */
export function Badge({ children, tone = 'gold', className = '' }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]} ${className}`}>{children}</span>;
}

import type { ReactNode } from 'react';

import styles from '@/components/theme-d/KraftCard.module.css';

interface KraftCardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

/** Theme D kraft paper card — dish detail, quiz, inbox, result panels (Kế hoạch 1, Phần 2.2). */
export function KraftCard({ children, className = '', as = 'div' }: KraftCardProps) {
  const Tag = as;
  return <Tag className={`${styles.card} ${className}`}>{children}</Tag>;
}

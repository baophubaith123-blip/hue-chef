import type { ReactNode } from 'react';

import styles from '@/components/theme-d/WoodSign.module.css';

interface WoodSignProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

/** Theme D wooden signboard — page and stage titles (Kế hoạch 1, Phần 2.2). */
export function WoodSign({ title, subtitle, children, className = '' }: WoodSignProps) {
  return (
    <div className={`${styles.sign} ${className}`}>
      <span className={`${styles.rivet} ${styles.rivetLeft}`} aria-hidden />
      <span className={`${styles.rivet} ${styles.rivetRight}`} aria-hidden />
      <div className={styles.textWrap}>
        <span className={styles.title}>{title}</span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
        {children}
      </div>
    </div>
  );
}

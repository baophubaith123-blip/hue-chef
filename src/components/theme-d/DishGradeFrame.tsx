import type { ReactNode } from 'react';

import styles from '@/components/theme-d/DishGradeFrame.module.css';

export type DishGrade = 1 | 2 | 3 | 4 | 5;

interface DishGradeFrameProps {
  grade: DishGrade;
  gradeLabel: string;
  children: ReactNode;
  className?: string;
}

const GRADE_CLASS: Record<DishGrade, string> = {
  1: styles.grade1,
  2: styles.grade2,
  3: styles.grade3,
  4: styles.grade4,
  5: styles.grade5,
};

/**
 * Theme D dish grade frame — 5 grades from Thường to Đặc biệt (mục 6.11).
 * One shared layered frame set applied to every dish card; the grade is fixed
 * per dish (chốt M3), the player's stars render inside the frame, not on it.
 */
export function DishGradeFrame({ grade, gradeLabel, children, className = '' }: DishGradeFrameProps) {
  return (
    <div className={`${styles.frame} ${GRADE_CLASS[grade]} ${className}`}>
      {grade === 5 ? (
        <span className={styles.sparkles} aria-hidden>
          <span className={`${styles.spark} ${styles.sparkA}`} />
          <span className={`${styles.spark} ${styles.sparkB}`} />
          <span className={`${styles.spark} ${styles.sparkC}`} />
        </span>
      ) : null}
      {grade >= 4 ? <span className={styles.ribbon}>{gradeLabel}</span> : null}
      <div className={styles.inner}>{children}</div>
    </div>
  );
}

import styles from '@/components/theme-d/StepChecklist.module.css';

export type StepStatus = 'done' | 'current' | 'todo';

export interface ChecklistStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface StepChecklistProps {
  steps: ChecklistStep[];
  ariaLabel: string;
}

/** Theme D step checklist — paper scroll with hand-drawn ticks (Kế hoạch 1, Phần 2.2). */
export function StepChecklist({ steps, ariaLabel }: StepChecklistProps) {
  return (
    <ol className={styles.list} aria-label={ariaLabel}>
      {steps.map((step) => (
        <li
          key={step.id}
          className={`${styles.item} ${styles[step.status]}`}
          aria-current={step.status === 'current' ? 'step' : undefined}
        >
          <span className={styles.mark} aria-hidden>
            {step.status === 'done' ? (
              <svg viewBox="0 0 24 24" className={styles.tick} focusable="false">
                <path d="M4 13.2 9.4 18.4 20 6.4" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : step.status === 'current' ? (
              <span className={styles.dot} />
            ) : null}
          </span>
          <span className={styles.label}>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

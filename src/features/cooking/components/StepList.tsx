import type { CookingStep } from '@/data/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/cooking/components/StepList.module.css';

interface StepListProps {
  steps: CookingStep[];
  activeStepIndex: number;
  completedStepIndexes?: number[];
}

export function StepList({ steps, activeStepIndex, completedStepIndexes = [] }: StepListProps) {
  const { t } = useTranslation();

  return (
    <section className={styles.steps} aria-label={t('cooking.steps')}>
      <h2 className={styles.title}>{t('cooking.steps')}</h2>
      <ol className={`${styles.list} scroll-slim`}>
        {steps.map((step, index) => {
          const isDone = completedStepIndexes.includes(index) || index < activeStepIndex;
          const isActive = index === activeStepIndex && !isDone;
          const state = isDone ? 'done' : isActive ? 'active' : 'pending';

          return (
            <li key={step.id} className={[styles.item, styles[state]].filter(Boolean).join(' ')}>
              <span className={styles.order}>{isDone ? '✓' : step.order}</span>
              <div>
                <p className={styles.stepTitle}>{step.title}</p>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

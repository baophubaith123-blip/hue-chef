import type { CookingStep } from '@/data/types';

import styles from '@/features/cooking/components/StepList.module.css';

interface StepListProps {
  steps: CookingStep[];
  activeStepIndex: number;
}

export function StepList({ steps, activeStepIndex }: StepListProps) {
  return (
    <section className={styles.steps} aria-label="Cooking steps">
      <h2 className={styles.title}>Steps</h2>
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const state =
            index < activeStepIndex ? 'done' : index === activeStepIndex ? 'active' : 'pending';
          return (
            <li key={step.id} className={[styles.item, styles[state]].filter(Boolean).join(' ')}>
              <span className={styles.order}>{step.order}</span>
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

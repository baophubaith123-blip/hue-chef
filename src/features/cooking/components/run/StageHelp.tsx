import { useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/cooking/components/run/StageHelp.module.css';

interface StageHelpProps {
  /** Name of the stage the rules belong to (shown in the popup header). */
  stageName: string;
  rules: string[];
  /** Lets the owning stage pause its timers while the popup is open. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * The round "?" button shared by every run stage: all rules and scoring
 * live inside its popup (achievement-detail style) so the play field
 * itself stays free of text.
 */
export function StageHelp({ stageName, rules, onOpenChange }: StageHelpProps) {
  const { dict } = useTranslation();
  const s = dict.cooking.stages;
  const [open, setOpen] = useState(false);

  const setOpenBoth = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <>
      <button
        type="button"
        className={styles.helpBtn}
        aria-label={s.helpAria}
        onClick={() => setOpenBoth(true)}
      >
        ?
      </button>
      {open ? (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={() => setOpenBoth(false)}
        >
          <div
            className={styles.card}
            role="dialog"
            aria-modal="true"
            aria-label={s.helpTitle}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.cardHeader}>
              {s.helpTitle}
              <span className={styles.cardStage}> — {stageName}</span>
            </div>
            <ul className={styles.ruleList}>
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <div className={styles.cardFooter}>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setOpenBoth(false)}
              >
                {s.helpClose}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

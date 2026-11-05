import { useTranslation } from '@/i18n/useTranslation';
import { formatDuration } from '@/lib/format';

import styles from '@/features/cooking/components/CookingTimer.module.css';

interface CookingTimerProps {
  timeRemainingSeconds: number;
  totalDurationSeconds: number;
  isRunning: boolean;
}

export function CookingTimer({
  timeRemainingSeconds,
  totalDurationSeconds,
  isRunning,
}: CookingTimerProps) {
  const { t } = useTranslation();

  const progress =
    totalDurationSeconds > 0
      ? Math.round((timeRemainingSeconds / totalDurationSeconds) * 100)
      : 0;

  const isUrgent = isRunning && timeRemainingSeconds <= 30;

  return (
    <div className={styles.timer}>
      <div className={styles.row}>
        <span className={styles.label}>{t('cooking.timeLeft')}</span>
        <span
          className={[
            styles.value,
            !isRunning ? styles.valuePaused : '',
            isUrgent ? styles.valueUrgent : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {formatDuration(timeRemainingSeconds)}
        </span>
      </div>
      <div className={styles.track} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={[styles.fill, isUrgent ? styles.fillUrgent : ''].filter(Boolean).join(' ')}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

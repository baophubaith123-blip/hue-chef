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
  const progress =
    totalDurationSeconds > 0
      ? Math.round((timeRemainingSeconds / totalDurationSeconds) * 100)
      : 0;

  return (
    <div className={styles.timer}>
      <div className={styles.row}>
        <span className={styles.label}>Time left</span>
        <span className={[styles.value, !isRunning ? styles.valuePaused : ''].filter(Boolean).join(' ')}>
          {formatDuration(timeRemainingSeconds)}
        </span>
      </div>
      <div className={styles.track} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

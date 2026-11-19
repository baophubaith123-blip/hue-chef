import { useEffect, useState } from 'react';

import { KraftCard } from '@/components/theme-d/KraftCard';
import { ghostProgressAt } from '@/features/online/lib/ghost';
import type { GhostRun } from '@/features/online/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/online/components/GhostTicker.module.css';

interface GhostTickerProps {
  ghost: GhostRun;
  /** Epoch ms when the local run started (the ghost runs in parallel). */
  startedAt: number;
}

/**
 * Live ghost ticker (Gói H9, lát B): while the player cooks an answer
 * run, the opponent's recorded run unfolds beside them — current
 * score, current stage and a stage progress bar, ticking twice a
 * second. Kept aria-live="off": it changes constantly and would flood
 * a screen reader.
 */
export function GhostTicker({ ghost, startedAt }: GhostTickerProps) {
  const { dict } = useTranslation();
  const o = dict.online;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = Math.max(0, now - startedAt);
  const progress = ghostProgressAt(ghost, elapsed);
  const completedStages = ghost.stages.filter((s) => s.atMs <= elapsed).length;
  const totalStages = Math.max(1, ghost.stages.length);
  const pct = Math.min(100, Math.round((completedStages / totalStages) * 100));
  const stageName = progress.stageKey
    ? (o.ghostStageNames[progress.stageKey] ?? progress.stageKey)
    : null;

  return (
    <div aria-live="off">
      <KraftCard className={styles.card}>
        <div className={styles.head}>
          <span className={styles.title}>{o.ghostTitle}</span>
          <span className={styles.score}>{o.ghostScore(progress.score)}</span>
        </div>
        {progress.finished ? (
          <p className={styles.stage}>{o.ghostFinished}</p>
        ) : stageName ? (
          <p className={styles.stage}>{stageName}</p>
        ) : null}
        <div
          className={styles.track}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        </div>
      </KraftCard>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

import {
  seasonSweepMs,
  seasonZoneRatio,
} from '@/features/cooking/lib/stage-config';
import { seasonBonusFor } from '@/features/cooking/lib/stage-bonus';
import { useTranslation } from '@/i18n/useTranslation';
import { playSound } from '@/lib/sound';

import styles from '@/features/cooking/components/run/SeasonBar.module.css';

export type SeasonOutcome = 'perfect' | 'good' | 'miss';

interface SeasonBarProps {
  /** The step's action label, e.g. "Hầm thịt & xương". */
  stepLabel: string;
  /** Points the step itself is worth (bonus is up to +50% of this). */
  stepPoints: number;
  difficulty: number;
  ingredientCount: number;
  /** Equipped-perk multiplier for the gold zone width (1 = no perk). */
  zoneScale?: number;
  onResult: (outcome: SeasonOutcome, bonus: number) => void;
}

/**
 * Stage ③ seasoning bar: after a step's ingredients are in the pot and the
 * action button is pressed, a needle sweeps the bar — stop it in the gold
 * zone. Steps with more ingredients (and harder dishes) sweep faster with
 * a narrower zone. A far miss earns nothing and the step must be seasoned
 * again; the step's own points are never at risk.
 */
export function SeasonBar({
  stepLabel,
  stepPoints,
  difficulty,
  ingredientCount,
  zoneScale = 1,
  onResult,
}: SeasonBarProps) {
  const { dict } = useTranslation();
  const s = dict.cooking.stages;

  const sweepMs = seasonSweepMs(difficulty, ingredientCount);
  const zoneRatio = Math.min(0.6, seasonZoneRatio(difficulty, ingredientCount) * zoneScale);
  const zoneHalf = zoneRatio / 2;
  const [zoneCenter] = useState(() => 0.34 + Math.random() * 0.32);
  const [pos, setPos] = useState(0);
  const [outcome, setOutcome] = useState<SeasonOutcome | null>(null);

  const posRef = useRef(0);
  const outcomeRef = useRef<SeasonOutcome | null>(null);
  const reportedRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (outcomeRef.current) return;
      const cycle = ((now - start) % (sweepMs * 2)) / sweepMs; // 0..2
      const p = cycle <= 1 ? cycle : 2 - cycle;
      posRef.current = p;
      setPos(p);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sweepMs]);

  const handleStop = () => {
    if (outcomeRef.current) return;
    const d = Math.abs(posRef.current - zoneCenter);
    const goodWindow = zoneHalf * 1.7;
    let next: SeasonOutcome;
    let bonus = 0;
    if (d <= zoneHalf * 0.5) {
      next = 'perfect';
      bonus = seasonBonusFor(stepPoints, 1);
    } else if (d <= goodWindow) {
      next = 'good';
      bonus = seasonBonusFor(stepPoints, 1 - d / goodWindow);
    } else {
      next = 'miss';
    }
    outcomeRef.current = next;
    setOutcome(next);
    playSound(next === 'miss' ? 'error' : 'success');
    window.setTimeout(() => {
      if (reportedRef.current) return;
      reportedRef.current = true;
      onResult(next, bonus);
    }, 1050);
  };

  const outcomeText =
    outcome === 'perfect'
      ? `🌟 ${s.seasonPerfect}`
      : outcome === 'good'
        ? `😋 ${s.seasonGood}`
        : outcome === 'miss'
          ? `😖 ${s.seasonMiss}`
          : null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label={s.seasonName}>
        <h3 className={styles.title}>🧂 {s.seasonName}</h3>
        <p className={styles.prompt}>{s.seasonPrompt(stepLabel)}</p>
        <div className={styles.track}>
          <div
            className={styles.zone}
            style={{
              left: `${(zoneCenter - zoneHalf) * 100}%`,
              width: `${zoneRatio * 100}%`,
            }}
          >
            <div className={styles.zoneCore} />
          </div>
          <div
            className={[
              styles.needle,
              outcome === 'perfect'
                ? styles.needlePerfect
                : outcome === 'miss'
                  ? styles.needleMiss
                  : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ left: `${pos * 100}%` }}
          />
        </div>
        {outcomeText ? (
          <p
            className={[
              styles.outcome,
              outcome === 'miss' ? styles.outcomeMiss : styles.outcomeGood,
            ].join(' ')}
          >
            {outcomeText}
          </p>
        ) : (
          <button type="button" className={styles.stopBtn} onClick={handleStop}>
            🧂 {s.seasonStop}
          </button>
        )}
      </div>
    </div>
  );
}

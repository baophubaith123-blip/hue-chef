import { useRef, useState } from 'react';

import type { GestureModuleProps } from '@/features/gestures/engine/types';
import { clamp01, scoreFromMetrics } from '@/features/gestures/engine/scoring';
import { useDeadline, useRafLoop } from '@/features/gestures/engine/hooks';
import { PrecisionStop } from '@/features/gestures/actions/shared';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/gestures/Gestures.module.css';

/* ------------------------------------------------------------------ */
/* Chiên / lật mặt — tap when the growing ring meets the rim (#5).     */
/* ------------------------------------------------------------------ */

export function ChienGesture({ params, mode, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const growMs = Math.round(2350 - (0.3 - params.zone) * 5200);
  const [growth, setGrowth] = useState(0);
  const [round, setRound] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const startRef = useRef(performance.now());
  const stats = useRef({ acc: [] as number[], faults: 0 });
  const doneRef = useRef(false);

  const finish = (partial: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stats.current;
    const accuracy = s.acc.length ? s.acc.reduce((a, b) => a + b, 0) / s.acc.length : 0.3;
    onDone(
      scoreFromMetrics({
        completion: partial ? clamp01(s.acc.length / params.count) : 1,
        accuracy,
        rhythm: 0.8,
        faults: s.faults,
      }),
    );
  };

  useDeadline(params.maxMs, () => finish(true));

  const growthNow = () => Math.min(1.3, (performance.now() - startRef.current) / growMs);

  const resolveRound = (acc: number, fault: boolean, label: string) => {
    stats.current.acc.push(acc);
    if (fault) stats.current.faults += 1;
    setFlash(label);
    window.setTimeout(() => setFlash(null), 420);
    if (stats.current.acc.length >= params.count) {
      finish(false);
      return;
    }
    setRound((r) => r + 1);
    startRef.current = performance.now();
    setGrowth(0);
  };

  useRafLoop(() => {
    if (doneRef.current || mode === 'button') return;
    const value = growthNow();
    setGrowth(value);
    if (value >= 1.3) {
      // Left far too long — that side burns (catalog: trượt hẳn = cháy).
      resolveRound(0, true, '🔥');
    }
  });

  if (mode === 'button') {
    return <PrecisionStop rounds={params.count} sweepMs={growMs} onDone={onDone} />;
  }

  const handleTap = () => {
    if (doneRef.current) return;
    const value = growthNow();
    const acc = clamp01(1 - Math.abs(value - 1) / 0.38);
    resolveRound(acc, acc < 0.2, acc >= 0.75 ? '🌟' : acc >= 0.4 ? '👍' : '🫤');
  };

  return (
    <div
      className={styles.ringStage}
      onPointerDown={handleTap}
      role="application"
      aria-label="flip"
    >
      <div className={styles.panDisc}>
        <div
          className={styles.growRing}
          style={{ transform: `scale(${Math.max(0.08, growth)})` }}
          aria-hidden
        />
        <span className={styles.panFood} aria-hidden>
          🐟
        </span>
        <span className={styles.targetRim} aria-hidden />
      </div>
      {flash ? (
        <span className={styles.flashBig} aria-hidden>
          {flash}
        </span>
      ) : null}
      <span className={styles.countBadge}>
        {g.progressOf(Math.min(round + 1, params.count), params.count)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Luộc / chần — hold to dip, release to lift in the window (#10).     */
/* ------------------------------------------------------------------ */

export function LuocGesture({ params, mode, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const sweepMs = Math.round(2500 - (0.3 - params.zone) * 3200);
  const zoneCenter = 0.58;
  const zoneHalf = params.zone / 2 + 0.03;
  const [needle, setNeedle] = useState(0);
  const [dipping, setDipping] = useState(false);
  const [round, setRound] = useState(0);
  const holdStartRef = useRef(0);
  const stats = useRef({ acc: [] as number[], faults: 0 });
  const doneRef = useRef(false);

  const finish = (partial: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stats.current;
    const accuracy = s.acc.length ? s.acc.reduce((a, b) => a + b, 0) / s.acc.length : 0.3;
    onDone(
      scoreFromMetrics({
        completion: partial ? clamp01(s.acc.length / params.count) : 1,
        accuracy,
        rhythm: 0.8,
        faults: s.faults,
      }),
    );
  };

  useDeadline(params.maxMs, () => finish(true));

  useRafLoop(() => {
    if (doneRef.current || !dipping) return;
    const value = Math.min(1, (performance.now() - holdStartRef.current) / sweepMs);
    setNeedle(value);
    if (value >= 1) {
      // Held far too long — the food goes mushy (catalog: muộn = nhũn).
      stats.current.acc.push(0.12);
      stats.current.faults += 1;
      setDipping(false);
      setNeedle(0);
      if (stats.current.acc.length >= params.count) finish(false);
      else setRound((r) => r + 1);
    }
  });

  if (mode === 'button') {
    return <PrecisionStop rounds={params.count} sweepMs={sweepMs} onDone={onDone} />;
  }

  const handleDown = () => {
    if (doneRef.current || dipping) return;
    holdStartRef.current = performance.now();
    setDipping(true);
  };

  const handleUp = () => {
    if (doneRef.current || !dipping) return;
    setDipping(false);
    const value = Math.min(1, (performance.now() - holdStartRef.current) / sweepMs);
    const acc = clamp01(1 - Math.abs(value - zoneCenter) / 0.45);
    stats.current.acc.push(acc);
    setNeedle(0);
    if (stats.current.acc.length >= params.count) {
      finish(false);
      return;
    }
    setRound((r) => r + 1);
  };

  return (
    <div
      className={styles.dipStage}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
      role="application"
      aria-label="blanch"
    >
      <div className={styles.dipPot}>
        <span
          className={styles.dipFood}
          style={{ transform: `translate(-50%, ${dipping ? 26 : -8}px)` }}
          aria-hidden
        >
          🥬
        </span>
        <span className={styles.dipWater} aria-hidden>
          {dipping ? '🫧🫧🫧' : '💧'}
        </span>
      </div>
      <div className={styles.needleBar}>
        <div
          className={styles.needleZone}
          style={{
            left: `${(zoneCenter - zoneHalf) * 100}%`,
            width: `${zoneHalf * 2 * 100}%`,
          }}
        />
        <div className={styles.needleMark} style={{ left: `${needle * 100}%` }} />
      </div>
      <span className={styles.countBadge}>
        {g.progressOf(Math.min(round + 1, params.count), params.count)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chạm theo nhịp — tap as the light ring closes to the centre (#14).  */
/* ------------------------------------------------------------------ */

export function ChamNhipGesture({ params, mode, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const beatMs = Math.round(1550 - (0.3 - params.zone) * 2600);
  const [scale, setScale] = useState(1.7);
  const [beat, setBeat] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const startRef = useRef(performance.now());
  const stats = useRef({ acc: [] as number[], faults: 0, streak: 0, peakStreak: 0 });
  const doneRef = useRef(false);
  const resolvedRef = useRef(false);

  const finish = (partial: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stats.current;
    const accuracy = s.acc.length ? s.acc.reduce((a, b) => a + b, 0) / s.acc.length : 0.3;
    onDone(
      scoreFromMetrics({
        completion: partial ? clamp01(s.acc.length / params.count) : 1,
        accuracy,
        rhythm: clamp01(s.peakStreak / params.count),
        faults: s.faults,
      }),
    );
  };

  useDeadline(params.maxMs, () => finish(true));

  const nextBeat = (acc: number, fault: boolean, label: string) => {
    const s = stats.current;
    s.acc.push(acc);
    if (fault) {
      s.faults += 1;
      s.streak = 0;
    } else if (acc >= 0.6) {
      s.streak += 1;
      s.peakStreak = Math.max(s.peakStreak, s.streak);
    } else {
      s.streak = 0;
    }
    setFlash(label);
    window.setTimeout(() => setFlash(null), 380);
    if (s.acc.length >= params.count) {
      finish(false);
      return;
    }
    setBeat((b) => b + 1);
    startRef.current = performance.now();
    resolvedRef.current = false;
    setScale(1.7);
  };

  useRafLoop(() => {
    if (doneRef.current || resolvedRef.current || mode === 'button') return;
    const t = (performance.now() - startRef.current) / beatMs;
    const value = 1.7 - t * 1.15;
    setScale(Math.max(0.55, value));
    if (value <= 0.62) {
      resolvedRef.current = true;
      nextBeat(0, true, '💨');
    }
  });

  if (mode === 'button') {
    return <PrecisionStop rounds={params.count} sweepMs={beatMs} onDone={onDone} />;
  }

  const handleTap = () => {
    if (doneRef.current || resolvedRef.current) return;
    resolvedRef.current = true;
    const acc = clamp01(1 - Math.abs(scale - 1) / 0.45);
    nextBeat(acc, acc < 0.2, acc >= 0.75 ? '🌟' : acc >= 0.4 ? '👍' : '🫤');
  };

  return (
    <div
      className={styles.ringStage}
      onPointerDown={handleTap}
      role="application"
      aria-label="rhythm tap"
    >
      <div className={styles.beatTarget}>
        <div
          className={styles.shrinkRing}
          style={{ transform: `scale(${scale})` }}
          aria-hidden
        />
        <span className={styles.beatCenter} aria-hidden>
          🥚
        </span>
      </div>
      {flash ? (
        <span className={styles.flashBig} aria-hidden>
          {flash}
        </span>
      ) : null}
      <span className={styles.countBadge}>
        {g.progressOf(Math.min(beat + 1, params.count), params.count)}
      </span>
    </div>
  );
}

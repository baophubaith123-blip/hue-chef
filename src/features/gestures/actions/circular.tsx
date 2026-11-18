import { useRef, useState } from 'react';

import type { GestureModuleProps } from '@/features/gestures/engine/types';
import { clamp01, scoreFromMetrics } from '@/features/gestures/engine/scoring';
import { useDeadline } from '@/features/gestures/engine/hooks';
import { PrecisionStop } from '@/features/gestures/actions/shared';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/gestures/Gestures.module.css';

/* ------------------------------------------------------------------ */
/* Khuấy đều — drag in circles around the pot (catalog #1).            */
/* ------------------------------------------------------------------ */

export function KhuayGesture({ params, mode, onDone }: GestureModuleProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [revolutions, setRevolutions] = useState(0);
  const [spoonAngle, setSpoonAngle] = useState(-30);
  const stats = useRef({
    totalAbs: 0,
    lastAngle: null as number | null,
    inBand: 0,
    samples: 0,
    revDurations: [] as number[],
    revStart: 0,
    faults: 0,
    lastFaultAt: 0,
  });
  const doneRef = useRef(false);

  const finish = (partial: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stats.current;
    const completion = partial
      ? clamp01(s.totalAbs / (Math.PI * 2) / params.count)
      : 1;
    const accuracy = s.samples > 0 ? s.inBand / s.samples : 0.5;
    let rhythm = 0.7;
    if (s.revDurations.length >= 2) {
      const mean = s.revDurations.reduce((a, b) => a + b, 0) / s.revDurations.length;
      const variance =
        s.revDurations.reduce((sum, v) => sum + (v - mean) ** 2, 0) / s.revDurations.length;
      rhythm = clamp01(1 - Math.sqrt(variance) / Math.max(1, mean));
    }
    onDone(scoreFromMetrics({ completion, accuracy, rhythm, faults: s.faults }));
  };

  useDeadline(params.maxMs, () => finish(true));

  if (mode === 'button') {
    return <PrecisionStop rounds={params.count} sweepMs={1500} onDone={onDone} />;
  }

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (doneRef.current || event.buttons === 0 || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const radiusRatio = Math.hypot(dx, dy) / (rect.width / 2);
    const angle = Math.atan2(dy, dx);
    const s = stats.current;
    s.samples += 1;
    if (radiusRatio >= 0.42 && radiusRatio <= 1.05) {
      s.inBand += 1;
    } else if (performance.now() - s.lastFaultAt > 350) {
      // Spoon splashing outside the rim (catalog: ra khỏi vòng nồi là lỗi).
      s.faults += 1;
      s.lastFaultAt = performance.now();
    }
    if (s.lastAngle !== null) {
      let delta = angle - s.lastAngle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      const before = Math.floor(s.totalAbs / (Math.PI * 2));
      s.totalAbs += Math.abs(delta);
      const after = Math.floor(s.totalAbs / (Math.PI * 2));
      if (after > before) {
        const now = performance.now();
        if (s.revStart > 0) s.revDurations.push(now - s.revStart);
        s.revStart = now;
      }
      setRevolutions(s.totalAbs / (Math.PI * 2));
      if (s.totalAbs / (Math.PI * 2) >= params.count) {
        finish(false);
        return;
      }
    } else {
      s.revStart = performance.now();
    }
    s.lastAngle = angle;
    setSpoonAngle((angle * 180) / Math.PI);
  };

  return (
    <div
      ref={stageRef}
      className={styles.potStage}
      onPointerDown={handleMove}
      onPointerMove={handleMove}
      role="application"
      aria-label="stir"
    >
      <div className={styles.broth} style={{ transform: `rotate(${revolutions * 140}deg)` }}>
        <span className={styles.brothSwirl} aria-hidden />
      </div>
      <div
        className={styles.spoon}
        style={{ transform: `rotate(${spoonAngle + 90}deg)` }}
        aria-hidden
      >
        🥄
      </div>
      <span className={styles.countBadge}>
        {Math.min(params.count, Math.floor(revolutions))}/{params.count} vòng
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trộn / đảo — drag back and forth across the bowl (catalog #11).     */
/* ------------------------------------------------------------------ */

export function TronGesture({ params, mode, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [passes, setPasses] = useState(0);
  const [offset, setOffset] = useState(0);
  const stats = useRef({
    side: 0, // -1 left reached, +1 right reached, 0 neutral
    maxAmp: 0,
    amps: [] as number[],
    passTimes: [] as number[],
    passes: 0,
  });
  const doneRef = useRef(false);

  const finish = (partial: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stats.current;
    const completion = partial ? clamp01(s.passes / params.count) : 1;
    const accuracy = s.amps.length
      ? clamp01(
          s.amps.reduce((sum, amp) => sum + clamp01((amp - 0.55) / 0.45), 0) / s.amps.length,
        )
      : 0.5;
    let rhythm = 0.7;
    if (s.passTimes.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < s.passTimes.length; i += 1) gaps.push(s.passTimes[i] - s.passTimes[i - 1]);
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const variance = gaps.reduce((sum, v) => sum + (v - mean) ** 2, 0) / gaps.length;
      rhythm = clamp01(1 - Math.sqrt(variance) / Math.max(1, mean));
    }
    onDone(scoreFromMetrics({ completion, accuracy, rhythm, faults: 0 }));
  };

  useDeadline(params.maxMs, () => finish(true));

  if (mode === 'button') {
    return <TronButtons count={params.count} onDone={onDone} />;
  }

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (doneRef.current || event.buttons === 0 || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1; // -1..1
    setOffset(x);
    const s = stats.current;
    s.maxAmp = Math.max(s.maxAmp, Math.abs(x));
    if (x <= -0.55 && s.side !== -1) {
      if (s.side === 1) registerPass();
      s.side = -1;
    } else if (x >= 0.55 && s.side !== 1) {
      if (s.side === -1) registerPass();
      s.side = 1;
    }
  };

  const registerPass = () => {
    const s = stats.current;
    s.amps.push(s.maxAmp);
    s.maxAmp = 0;
    s.passTimes.push(performance.now());
    s.passes += 1;
    setPasses(s.passes);
    if (s.passes >= params.count) finish(false);
  };

  return (
    <div
      ref={stageRef}
      className={styles.bowlStage}
      onPointerDown={handleMove}
      onPointerMove={handleMove}
      role="application"
      aria-label="mix"
    >
      <div className={styles.bowl}>
        <div className={styles.bowlMix} style={{ transform: `translateX(${offset * 26}px)` }} aria-hidden>
          🥗
        </div>
      </div>
      <span className={styles.countBadge}>
        {g.progressOf(Math.min(passes, params.count), params.count)}
      </span>
    </div>
  );
}

/** Button path for trộn: alternate the two side buttons, one full
 * back-and-forth per pair of presses. */
function TronButtons({ count, onDone }: { count: number; onDone: (score: number) => void }) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const [presses, setPresses] = useState(0);
  const pressesRef = useRef(0);
  const stats = useRef({ expected: 'L' as 'L' | 'R', faults: 0, times: [] as number[] });
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stats.current;
    const totalPresses = pressesRef.current;
    let rhythm = 0.7;
    if (s.times.length >= 3) {
      const gaps: number[] = [];
      for (let i = 1; i < s.times.length; i += 1) gaps.push(s.times[i] - s.times[i - 1]);
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const variance = gaps.reduce((sum, v) => sum + (v - mean) ** 2, 0) / gaps.length;
      rhythm = clamp01(1 - Math.sqrt(variance) / Math.max(1, mean));
    }
    onDone(
      scoreFromMetrics({
        completion: Math.floor(totalPresses / 2) / count,
        accuracy: totalPresses / Math.max(1, totalPresses + s.faults),
        rhythm,
        faults: s.faults,
      }),
    );
  };

  useDeadline(30000, finish);

  const press = (side: 'L' | 'R') => {
    if (doneRef.current) return;
    const s = stats.current;
    if (side !== s.expected) {
      s.faults += 1;
      return;
    }
    s.expected = side === 'L' ? 'R' : 'L';
    s.times.push(performance.now());
    pressesRef.current += 1;
    setPresses(pressesRef.current);
    if (Math.floor(pressesRef.current / 2) >= count) finish();
  };

  return (
    <div className={styles.widget}>
      <div className={styles.mixButtons}>
        <button type="button" className={styles.bigWoodBtn} onClick={() => press('L')}>
          ◀ {g.buttonHold}
        </button>
        <button type="button" className={styles.bigWoodBtn} onClick={() => press('R')}>
          {g.buttonHold} ▶
        </button>
      </div>
      <span className={styles.countBadge}>
        {g.progressOf(Math.floor(presses / 2), count)}
      </span>
    </div>
  );
}

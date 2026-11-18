import { useRef, useState } from 'react';

import type { GestureModuleProps } from '@/features/gestures/engine/types';
import { clamp01, scoreFromMetrics } from '@/features/gestures/engine/scoring';
import { useDeadline, useRafLoop } from '@/features/gestures/engine/hooks';
import { BeatButton, PrecisionStop } from '@/features/gestures/actions/shared';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/gestures/Gestures.module.css';

interface SwipeStart {
  x: number;
  y: number;
  at: number;
}

/* ------------------------------------------------------------------ */
/* Xào / hất chảo — sharp upward swipes on the flame beat (catalog #4) */
/* ------------------------------------------------------------------ */

export function XaoGesture({ params, mode, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const beatMs = Math.round(1250 - (0.3 - params.zone) * 1600);
  const [tosses, setTosses] = useState(0);
  const [tossKey, setTossKey] = useState(0);
  const [phase, setPhase] = useState(0);
  const startRef = useRef<SwipeStart | null>(null);
  const stats = useRef({ acc: [] as number[], faults: 0, tossTimes: [] as number[] });
  const doneRef = useRef(false);

  const finish = (partial: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stats.current;
    const accuracy = s.acc.length ? s.acc.reduce((a, b) => a + b, 0) / s.acc.length : 0.4;
    let rhythm = 0.6;
    if (s.tossTimes.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < s.tossTimes.length; i += 1) gaps.push(s.tossTimes[i] - s.tossTimes[i - 1]);
      const dev = gaps.reduce((sum, gap) => sum + Math.abs(gap - beatMs), 0) / gaps.length;
      rhythm = clamp01(1 - dev / beatMs);
    }
    onDone(
      scoreFromMetrics({
        completion: partial ? clamp01(s.acc.length / params.count) : 1,
        accuracy,
        rhythm,
        faults: s.faults,
      }),
    );
  };

  useDeadline(params.maxMs, () => finish(true));
  useRafLoop((now) => {
    if (!doneRef.current) setPhase((now % beatMs) / beatMs);
  });

  if (mode === 'button') {
    return <BeatButton count={params.count} beatMs={beatMs} onDone={onDone} />;
  }

  const handleDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startRef.current = { x: event.clientX, y: event.clientY, at: performance.now() };
  };

  const handleUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start || doneRef.current) return;
    const dy = start.y - event.clientY; // up = positive
    const dt = performance.now() - start.at;
    if (dy > 55 && dt < 420) {
      const p = (performance.now() % beatMs) / beatMs;
      const offset = Math.min(p, 1 - p) * beatMs;
      const acc = clamp01(1 - offset / (beatMs * 0.45));
      stats.current.acc.push(acc);
      stats.current.tossTimes.push(performance.now());
      setTosses(stats.current.acc.length);
      setTossKey((k) => k + 1);
      if (stats.current.acc.length >= params.count) finish(false);
    } else if (dy < -55 && dt < 420) {
      // Swiping down into the flame — a clear mistake (catalog fault).
      stats.current.faults += 1;
    }
  };

  const pulse = 1 - Math.min(phase, 1 - phase) * 2;
  return (
    <div
      className={styles.panStage}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      role="application"
      aria-label="toss"
    >
      <div className={styles.pan}>
        <div key={tossKey} className={styles.tossItems} aria-hidden>
          🥩🧅🌶️
        </div>
        <span
          className={styles.flamePulse}
          style={{ transform: `scale(${0.8 + pulse * 0.5})`, opacity: 0.5 + pulse * 0.5 }}
          aria-hidden
        >
          🔥
        </span>
      </div>
      <span className={styles.countBadge}>
        {g.progressOf(Math.min(tosses, params.count), params.count)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Thái / cắt — downward swipes across the board (catalog #6).         */
/* ------------------------------------------------------------------ */

export function ThaiGesture({ params, mode, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const [slices, setSlices] = useState(0);
  const [warn, setWarn] = useState(false);
  const startRef = useRef<SwipeStart | null>(null);
  const stats = useRef({ acc: [] as number[], faults: 0, times: [] as number[] });
  const doneRef = useRef(false);

  const finish = (partial: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stats.current;
    const accuracy = s.acc.length ? s.acc.reduce((a, b) => a + b, 0) / s.acc.length : 0.4;
    let rhythm = 0.7;
    if (s.times.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < s.times.length; i += 1) gaps.push(s.times[i] - s.times[i - 1]);
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      rhythm = clamp01(1 - Math.abs(mean - 480) / 700);
    }
    onDone(
      scoreFromMetrics({
        completion: partial ? clamp01(s.acc.length / params.count) : 1,
        accuracy,
        rhythm,
        faults: s.faults,
      }),
    );
  };

  useDeadline(params.maxMs, () => finish(true));

  if (mode === 'button') {
    return <PrecisionStop rounds={params.count} sweepMs={1350} onDone={onDone} />;
  }

  const handleDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startRef.current = { x: event.clientX, y: event.clientY, at: performance.now() };
  };

  const handleUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start || doneRef.current) return;
    const dy = event.clientY - start.y; // down = positive
    const dx = event.clientX - start.x;
    const dt = performance.now() - start.at;
    if (dy > 55 && dt < 480) {
      const now = performance.now();
      const last = stats.current.times[stats.current.times.length - 1];
      if (last && now - last < 170) {
        // Slicing too fast in a row risks a cut finger (catalog warning).
        stats.current.faults += 1;
        setWarn(true);
        window.setTimeout(() => setWarn(false), 900);
      }
      stats.current.acc.push(clamp01(1 - Math.abs(dx) / (dy + 1)));
      stats.current.times.push(now);
      setSlices(stats.current.acc.length);
      if (stats.current.acc.length >= params.count) finish(false);
    }
  };

  return (
    <div
      className={styles.boardStage}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      role="application"
      aria-label="slice"
    >
      <div className={styles.board}>
        <span className={styles.boardFood} aria-hidden>
          🥒
        </span>
        <div className={styles.sliceRow} aria-hidden>
          {Array.from({ length: slices }).map((_, idx) => (
            <span key={idx} className={styles.slicePiece} />
          ))}
        </div>
        <span className={styles.guideLine} aria-hidden />
      </div>
      {warn ? (
        <p className={styles.flashWarn} aria-hidden>
          ⚠️
        </p>
      ) : null}
      <span className={styles.countBadge}>
        {g.progressOf(Math.min(slices, params.count), params.count)}
      </span>
    </div>
  );
}

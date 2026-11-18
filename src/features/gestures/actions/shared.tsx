import { useCallback, useEffect, useRef, useState } from 'react';

import { clamp01, scoreFromMetrics } from '@/features/gestures/engine/scoring';
import { useRafLoop } from '@/features/gestures/engine/hooks';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/gestures/Gestures.module.css';

/* ------------------------------------------------------------------ */
/* PrecisionStop — button path for timing actions (chiên, luộc, thái,  */
/* khuấy, hấp, chạm nhịp): a marker sweeps the bar; press the big gold */
/* button to stop it inside the gold zone. Same frame as the gesture.  */
/* ------------------------------------------------------------------ */

interface PrecisionStopProps {
  rounds: number;
  sweepMs: number;
  onDone: (score: number) => void;
}

export function PrecisionStop({ rounds, sweepMs, onDone }: PrecisionStopProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(0);
  const [center, setCenter] = useState(() => 0.34 + Math.random() * 0.32);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const posRef = useRef(0);
  const startRef = useRef(performance.now());
  const accRef = useRef<number[]>([]);
  const rhythmRef = useRef<number[]>([]);
  const doneRef = useRef(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useRafLoop((now) => {
    if (doneRef.current) return;
    const cycle = ((now - startRef.current) % (sweepMs * 2)) / sweepMs;
    const p = cycle <= 1 ? cycle : 2 - cycle;
    posRef.current = p;
    setPos(p);
    // Exposed for the acceptance bot: it reads the live marker position
    // and presses inside the zone, exactly like a player's eye would.
    trackRef.current?.setAttribute('data-pos', p.toFixed(3));
  });

  const finish = useCallback(
    (accuracies: number[], rhythms: number[]) => {
      if (doneRef.current) return;
      doneRef.current = true;
      const accuracy = accuracies.length
        ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
        : 0;
      const rhythm = rhythms.length
        ? rhythms.reduce((a, b) => a + b, 0) / rhythms.length
        : 0.5;
      onDone(
        scoreFromMetrics({
          completion: accuracies.length / rounds,
          accuracy,
          rhythm,
          faults: accuracies.filter((a) => a < 0.25).length,
        }),
      );
    },
    [onDone, rounds],
  );

  // Deadline: bank whatever rounds were stopped in time.
  useEffect(() => {
    const timer = window.setTimeout(() => finish(accRef.current, rhythmRef.current), 30000);
    return () => window.clearTimeout(timer);
  }, [finish]);

  const handlePress = () => {
    if (doneRef.current) return;
    const dist = Math.abs(posRef.current - center);
    const accuracy = clamp01(1 - dist / 0.5);
    accRef.current = [...accRef.current, accuracy];
    const decisionMs = performance.now() - startRef.current;
    rhythmRef.current = [...rhythmRef.current, clamp01(1.15 - decisionMs / sweepMs)];
    setFlash(dist <= 0.09 ? 'hit' : 'miss');
    window.setTimeout(() => setFlash(null), 260);
    if (accRef.current.length >= rounds) {
      finish(accRef.current, rhythmRef.current);
      return;
    }
    setRound((r) => r + 1);
    setCenter(0.34 + Math.random() * 0.32);
    startRef.current = performance.now();
  };

  return (
    <div className={styles.widget}>
      <div
        ref={trackRef}
        className={styles.stopTrack}
        data-testid="precision-track"
        data-pos="0"
        data-center={center.toFixed(3)}
      >
        <div
          className={styles.stopZone}
          style={{ left: `${(center - 0.09) * 100}%`, width: '18%' }}
        />
        <div
          className={[
            styles.stopNeedle,
            flash === 'hit' ? styles.needleHit : flash === 'miss' ? styles.needleMiss : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ left: `${pos * 100}%` }}
        />
      </div>
      <button type="button" className={styles.bigGoldBtn} onClick={handlePress}>
        {g.buttonStop} · {round + 1}/{rounds}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BeatButton — button path for xào (toss on the beat).                */
/* ------------------------------------------------------------------ */

interface BeatButtonProps {
  count: number;
  beatMs: number;
  onDone: (score: number) => void;
}

export function BeatButton({ count, beatMs, onDone }: BeatButtonProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const [phase, setPhase] = useState(0);
  const [hits, setHits] = useState(0);
  const statsRef = useRef({ hits: 0, faults: 0, acc: [] as number[] });
  const doneRef = useRef(false);

  useRafLoop((now) => {
    if (doneRef.current) return;
    setPhase((now % beatMs) / beatMs);
  });

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = statsRef.current;
    const accuracy = s.acc.length ? s.acc.reduce((a, b) => a + b, 0) / s.acc.length : 0;
    onDone(
      scoreFromMetrics({
        completion: s.hits / count,
        accuracy,
        rhythm: clamp01(s.hits / Math.max(1, s.hits + s.faults)),
        faults: s.faults,
      }),
    );
  }, [count, onDone]);

  useEffect(() => {
    const timer = window.setTimeout(finish, 30000);
    return () => window.clearTimeout(timer);
  }, [finish]);

  const handlePress = () => {
    if (doneRef.current) return;
    const offset = Math.min(phase, 1 - phase) * beatMs;
    const accuracy = clamp01(1 - offset / (beatMs * 0.4));
    const s = statsRef.current;
    if (accuracy > 0.3) {
      s.hits += 1;
      s.acc.push(accuracy);
      setHits(s.hits);
      if (s.hits >= count) finish();
    } else {
      s.faults += 1;
    }
  };

  const pulse = 1 - Math.min(phase, 1 - phase) * 2; // 1 at the beat, 0 mid-way
  return (
    <div className={styles.widget}>
      <div className={styles.beatRingWrap} aria-hidden>
        <span
          className={styles.beatRing}
          style={{ transform: `scale(${0.7 + pulse * 0.45})`, opacity: 0.35 + pulse * 0.65 }}
        />
        <span className={styles.beatCore}>🔥</span>
      </div>
      <button type="button" className={styles.bigGoldBtn} onClick={handlePress}>
        {g.buttonToss} · {hits}/{count}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SequencePad — button path for order-based actions (gắp thả, trang  */
/* trí): tap the chips in the order shown on the strip.                */
/* ------------------------------------------------------------------ */

interface SequencePadProps {
  items: string[];
  onDone: (score: number) => void;
}

export function SequencePad({ items, onDone }: SequencePadProps) {
  const [nextIdx, setNextIdx] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const statsRef = useRef({ correct: 0, faults: 0 });
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = statsRef.current;
    onDone(
      scoreFromMetrics({
        completion: s.correct / Math.max(1, items.length),
        accuracy: s.correct / Math.max(1, s.correct + s.faults),
        rhythm: 0.8,
        faults: s.faults,
      }),
    );
  }, [items.length, onDone]);

  useEffect(() => {
    const timer = window.setTimeout(finish, 30000);
    return () => window.clearTimeout(timer);
  }, [finish]);

  const handleTap = (item: string, idx: number) => {
    if (doneRef.current || idx < nextIdx) return;
    if (idx === nextIdx) {
      statsRef.current.correct += 1;
      const next = nextIdx + 1;
      setNextIdx(next);
      if (next >= items.length) finish();
    } else {
      statsRef.current.faults += 1;
      setWrongId(item);
      window.setTimeout(() => setWrongId(null), 300);
    }
  };

  return (
    <div className={styles.widget} data-next={nextIdx}>
      <div className={styles.seqStrip} aria-hidden>
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className={[
              styles.seqStep,
              idx < nextIdx ? styles.seqDone : idx === nextIdx ? styles.seqNow : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {idx + 1}. {item}
          </span>
        ))}
      </div>
      <div className={styles.seqPad}>
        {items.map((item, idx) => (
          <button
            key={`${item}-${idx}`}
            type="button"
            disabled={idx < nextIdx}
            className={[
              styles.seqChip,
              idx < nextIdx ? styles.seqChipDone : '',
              wrongId === item && idx >= nextIdx ? styles.seqChipWrong : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handleTap(item, idx)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DragChips — pointer drag of ingredient chips into one target zone.  */
/* Shared by gắp-thả (pot) and hấp (steamer basket).                   */
/* ------------------------------------------------------------------ */

export interface DragChipsResult {
  placed: number;
  total: number;
  failedDrops: number;
}

interface DragChipsProps {
  items: string[];
  targetLabel: string;
  targetEmoji: string;
  onAllPlaced: (result: DragChipsResult) => void;
  onProgress?: (result: DragChipsResult) => void;
}

interface ChipState {
  x: number;
  y: number;
  placed: boolean;
  dragging: boolean;
}

export function DragChips({ items, targetLabel, targetEmoji, onAllPlaced, onProgress }: DragChipsProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [chips, setChips] = useState<ChipState[]>(() =>
    items.map(() => ({ x: 0, y: 0, placed: false, dragging: false })),
  );
  const dragRef = useRef<{ idx: number; dx: number; dy: number } | null>(null);
  const statsRef = useRef({ placed: 0, failedDrops: 0 });
  const doneRef = useRef(false);

  const report = useCallback(
    (final: boolean) => {
      const result: DragChipsResult = {
        placed: statsRef.current.placed,
        total: items.length,
        failedDrops: statsRef.current.failedDrops,
      };
      if (final) {
        if (!doneRef.current) {
          doneRef.current = true;
          onAllPlaced(result);
        }
      } else {
        onProgress?.(result);
      }
    },
    [items.length, onAllPlaced, onProgress],
  );

  const handleDown = (idx: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    if (chips[idx].placed || doneRef.current) return;
    const chipEl = event.currentTarget;
    const rect = chipEl.getBoundingClientRect();
    dragRef.current = { idx, dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    chipEl.setPointerCapture(event.pointerId);
    setChips((prev) => prev.map((c, i) => (i === idx ? { ...c, dragging: true } : c)));
  };

  const handleMove = (idx: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.idx !== idx || !stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    setChips((prev) =>
      prev.map((c, i) =>
        i === idx
          ? {
              ...c,
              x: event.clientX - stageRect.left - drag.dx,
              y: event.clientY - stageRect.top - drag.dy,
            }
          : c,
      ),
    );
  };

  const handleUp = (idx: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.idx !== idx) return;
    dragRef.current = null;
    const target = targetRef.current?.getBoundingClientRect();
    const inside =
      target &&
      event.clientX >= target.left &&
      event.clientX <= target.right &&
      event.clientY >= target.top &&
      event.clientY <= target.bottom;
    if (inside) {
      statsRef.current.placed += 1;
      setChips((prev) => prev.map((c, i) => (i === idx ? { ...c, placed: true, dragging: false } : c)));
      if (statsRef.current.placed >= items.length) {
        report(true);
      } else {
        report(false);
      }
    } else {
      statsRef.current.failedDrops += 1;
      setChips((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, x: 0, y: 0, dragging: false } : c)),
      );
      report(false);
    }
  };

  return (
    <div ref={stageRef} className={styles.dragStage}>
      <div ref={targetRef} className={styles.dragTarget} data-testid="drag-target">
        <span className={styles.dragTargetEmoji} aria-hidden>
          {targetEmoji}
        </span>
        <span className={styles.dragTargetLabel}>{targetLabel}</span>
        <span className={styles.dragTargetCount}>
          {statsRef.current.placed}/{items.length}
        </span>
      </div>
      <div className={styles.dragTray}>
        {items.map((item, idx) => {
          const chip = chips[idx];
          if (chip.placed) {
            return (
              <div key={`${item}-${idx}`} className={`${styles.dragChip} ${styles.dragChipPlaced}`}>
                ✓ {item}
              </div>
            );
          }
          return (
            <div
              key={`${item}-${idx}`}
              className={`${styles.dragChip} ${chip.dragging ? styles.dragChipActive : ''}`}
              style={
                chip.dragging || chip.x !== 0 || chip.y !== 0
                  ? {
                      transform: `translate(${chip.x}px, ${chip.y}px)`,
                      zIndex: chip.dragging ? 5 : 1,
                    }
                  : undefined
              }
              onPointerDown={handleDown(idx)}
              onPointerMove={handleMove(idx)}
              onPointerUp={handleUp(idx)}
              role="button"
              aria-label={item}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}

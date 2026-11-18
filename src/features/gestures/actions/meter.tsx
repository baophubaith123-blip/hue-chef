import { useRef, useState } from 'react';

import type { GestureModuleProps } from '@/features/gestures/engine/types';
import { clamp01, scoreFromMetrics } from '@/features/gestures/engine/scoring';
import { useDeadline, useRafLoop } from '@/features/gestures/engine/hooks';
import { DragChips } from '@/features/gestures/actions/shared';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/gestures/Gestures.module.css';

/* ------------------------------------------------------------------ */
/* Nêm gia vị — drop the seasoning in, then hold & release on the      */
/* gold mark of the "Nêm chuẩn vị" meter (catalog #2).                 */
/* ------------------------------------------------------------------ */

export function NemGesture({ params, mode, ingredientNames, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const zoneCenter = 0.62;
  const zoneHalf = Math.max(0.08, params.zone * 0.75);
  const [phase, setPhase] = useState<'drop' | 'meter'>(mode === 'button' ? 'meter' : 'drop');
  const [value, setValue] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const holdingRef = useRef(false);
  const holdStartRef = useRef(0);
  const startValueRef = useRef(0);
  const valueRef = useRef(0);
  const stats = useRef({ faults: 0 });
  const doneRef = useRef(false);

  const finish = (acc: number, faults: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(
      scoreFromMetrics({ completion: 1, accuracy: acc, rhythm: 0.85, faults }),
    );
  };

  useDeadline(params.maxMs, () => {
    const acc = clamp01(1 - Math.abs(valueRef.current - zoneCenter) / 0.5);
    finish(acc, stats.current.faults);
  });

  useRafLoop(() => {
    if (!holdingRef.current || doneRef.current) return;
    const elapsed = performance.now() - holdStartRef.current;
    const next = Math.min(1, startValueRef.current + elapsed / 1500);
    valueRef.current = next;
    setValue(next);
    if (next >= 1) {
      holdingRef.current = false;
      stats.current.faults += 1;
      setNote(`🧂 ${g.tooSalty}`);
      finish(clamp01(1 - Math.abs(1 - zoneCenter) / 0.5), stats.current.faults);
    }
  });

  const handleDown = () => {
    if (doneRef.current || phase !== 'meter') return;
    holdingRef.current = true;
    holdStartRef.current = performance.now();
    startValueRef.current = value;
    setNote(null);
  };

  const handleUp = () => {
    if (!holdingRef.current || doneRef.current) return;
    holdingRef.current = false;
    const v = valueRef.current;
    const acc = clamp01(1 - Math.abs(v - zoneCenter) / 0.5);
    if (v > zoneCenter + zoneHalf + 0.08) {
      stats.current.faults += 1;
      setNote(`🧂 ${g.tooSalty}`);
    } else if (v < zoneCenter - zoneHalf - 0.1) {
      setNote(`🧂 ${g.tooBland}`);
    } else {
      setNote(`🧂 ${g.justRight}`);
    }
    window.setTimeout(() => finish(acc, stats.current.faults), 450);
  };

  if (phase === 'drop') {
    return (
      <DragChips
        items={[ingredientNames[0] ?? g.names.nem]}
        targetLabel={g.targetPot}
        targetEmoji="🍲"
        onAllPlaced={() => setPhase('meter')}
      />
    );
  }

  return (
    <div className={styles.widget}>
      <div className={styles.meterTrack}>
        <div
          className={styles.meterZone}
          style={{
            left: `${(zoneCenter - zoneHalf) * 100}%`,
            width: `${zoneHalf * 2 * 100}%`,
          }}
        />
        <div className={styles.meterNeedle} style={{ left: `${value * 100}%` }} />
      </div>
      <button
        type="button"
        className={styles.bigGoldBtn}
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
      >
        🧂 {g.buttonHold}
      </button>
      {note ? <p className={styles.flashNote}>{note}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Giữ lửa — keep the flame needle inside the band (catalog #9).       */
/* ------------------------------------------------------------------ */

export function GiuLuaGesture({ params, mode, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const bandHalf = params.zone / 2;
  const bandLo = 0.5 - bandHalf;
  const bandHi = 0.5 + bandHalf;
  const [value, setValue] = useState(0.5);
  const [keptMs, setKeptMs] = useState(0);
  const valueRef = useRef(0.5);
  const heldRef = useRef(false);
  const stats = useRef({ inBand: 0, elapsed: 0, overheat: 0, faults: 0, exits: 0, wasIn: true });
  const lastRef = useRef(performance.now());
  const doneRef = useRef(false);

  const finish = (partial: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stats.current;
    onDone(
      scoreFromMetrics({
        completion: partial ? clamp01(s.inBand / params.holdMs) : 1,
        accuracy: s.elapsed > 0 ? clamp01(s.inBand / s.elapsed) : 0.5,
        rhythm: clamp01(1 - s.exits * 0.05),
        faults: s.faults,
      }),
    );
  };

  useDeadline(params.maxMs, () => finish(true));

  useRafLoop((now) => {
    if (doneRef.current) return;
    const dt = Math.min(64, now - lastRef.current);
    lastRef.current = now;
    const s = stats.current;
    const drift = Math.sin(now / 620) * 0.1 + Math.sin(now / 173) * 0.045;
    let v = valueRef.current + drift * (dt / 1000);
    v += heldRef.current ? (dt / 1000) * 0.5 : -(dt / 1000) * 0.38;
    v = Math.min(1, Math.max(0, v));
    valueRef.current = v;
    setValue(v);
    s.elapsed += dt;
    const inBand = v >= bandLo && v <= bandHi;
    if (inBand) {
      s.inBand += dt;
      setKeptMs(s.inBand);
      if (!s.wasIn) s.wasIn = true;
    } else if (s.wasIn) {
      s.exits += 1;
      s.wasIn = false;
    }
    if (v > 0.87) {
      s.overheat += dt;
      if (s.overheat >= 800) {
        s.faults += 1;
        s.overheat = 0;
      }
    } else {
      s.overheat = Math.max(0, s.overheat - dt);
    }
    if (s.inBand >= params.holdMs) finish(false);
  });

  const holdProps = {
    onPointerDown: () => {
      heldRef.current = true;
    },
    onPointerUp: () => {
      heldRef.current = false;
    },
    onPointerLeave: () => {
      heldRef.current = false;
    },
  };

  return (
    <div className={styles.widget}>
      <div
        className={styles.flameStage}
        {...(mode === 'gesture' ? holdProps : {})}
        role="application"
        aria-label="hold fire"
      >
        <span
          className={styles.flameBig}
          style={{ transform: `scale(${0.55 + value * 0.9})` }}
          aria-hidden
        >
          🔥
        </span>
        <div className={styles.gaugeTrack}>
          <div
            className={styles.gaugeBand}
            style={{ left: `${bandLo * 100}%`, width: `${params.zone * 100}%` }}
          />
          <div className={styles.gaugeNeedle} style={{ left: `${value * 100}%` }} />
        </div>
      </div>
      {mode === 'button' ? (
        <button type="button" className={styles.bigGoldBtn} {...holdProps}>
          🔥 {g.buttonHold}
        </button>
      ) : null}
      <span className={styles.countBadge}>
        {(keptMs / 1000).toFixed(1)}s / {(params.holdMs / 1000).toFixed(1)}s
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rót / chan — hold to pour, release at the fill mark (catalog #12).  */
/* ------------------------------------------------------------------ */

export function RotGesture({ params, mode, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const target = 0.74;
  const [fill, setFill] = useState(0);
  const [pouring, setPouring] = useState(false);
  const fillRef = useRef(0);
  const lastRef = useRef(0);
  const stats = useRef({ faults: 0 });
  const doneRef = useRef(false);

  const finish = (value: number, faults: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(
      scoreFromMetrics({
        completion: clamp01(value / target),
        accuracy: clamp01(1 - Math.abs(value - target) / 0.5),
        rhythm: 0.85,
        faults,
      }),
    );
  };

  useDeadline(params.maxMs, () => finish(fillRef.current, stats.current.faults));

  useRafLoop((now) => {
    if (!pouring || doneRef.current) {
      lastRef.current = now;
      return;
    }
    const dt = Math.min(64, lastRef.current ? now - lastRef.current : 16);
    lastRef.current = now;
    const wobble = 1 + Math.sin(now / 280) * 0.07;
    const next = Math.min(1, fillRef.current + (dt / 2600) * wobble);
    fillRef.current = next;
    setFill(next);
    if (next >= 1) {
      stats.current.faults += 1; // tràn — poured over the brim
      setPouring(false);
      finish(1, stats.current.faults);
    }
  });

  const holdProps = {
    onPointerDown: () => setPouring(true),
    onPointerUp: () => {
      setPouring(false);
      finish(fillRef.current, stats.current.faults);
    },
    onPointerLeave: () => {
      if (pouring) {
        setPouring(false);
        finish(fillRef.current, stats.current.faults);
      }
    },
  };

  return (
    <div className={styles.widget}>
      <div
        className={styles.pourStage}
        {...(mode === 'gesture' ? holdProps : {})}
        role="application"
        aria-label="pour"
      >
        <span
          className={styles.jug}
          style={{ transform: `rotate(${pouring ? -32 : 0}deg)` }}
          aria-hidden
        >
          🫗
        </span>
        {pouring ? <span className={styles.stream} aria-hidden /> : null}
        <div className={styles.fillBowl}>
          <div className={styles.fillLevel} style={{ height: `${fill * 100}%` }} />
          <div
            className={styles.fillTarget}
            style={{ bottom: `${target * 100}%` }}
            aria-hidden
          />
        </div>
      </div>
      {mode === 'button' ? (
        <button type="button" className={styles.bigGoldBtn} {...holdProps}>
          🫗 {g.buttonPour}
        </button>
      ) : null}
      <span className={styles.countBadge}>{Math.round(fill * 100)}%</span>
    </div>
  );
}

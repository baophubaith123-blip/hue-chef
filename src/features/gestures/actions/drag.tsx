import { useRef, useState } from 'react';

import type { GestureModuleProps } from '@/features/gestures/engine/types';
import { clamp01, scoreFromMetrics } from '@/features/gestures/engine/scoring';
import { useDeadline, useRafLoop } from '@/features/gestures/engine/hooks';
import { DragChips, PrecisionStop, SequencePad } from '@/features/gestures/actions/shared';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/gestures/Gestures.module.css';

/* ------------------------------------------------------------------ */
/* Gắp — thả: drag each ingredient into the pot (catalog #7). This is  */
/* also the run's native drop mechanic, reused here as a step action.  */
/* ------------------------------------------------------------------ */

export function GapThaGesture({ params, mode, ingredientNames, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const items = ingredientNames.length > 0 ? ingredientNames : [g.names['gap-tha']];
  const doneRef = useRef(false);

  const finish = (score: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(score);
  };

  useDeadline(params.maxMs, () =>
    finish(scoreFromMetrics({ completion: 0, accuracy: 0.3, rhythm: 0.5, faults: 0 })),
  );

  if (mode === 'button') {
    return <SequencePad items={items} onDone={finish} />;
  }

  return (
    <DragChips
      items={items}
      targetLabel={g.targetPot}
      targetEmoji="🍲"
      onAllPlaced={(result) =>
        finish(
          scoreFromMetrics({
            completion: 1,
            accuracy: result.placed / Math.max(1, result.placed + result.failedDrops),
            rhythm: 0.85,
            faults: result.failedDrops,
          }),
        )
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Trang trí / bày đĩa — drag each garnish onto its spot (catalog #13).*/
/* ------------------------------------------------------------------ */

const SPOTS: Array<{ x: number; y: number }> = [
  { x: 30, y: 30 },
  { x: 70, y: 28 },
  { x: 32, y: 70 },
  { x: 68, y: 68 },
  { x: 50, y: 50 },
];

export function TrangTriGesture({ params, mode, ingredientNames, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const items = (ingredientNames.length > 0 ? ingredientNames : [g.names['trang-tri']]).slice(
    0,
    Math.max(1, params.count),
  );
  const stageRef = useRef<HTMLDivElement | null>(null);
  const plateRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<boolean[]>(() => items.map(() => false));
  const [drag, setDrag] = useState<{ idx: number; x: number; y: number } | null>(null);
  const stats = useRef({ acc: [] as number[], faults: 0, placedCount: 0 });
  const doneRef = useRef(false);

  const finish = (partial: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = stats.current;
    const accuracy = s.acc.length ? s.acc.reduce((a, b) => a + b, 0) / s.acc.length : 0.4;
    onDone(
      scoreFromMetrics({
        completion: partial ? clamp01(s.placedCount / items.length) : 1,
        accuracy,
        rhythm: 0.85,
        faults: s.faults,
      }),
    );
  };

  useDeadline(params.maxMs, () => finish(true));

  if (mode === 'button') {
    return <SequencePad items={items} onDone={onDone} />;
  }

  const spotCenter = (idx: number) => {
    const plate = plateRef.current?.getBoundingClientRect();
    if (!plate) return null;
    const spot = SPOTS[idx % SPOTS.length];
    return {
      x: plate.left + (spot.x / 100) * plate.width,
      y: plate.top + (spot.y / 100) * plate.height,
    };
  };

  const handleDown = (idx: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    if (placed[idx] || doneRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ idx, x: event.clientX, y: event.clientY });
  };

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    setDrag({ idx: drag.idx, x: event.clientX, y: event.clientY });
  };

  const handleUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const idx = drag.idx;
    setDrag(null);
    const center = spotCenter(idx);
    if (!center) return;
    const dist = Math.hypot(event.clientX - center.x, event.clientY - center.y);
    if (dist <= 56) {
      stats.current.acc.push(clamp01(1 - dist / 56));
      stats.current.placedCount += 1;
      setPlaced((prev) => prev.map((p, i) => (i === idx ? true : p)));
      if (stats.current.placedCount >= items.length) finish(false);
    } else {
      if (dist > 120) stats.current.faults += 1;
    }
  };

  return (
    <div
      ref={stageRef}
      className={styles.plateStage}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      role="application"
      aria-label="garnish"
    >
      <div ref={plateRef} className={styles.plate}>
        {items.map((item, idx) =>
          placed[idx] ? (
            <span
              key={`${item}-${idx}`}
              className={styles.spotDone}
              style={{ left: `${SPOTS[idx % SPOTS.length].x}%`, top: `${SPOTS[idx % SPOTS.length].y}%` }}
            >
              {item}
            </span>
          ) : (
            <span
              key={`${item}-${idx}`}
              className={styles.spotGhost}
              style={{ left: `${SPOTS[idx % SPOTS.length].x}%`, top: `${SPOTS[idx % SPOTS.length].y}%` }}
              aria-hidden
            />
          ),
        )}
      </div>
      <div className={styles.plateTray}>
        {items.map((item, idx) =>
          placed[idx] ? null : (
            <div
              key={`${item}-${idx}`}
              className={styles.dragChip}
              style={
                drag?.idx === idx
                  ? {
                      position: 'fixed',
                      left: drag.x - 40,
                      top: drag.y - 18,
                      zIndex: 6,
                      pointerEvents: 'none',
                    }
                  : undefined
              }
              onPointerDown={handleDown(idx)}
              role="button"
              aria-label={item}
            >
              {item}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hấp — arrange in the steamer, wait for the steam, open the lid in   */
/* the green zone (catalog #3).                                        */
/* ------------------------------------------------------------------ */

export function HapGesture(props: GestureModuleProps) {
  const { params, mode, ingredientNames, onDone } = props;
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const [phase, setPhase] = useState<'arrange' | 'wait' | 'open'>(
    mode === 'button' ? 'wait' : 'arrange',
  );
  const [waitPct, setWaitPct] = useState(0);
  const [marker, setMarker] = useState(0);
  const arrangeRef = useRef({ accuracy: 1, faults: 0 });
  const sweepStartRef = useRef(0);
  const doneRef = useRef(false);

  const zoneCenter = 0.55;
  const zoneHalf = params.zone / 2 + 0.02;

  const finish = (openAcc: number, openFault: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(
      scoreFromMetrics({
        completion: 1,
        accuracy: 0.35 * arrangeRef.current.accuracy + 0.65 * openAcc,
        rhythm: 0.8,
        faults: arrangeRef.current.faults + (openFault ? 1 : 0),
      }),
    );
  };

  useDeadline(params.maxMs + 8000, () => finish(0.3, false));

  // Wait phase: the steam builds over holdMs, then the open window opens.
  useRafLoop((now) => {
    if (doneRef.current) return;
    if (phase === 'wait') {
      if (!sweepStartRef.current) sweepStartRef.current = now;
      const pct = Math.min(1, (now - sweepStartRef.current) / params.holdMs);
      setWaitPct(pct);
      if (pct >= 1) {
        sweepStartRef.current = now;
        setPhase('open');
      }
    } else if (phase === 'open') {
      if (mode === 'button') return; // the PrecisionStop widget owns this phase
      const t = (now - sweepStartRef.current) / 2600;
      setMarker(Math.min(1, t));
      if (t >= 1) finish(0.1, true);
    }
  });

  if (mode === 'button') {
    // Button path: arranging is automatic; the scored act is stopping the
    // steam marker in the green zone — the same timing frame.
    return (
      <div className={styles.widget}>
        <p className={styles.phaseNote}>🧺 {g.steamWait}</p>
        <div className={styles.progressLine}>
          <div className={styles.progressFill} style={{ width: `${waitPct * 100}%` }} />
        </div>
        {phase === 'open' ? (
          <PrecisionStop rounds={1} sweepMs={2600} onDone={(score) => {
            if (doneRef.current) return;
            doneRef.current = true;
            onDone(Math.round(score * 0.85 + 12));
          }} />
        ) : null}
      </div>
    );
  }

  if (phase === 'arrange') {
    const items = (ingredientNames.length > 0 ? ingredientNames : [g.names.hap]).slice(0, 3);
    return (
      <DragChips
        items={items}
        targetLabel={g.targetBasket}
        targetEmoji="🧺"
        onAllPlaced={(result) => {
          arrangeRef.current = {
            accuracy: result.placed / Math.max(1, result.placed + result.failedDrops),
            faults: result.failedDrops > 2 ? 1 : 0,
          };
          sweepStartRef.current = 0;
          setPhase('wait');
        }}
      />
    );
  }

  if (phase === 'wait') {
    return (
      <div className={styles.widget}>
        <p className={styles.phaseNote}>🧺 {g.steamWait}</p>
        <div className={styles.steamClouds} aria-hidden>
          💨 💨 💨
        </div>
        <div className={styles.progressLine}>
          <div className={styles.progressFill} style={{ width: `${waitPct * 100}%` }} />
        </div>
      </div>
    );
  }

  const handleOpen = () => {
    if (doneRef.current) return;
    const dist = Math.abs(marker - zoneCenter);
    const acc =
      dist <= zoneHalf
        ? 1 - (dist / zoneHalf) * 0.25
        : clamp01(0.75 - (dist - zoneHalf) / 0.4);
    finish(acc, acc < 0.3);
  };

  return (
    <div
      className={styles.widget}
      onPointerDown={handleOpen}
      role="application"
      aria-label="open lid"
    >
      <p className={styles.phaseNote}>✋ {g.openNow}</p>
      <div className={styles.needleBar}>
        <div
          className={styles.needleZone}
          style={{
            left: `${(zoneCenter - zoneHalf) * 100}%`,
            width: `${zoneHalf * 2 * 100}%`,
          }}
        />
        <div className={styles.needleMark} style={{ left: `${marker * 100}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Đậy / mở nắp — drag the lid shut, then hold a beat to seal (#8).    */
/* ------------------------------------------------------------------ */

export function DayNapGesture({ params, mode, onDone }: GestureModuleProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const potRef = useRef<HTMLDivElement | null>(null);
  const lidRef = useRef<HTMLDivElement | null>(null);
  const [lidX, setLidX] = useState(0); // px offset from home
  const [aligned, setAligned] = useState(false);
  const [seal, setSeal] = useState(0);
  const dragRef = useRef<{ startX: number; baseX: number } | null>(null);
  const holdingRef = useRef(false);
  const stats = useRef({ alignAcc: 0.8, faults: 0, sealMs: 0 });
  const lastRef = useRef(performance.now());
  const doneRef = useRef(false);

  const finish = (partial: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(
      scoreFromMetrics({
        completion: partial ? clamp01(stats.current.sealMs / params.holdMs) : 1,
        accuracy: stats.current.alignAcc,
        rhythm: 0.85,
        faults: stats.current.faults,
      }),
    );
  };

  useDeadline(params.maxMs, () => finish(true));

  useRafLoop((now) => {
    if (doneRef.current) return;
    const dt = Math.min(64, now - lastRef.current);
    lastRef.current = now;
    if ((aligned || mode === 'button') && holdingRef.current) {
      stats.current.sealMs += dt;
      setSeal(stats.current.sealMs / params.holdMs);
      if (stats.current.sealMs >= params.holdMs) finish(false);
    }
  });

  const handleLidDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (aligned || doneRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, baseX: lidX };
  };

  const handleLidMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || aligned) return;
    const next = Math.max(0, dragRef.current.baseX + (event.clientX - dragRef.current.startX));
    setLidX(next);
  };

  const handleLidUp = () => {
    if (!dragRef.current || aligned) return;
    dragRef.current = null;
    // Measure real centres (lid rect includes its transform) — no guessed
    // offsets, so the snap window is honest at any stage width.
    const lidRect = lidRef.current?.getBoundingClientRect();
    const potRect = potRef.current?.getBoundingClientRect();
    if (!lidRect || !potRect) return;
    const lidCenter = lidRect.left + lidRect.width / 2;
    const potCenter = potRect.left + potRect.width / 2;
    const delta = potCenter - lidCenter;
    const offset = Math.abs(delta);
    if (offset <= 38) {
      stats.current.alignAcc = clamp01(1 - offset / 76);
      setLidX((x) => x + delta);
      setAligned(true);
    } else {
      if (delta < -80) stats.current.faults += 1;
      setLidX(0);
    }
  };

  const holdProps = {
    onPointerDown: () => {
      holdingRef.current = true;
    },
    onPointerUp: () => {
      holdingRef.current = false;
    },
    onPointerLeave: () => {
      holdingRef.current = false;
    },
  };

  return (
    <div ref={stageRef} className={styles.lidStage}>
      <div ref={potRef} className={styles.lidPot} aria-hidden>
        🍲
      </div>
      {mode === 'gesture' ? (
        <div
          ref={lidRef}
          className={`${styles.lid} ${aligned ? styles.lidSealed : ''}`}
          style={{ transform: `translateX(${lidX}px)` }}
          onPointerDown={handleLidDown}
          onPointerMove={handleLidMove}
          onPointerUp={handleLidUp}
          role="button"
          aria-label="lid"
        >
          🫕
        </div>
      ) : null}
      {(aligned || mode === 'button') && seal < 1 ? (
        <div className={styles.sealWrap}>
          <div className={styles.progressLine}>
            <div className={styles.progressFill} style={{ width: `${seal * 100}%` }} />
          </div>
          <button type="button" className={styles.bigGoldBtn} {...holdProps}>
            {g.buttonSeal}
          </button>
        </div>
      ) : null}
      {mode === 'gesture' && !aligned ? (
        <span className={styles.arrowHint} aria-hidden>
          ➡️
        </span>
      ) : null}
    </div>
  );
}

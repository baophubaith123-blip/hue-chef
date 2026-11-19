import { useEffect, useRef, useState } from 'react';

import { GoldButton } from '@/components/theme-d';
import {
  INCIDENT_GRACE_MS,
  type IncidentDef,
} from '@/features/events/lib/incidents';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/events/components/IncidentPanel.module.css';

interface IncidentPanelProps {
  def: IncidentDef;
  /** Milliseconds left in the grace window (0 once it has burned in). */
  graceLeftMs: number;
  /** True once the grace window expired and the penalty was booked. */
  penalized: boolean;
  onFixed: () => void;
}

/**
 * Kitchen incident blocker (Gói H7): replaces the step's gesture while
 * an accident is live. The fix is hands-on — hold the button down or
 * tap it repeatedly — and the grace bar shows how long is left before
 * the accident burns into the dish as one cooking mistake.
 */
export function IncidentPanel({ def, graceLeftMs, penalized, onFixed }: IncidentPanelProps) {
  const { dict } = useTranslation();
  const d = dict.events.incidents;
  const [heldMs, setHeldMs] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const firedRef = useRef(false);
  const holdStartRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const onFixedRef = useRef(onFixed);
  onFixedRef.current = onFixed;

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) {
        window.clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, []);

  const fireFixed = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    clearHoldTimer();
    onFixedRef.current();
  };

  const handleHoldStart = () => {
    if (def.fixKind !== 'hold' || firedRef.current) return;
    holdStartRef.current = Date.now();
    clearHoldTimer();
    holdTimerRef.current = window.setInterval(() => {
      if (holdStartRef.current === null) return;
      const held = Date.now() - holdStartRef.current;
      setHeldMs(held);
      if (held >= def.fixAmount) {
        fireFixed();
      }
    }, 50);
  };

  const handleHoldEnd = () => {
    if (def.fixKind !== 'hold') return;
    holdStartRef.current = null;
    clearHoldTimer();
    if (!firedRef.current) setHeldMs(0);
  };

  const handleTap = () => {
    if (def.fixKind !== 'taps' || firedRef.current) return;
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= def.fixAmount) {
      fireFixed();
    }
  };

  const gracePct = Math.max(0, Math.min(100, (graceLeftMs / INCIDENT_GRACE_MS) * 100));
  const holdPct =
    def.fixKind === 'hold' ? Math.min(100, (heldMs / def.fixAmount) * 100) : 0;

  return (
    <div className={styles.panel} role="alertdialog" aria-label={d.panelTitle}>
      <h2 className={styles.title}>
        {def.icon} {d.panelTitle} — {d.names[def.id] ?? def.id}
      </h2>
      <p className={styles.body}>{d.bodies[def.id] ?? ''}</p>
      {!penalized ? (
        <>
          <div className={styles.graceTrack}>
            <div className={styles.graceFill} style={{ width: `${gracePct}%` }} />
          </div>
          <p className={styles.graceLabel}>{d.graceLabel(Math.ceil(graceLeftMs / 1000))}</p>
        </>
      ) : (
        <p className={styles.penalty}>{d.penaltyToast}</p>
      )}
      {def.fixKind === 'hold' ? (
        <>
          <div className={styles.graceTrack}>
            <div className={styles.holdFill} style={{ width: `${holdPct}%` }} />
          </div>
          <GoldButton
            onPointerDown={handleHoldStart}
            onPointerUp={handleHoldEnd}
            onPointerLeave={handleHoldEnd}
          >
            {def.icon} {d.holdHint}
          </GoldButton>
        </>
      ) : (
        <GoldButton onClick={handleTap}>
          {def.icon} {d.tapHint(Math.max(0, def.fixAmount - tapCount))}
        </GoldButton>
      )}
    </div>
  );
}

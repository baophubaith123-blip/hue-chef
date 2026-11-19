import { useCallback, useRef, useState, type ComponentType } from 'react';

import { gestureParams, type GestureId, type GestureParams } from '@/data/gesture-map';
import { NoiNoi } from '@/components/theme-d/NoiNoi';
import type { NoiNoiPose } from '@/components/theme-d/assets';
import type { GestureMode, GestureModuleProps } from '@/features/gestures/engine/types';
import { qualityForScore } from '@/features/gestures/engine/scoring';
import { KhuayGesture, TronGesture } from '@/features/gestures/actions/circular';
import {
  DayNapGesture,
  GapThaGesture,
  HapGesture,
  TrangTriGesture,
} from '@/features/gestures/actions/drag';
import { GiuLuaGesture, NemGesture, RotGesture } from '@/features/gestures/actions/meter';
import { ThaiGesture, XaoGesture } from '@/features/gestures/actions/swipe';
import { ChamNhipGesture, ChienGesture, LuocGesture } from '@/features/gestures/actions/timing';
import { useTranslation } from '@/i18n/useTranslation';
import { getJsonStorage, setJsonStorage } from '@/lib/storage';
import { playSound } from '@/lib/sound';

import styles from '@/features/gestures/Gestures.module.css';

const MODE_STORAGE_KEY = 'hue-chef-gesture-mode';

const MODULES: Record<GestureId, ComponentType<GestureModuleProps>> = {
  khuay: KhuayGesture,
  nem: NemGesture,
  hap: HapGesture,
  xao: XaoGesture,
  chien: ChienGesture,
  thai: ThaiGesture,
  'gap-tha': GapThaGesture,
  'day-nap': DayNapGesture,
  'giu-lua': GiuLuaGesture,
  luoc: LuocGesture,
  tron: TronGesture,
  rot: RotGesture,
  'trang-tri': TrangTriGesture,
  'cham-nhip': ChamNhipGesture,
};

const POSES: Record<GestureId, NoiNoiPose> = {
  khuay: 'khuay',
  nem: 'cam-muong',
  hap: 'be-noi',
  xao: 'khuay',
  chien: 'chi-tay',
  thai: 'chi-tay',
  'gap-tha': 'be-noi',
  'day-nap': 'be-noi',
  'giu-lua': 'hoang',
  luoc: 'be-noi',
  tron: 'khuay',
  rot: 'gioi-thieu',
  'trang-tri': 'gioi-thieu',
  'cham-nhip': 'mc',
};

function loadMode(): GestureMode {
  try {
    const stored = getJsonStorage<{ mode?: string }>(MODE_STORAGE_KEY);
    return stored?.mode === 'button' ? 'button' : 'gesture';
  } catch {
    return 'gesture';
  }
}

export interface GestureStepProps {
  gesture: GestureId;
  /** The recipe step's action label, shown as the panel's prompt. */
  stepLabel: string;
  difficulty: number;
  ingredientNames: string[];
  /**
   * Engine-parameter boosts from the chef skill tree and the kitchen
   * upgrades (Gói H5): zoneScale widens this gesture's target zone,
   * timeScale stretches its time budget. They change how forgiving
   * the move is, never how it is scored — the shared 0–100 frame in
   * engine/scoring is untouched. Defaults: no boost.
   */
  zoneScale?: number;
  timeScale?: number;
  /** Fires once, after the result splash, with the action score 0–100. */
  onComplete: (score: number) => void;
}

/**
 * One cooking step played as a gesture (Kế hoạch 1, mục 3.4 lifecycle):
 * Nồi Nồi explains the move in one line, the module samples pointer input
 * per frame, scores 0–100 by the shared frame, and hands the number back
 * to the game. The button path is always one tap away and scores by the
 * identical frame (mục 3.6).
 */
export function GestureStep({
  gesture,
  stepLabel,
  difficulty,
  ingredientNames,
  zoneScale = 1,
  timeScale = 1,
  onComplete,
}: GestureStepProps) {
  const { dict } = useTranslation();
  const g = dict.cooking.gestures;
  const [mode, setMode] = useState<GestureMode>(loadMode);
  const [result, setResult] = useState<number | null>(null);
  // Remount the module when the player flips paths mid-step.
  const [attempt, setAttempt] = useState(0);
  const doneRef = useRef(false);

  const handleDone = useCallback(
    (score: number) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setResult(score);
      playSound(score >= 65 ? 'success' : score >= 40 ? 'click' : 'error');
      window.setTimeout(() => onComplete(score), 1250);
    },
    [onComplete],
  );

  const switchMode = (next: GestureMode) => {
    if (next === mode || result !== null) return;
    setMode(next);
    setAttempt((a) => a + 1);
    try {
      setJsonStorage(MODE_STORAGE_KEY, { mode: next });
    } catch {
      // storage unavailable — the choice simply won't persist
    }
  };

  const Module = MODULES[gesture];
  const baseParams = gestureParams(gesture, difficulty);
  const params: GestureParams = {
    ...baseParams,
    zone: Math.min(0.6, baseParams.zone * zoneScale),
    maxMs: Math.round(baseParams.maxMs * timeScale),
  };
  const quality = result !== null ? qualityForScore(result) : null;
  const qualityText =
    quality === 'perfect'
      ? g.qualityPerfect
      : quality === 'good'
        ? g.qualityGood
        : quality === 'ok'
          ? g.qualityOk
          : quality === 'fail'
            ? g.qualityFail
            : '';

  return (
    <section
      className={styles.panel}
      data-gesture={gesture}
      data-mode={mode}
      aria-label={`${g.panelTitle}: ${g.names[gesture]}`}
    >
      <header className={styles.panelHead}>
        <div className={styles.panelTitles}>
          <h3 className={styles.panelTitle}>
            {g.names[gesture]} · {stepLabel}
          </h3>
          <div className={styles.modeToggle} role="group" aria-label={g.panelTitle}>
            <button
              type="button"
              className={mode === 'gesture' ? styles.modeActive : styles.modeBtn}
              onClick={() => switchMode('gesture')}
            >
              {g.modeGesture}
            </button>
            <button
              type="button"
              className={mode === 'button' ? styles.modeActive : styles.modeBtn}
              onClick={() => switchMode('button')}
            >
              {g.modeButton}
            </button>
          </div>
        </div>
        <NoiNoi pose={POSES[gesture]} speech={g.hints[gesture]} size={92} alt="" />
      </header>

      <div className={styles.panelBody}>
        {result === null ? (
          <Module
            key={`${gesture}-${mode}-${attempt}`}
            params={params}
            mode={mode}
            ingredientNames={ingredientNames}
            onDone={handleDone}
          />
        ) : (
          <div className={styles.resultSplash} role="status">
            <span className={styles.resultQuality}>{qualityText}</span>
            <span className={styles.resultScore}>
              {g.scoreLabel}: {result}/100
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

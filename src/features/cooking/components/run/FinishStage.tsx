import { useCallback, useEffect, useRef, useState } from 'react';

import type { Recipe } from '@/data/types';
import { comboBonusForStreak } from '@/features/cooking/lib/combo';
import type { ResolvedStageConfig } from '@/features/cooking/lib/stage-config';
import {
  FINISH_GOOD_WINDOW,
  FINISH_MISS_PENALTY,
  FINISH_PERFECT_POINTS,
  finishGoodPoints,
} from '@/features/cooking/lib/stage-bonus';
import { StageHelp } from '@/features/cooking/components/run/StageHelp';
import { useTranslation } from '@/i18n/useTranslation';
import { playSound } from '@/lib/sound';

import styles from '@/features/cooking/components/run/FinishStage.module.css';

interface FinishStageProps {
  recipe: Recipe;
  config: ResolvedStageConfig;
  onComplete: (bonus: number) => void;
}

type RingResult = 'perfect' | 'good' | 'miss';

interface Ring {
  key: number;
  xPercent: number;
  yPercent: number;
  bornAt: number;
  growMs: number;
  resolved: RingResult | null;
  resolvedAt: number;
}

interface Floater {
  key: number;
  xPercent: number;
  yPercent: number;
  text: string;
  kind: RingResult;
}

type PotMood = 'jump' | 'nod' | 'dizzy' | null;

const PERFECT_WINDOW = 0.08;
const RING_SIZE_PX = 96;

/**
 * Stage ④ — Nấu hoàn thiện: a rhythm stage. Everything disappears except
 * Nồi Nồi in the centre; rings appear at random around the pot and an
 * inner ring grows from each centre. Tapping exactly when the growing
 * ring meets the rim is "Tuyệt vời" — the only tier that builds combo.
 */
export function FinishStage({ config, onComplete }: FinishStageProps) {
  const { dict } = useTranslation();
  const s = dict.cooking.stages;

  const [, setFrame] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(config.finishSeconds);
  const [bonus, setBonus] = useState(0);
  const [streak, setStreak] = useState(0);
  const [potMood, setPotMood] = useState<PotMood>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);

  const doneRef = useRef(false);
  const pausedRef = useRef(false);
  const gameNowRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const ringsRef = useRef<Ring[]>([]);
  const ringKeyRef = useRef(0);
  const lastSpawnRef = useRef(-config.finishSpawnMs);
  const bonusRef = useRef(0);
  const streakRef = useRef(0);
  const moodTimerRef = useRef<number | null>(null);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    playSound('success');
    window.setTimeout(() => onComplete(bonusRef.current), 650);
  }, [onComplete]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const setMood = useCallback((mood: PotMood) => {
    setPotMood(mood);
    if (moodTimerRef.current !== null) window.clearTimeout(moodTimerRef.current);
    moodTimerRef.current = window.setTimeout(() => setPotMood(null), 560);
  }, []);

  const pushFloater = useCallback(
    (xPercent: number, yPercent: number, text: string, kind: RingResult) => {
      const key = Date.now() + Math.random();
      setFloaters((prev) => [...prev.slice(-5), { key, xPercent, yPercent, text, kind }]);
      window.setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.key !== key));
      }, 950);
    },
    [],
  );

  const resolveRing = useCallback(
    (ring: Ring, result: RingResult, gameNow: number) => {
      ring.resolved = result;
      ring.resolvedAt = gameNow;
      if (result === 'perfect') {
        streakRef.current += 1;
        const gain = FINISH_PERFECT_POINTS + comboBonusForStreak(streakRef.current);
        bonusRef.current += gain;
        setMood('jump');
        pushFloater(ring.xPercent, ring.yPercent, `+${gain} ${s.finishPerfect}`, 'perfect');
        playSound('success');
      } else if (result === 'good') {
        const p = (gameNow - ring.bornAt) / ring.growMs;
        const gain = finishGoodPoints(Math.abs(p - 1));
        bonusRef.current += gain;
        setMood('nod');
        pushFloater(ring.xPercent, ring.yPercent, `+${gain} ${s.finishGood}`, 'good');
        playSound('drop');
      } else {
        streakRef.current = 0;
        bonusRef.current -= FINISH_MISS_PENALTY;
        setMood('dizzy');
        pushFloater(
          ring.xPercent,
          ring.yPercent,
          `−${FINISH_MISS_PENALTY} ${s.finishMiss}`,
          'miss',
        );
        playSound('error');
      }
      setStreak(streakRef.current);
      setBonus(bonusRef.current);
    },
    [pushFloater, s, setMood],
  );

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (pausedRef.current || doneRef.current) {
        lastTickRef.current = now;
        return;
      }
      if (lastTickRef.current === null) lastTickRef.current = now;
      const dt = Math.min(64, now - lastTickRef.current);
      lastTickRef.current = now;
      gameNowRef.current += dt;
      const gameNow = gameNowRef.current;

      const remaining = config.finishSeconds - gameNow / 1000;
      setSecondsLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        finish();
        return;
      }

      // Spawn new rings around the pot.
      const growing = ringsRef.current.filter((ring) => !ring.resolved);
      if (
        growing.length < config.finishMaxRings &&
        gameNow - lastSpawnRef.current >= config.finishSpawnMs
      ) {
        lastSpawnRef.current = gameNow;
        ringKeyRef.current += 1;
        const angle = Math.random() * Math.PI * 2;
        const radiusX = 17 + Math.random() * 21;
        const radiusY = 15 + Math.random() * 19;
        ringsRef.current = [
          ...ringsRef.current,
          {
            key: ringKeyRef.current,
            xPercent: Math.min(90, Math.max(10, 50 + Math.cos(angle) * radiusX)),
            yPercent: Math.min(76, Math.max(12, 44 + Math.sin(angle) * radiusY)),
            bornAt: gameNow,
            growMs: config.finishRingGrowMs * (0.92 + Math.random() * 0.16),
            resolved: null,
            resolvedAt: 0,
          },
        ];
      }

      // Rings left untapped past the good window crack on their own.
      for (const ring of ringsRef.current) {
        if (!ring.resolved) {
          const p = (gameNow - ring.bornAt) / ring.growMs;
          if (p > 1 + FINISH_GOOD_WINDOW) {
            resolveRing(ring, 'miss', gameNow);
          }
        }
      }
      ringsRef.current = ringsRef.current.filter(
        (ring) => !ring.resolved || gameNow - ring.resolvedAt < 450,
      );
      setFrame((n) => n + 1);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [
    config.finishMaxRings,
    config.finishRingGrowMs,
    config.finishSeconds,
    config.finishSpawnMs,
    finish,
    resolveRing,
  ]);

  const handleTapRing = (ring: Ring) => {
    if (ring.resolved || doneRef.current || pausedRef.current) return;
    const gameNow = gameNowRef.current;
    const p = (gameNow - ring.bornAt) / ring.growMs;
    const offset = Math.abs(p - 1);
    if (offset <= PERFECT_WINDOW) {
      resolveRing(ring, 'perfect', gameNow);
    } else if (offset <= FINISH_GOOD_WINDOW) {
      resolveRing(ring, 'good', gameNow);
    } else {
      resolveRing(ring, 'miss', gameNow);
    }
  };

  const secondsDisplay = Math.ceil(secondsLeft);
  const moodClass =
    potMood === 'jump'
      ? styles.potJump
      : potMood === 'nod'
        ? styles.potNod
        : potMood === 'dizzy'
          ? styles.potDizzy
          : '';

  return (
    <section className={styles.stage} aria-label={s.finishName}>
      <div className={styles.topBar}>
        <span className={styles.stageChip}>🍲 ④ {s.finishName}</span>
        <span className={styles.chip}>💡 {s.finishHint}</span>
        {streak >= 2 ? (
          <span className={styles.comboChip}>🔥 {s.finishCombo(streak)}</span>
        ) : null}
        <span className={styles.chip}>⭐ {bonus >= 0 ? `+${bonus}` : bonus}</span>
        <span
          className={[styles.chip, secondsDisplay <= 3 && !done ? styles.chipDanger : '']
            .filter(Boolean)
            .join(' ')}
        >
          ⏱ {s.finishTimeLeft(secondsDisplay)}
        </span>
      </div>

      <div className={styles.field}>
        <div className={[styles.pot, moodClass].filter(Boolean).join(' ')}>
          <span className={`${styles.steam} ${styles.steam1}`} />
          <span className={`${styles.steam} ${styles.steam2}`} />
          <img src="/images/noi-noi.jpg" alt="" className={styles.potImg} />
          {potMood === 'dizzy' ? <span className={styles.dizzyEyes}>😵</span> : null}
        </div>

        {ringsRef.current.map((ring) => {
          const p = Math.min(
            1.3,
            (gameNowRef.current - ring.bornAt) / ring.growMs,
          );
          const ringClass = ring.resolved
            ? ring.resolved === 'miss'
              ? styles.ringMiss
              : ring.resolved === 'perfect'
                ? styles.ringPerfect
                : styles.ringGood
            : '';
          return (
            <button
              key={ring.key}
              type="button"
              aria-label={s.finishName}
              className={[styles.ring, ringClass].filter(Boolean).join(' ')}
              style={{
                left: `${ring.xPercent}%`,
                top: `${ring.yPercent}%`,
                width: RING_SIZE_PX,
                height: RING_SIZE_PX,
              }}
              onPointerDown={() => handleTapRing(ring)}
            >
              <span
                className={styles.ringInner}
                style={{ width: `${Math.min(100, p * 100)}%`, height: `${Math.min(100, p * 100)}%` }}
              />
            </button>
          );
        })}

        {floaters.map((f) => (
          <span
            key={f.key}
            className={[
              styles.floater,
              f.kind === 'perfect'
                ? styles.floaterPerfect
                : f.kind === 'miss'
                  ? styles.floaterMiss
                  : styles.floaterGood,
            ].join(' ')}
            style={{ left: `${f.xPercent}%`, top: `${f.yPercent}%` }}
          >
            {f.text}
          </span>
        ))}

        {done ? (
          <div className={styles.doneOverlay}>
            <span className={styles.doneBadge}>🍲✨</span>
          </div>
        ) : null}

        <StageHelp
          stageName={s.finishName}
          rules={[s.finishRule1, s.finishRule2, s.finishRule3, s.finishRule4]}
          onOpenChange={setPaused}
        />
      </div>
    </section>
  );
}

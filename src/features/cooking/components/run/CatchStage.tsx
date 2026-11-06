import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { getIngredientById, SEED_INGREDIENTS } from '@/data/ingredients';
import type { Recipe } from '@/data/types';
import { COMBO_WINDOW_MS, comboBonusForStreak } from '@/features/cooking/lib/combo';
import type { ResolvedStageConfig } from '@/features/cooking/lib/stage-config';
import { CATCH_MISS_PENALTY, CATCH_POINTS } from '@/features/cooking/lib/stage-bonus';
import { StageHelp } from '@/features/cooking/components/run/StageHelp';
import { useTranslation } from '@/i18n/useTranslation';
import { playSound } from '@/lib/sound';

import styles from '@/features/cooking/components/run/CatchStage.module.css';

interface CatchStageProps {
  recipe: Recipe;
  config: ResolvedStageConfig;
  onComplete: (bonus: number) => void;
}

interface FallingToken {
  key: number;
  ingredientId: string;
  isCorrect: boolean;
  xRatio: number;
  bornAt: number;
  fallMs: number;
}

interface Floater {
  key: number;
  xPercent: number;
  text: string;
  kind: 'good' | 'bad';
}

type CatchStatus = 'ready' | 'countdown' | 'playing' | 'done';

const POT_ZONE_HEIGHT = 118;
const CATCH_RADIUS_PX = 86;

/**
 * Stage ② — Bắt nguyên liệu rơi: a fullscreen field where the dish's own
 * ingredients (learned at the market) fall mixed with decoys. The player
 * drags Nồi Nồi to catch every correct one; scoring reuses the shared
 * combo curve from lib/combo.
 */
export function CatchStage({ recipe, config, onComplete }: CatchStageProps) {
  const { dict } = useTranslation();
  const s = dict.cooking.stages;

  const correctIds = useMemo(
    () => Array.from(new Set(recipe.ingredients.map((ref) => ref.ingredientId))),
    [recipe],
  );
  const correctSet = useMemo(() => new Set(correctIds), [correctIds]);
  const decoyPool = useMemo(
    () => SEED_INGREDIENTS.filter((item) => !correctSet.has(item.id)).map((item) => item.id),
    [correctSet],
  );

  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [fieldSize, setFieldSize] = useState({ width: 900, height: 520 });
  const [status, setStatus] = useState<CatchStatus>('ready');
  const [countdown, setCountdown] = useState(3);
  const [potX, setPotX] = useState(0.5);
  const [, setFrame] = useState(0);
  const [caughtCount, setCaughtCount] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [streak, setStreak] = useState(0);
  const [potShake, setPotShake] = useState(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [paused, setPaused] = useState(false);

  const statusRef = useRef<CatchStatus>('ready');
  const pausedRef = useRef(false);
  const doneRef = useRef(false);
  const gameNowRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const tokensRef = useRef<FallingToken[]>([]);
  const tokenKeyRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const spawnCountRef = useRef(0);
  const caughtRef = useRef<Set<string>>(new Set());
  const bonusRef = useRef(0);
  const streakRef = useRef(0);
  const lastCatchAtRef = useRef(0);
  const potXRef = useRef(0.5);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    statusRef.current = 'done';
    setStatus('done');
    playSound('success');
    window.setTimeout(() => onComplete(bonusRef.current), 750);
  }, [onComplete]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const measure = () => {
      const el = fieldRef.current;
      if (el) {
        setFieldSize({ width: el.clientWidth, height: el.clientHeight });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // 3-second countdown before the ingredients start falling.
  useEffect(() => {
    if (status !== 'countdown') return undefined;
    const timer = window.setInterval(() => {
      if (pausedRef.current) return;
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          statusRef.current = 'playing';
          setStatus('playing');
          lastTickRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 750);
    return () => window.clearInterval(timer);
  }, [status]);

  const pushFloater = useCallback((xPercent: number, text: string, kind: 'good' | 'bad') => {
    const key = Date.now() + Math.random();
    setFloaters((prev) => [...prev.slice(-4), { key, xPercent, text, kind }]);
    window.setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.key !== key));
    }, 950);
  }, []);

  // Main falling loop (virtual clock, so opening the "?" popup pauses play).
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (statusRef.current !== 'playing' || pausedRef.current || doneRef.current) {
        lastTickRef.current = now;
        return;
      }
      if (lastTickRef.current === null) lastTickRef.current = now;
      const dt = Math.min(64, now - lastTickRef.current);
      lastTickRef.current = now;
      gameNowRef.current += dt;
      const gameNow = gameNowRef.current;
      const { width, height } = fieldSize;

      // Combo dies COMBO_WINDOW_MS after the last correct catch.
      if (streakRef.current > 0 && gameNow - lastCatchAtRef.current > COMBO_WINDOW_MS) {
        streakRef.current = 0;
        setStreak(0);
      }

      // Spawn.
      const fallingCorrect = new Set(
        tokensRef.current.filter((tok) => tok.isCorrect).map((tok) => tok.ingredientId),
      );
      const pendingCorrect = correctIds.filter(
        (id) => !caughtRef.current.has(id) && !fallingCorrect.has(id),
      );
      if (
        gameNow - lastSpawnRef.current >= config.catchSpawnMs &&
        tokensRef.current.length < 9
      ) {
        lastSpawnRef.current = gameNow;
        spawnCountRef.current += 1;
        const forceCorrect = spawnCountRef.current % 3 === 0;
        if (
          pendingCorrect.length > 0 &&
          (forceCorrect || Math.random() > config.catchDecoyRatio)
        ) {
          const id = pendingCorrect[Math.floor(Math.random() * pendingCorrect.length)];
          tokenKeyRef.current += 1;
          tokensRef.current = [
            ...tokensRef.current,
            {
              key: tokenKeyRef.current,
              ingredientId: id,
              isCorrect: true,
              xRatio: 0.06 + Math.random() * 0.88,
              bornAt: gameNow,
              fallMs: config.catchFallMs * (0.9 + Math.random() * 0.25),
            },
          ];
        } else if (decoyPool.length > 0) {
          const id = decoyPool[Math.floor(Math.random() * decoyPool.length)];
          tokenKeyRef.current += 1;
          tokensRef.current = [
            ...tokensRef.current,
            {
              key: tokenKeyRef.current,
              ingredientId: id,
              isCorrect: false,
              xRatio: 0.06 + Math.random() * 0.88,
              bornAt: gameNow,
              fallMs: config.catchFallMs * (0.9 + Math.random() * 0.25),
            },
          ];
        }
      }

      // Advance + resolve tokens.
      const potCenterX = potXRef.current * width;
      const potTopY = height - POT_ZONE_HEIGHT;
      const survivors: FallingToken[] = [];
      for (const tok of tokensRef.current) {
        const progress = (gameNow - tok.bornAt) / tok.fallMs;
        const y = progress * (height + 90) - 45;
        const centerX = tok.xRatio * width;
        if (y >= potTopY && y <= height - 8) {
          if (Math.abs(centerX - potCenterX) <= CATCH_RADIUS_PX) {
            if (tok.isCorrect) {
              caughtRef.current.add(tok.ingredientId);
              setCaughtCount(caughtRef.current.size);
              const nextStreak =
                gameNow - lastCatchAtRef.current <= COMBO_WINDOW_MS
                  ? streakRef.current + 1
                  : 1;
              streakRef.current = nextStreak;
              lastCatchAtRef.current = gameNow;
              setStreak(nextStreak);
              const gain = CATCH_POINTS + comboBonusForStreak(nextStreak);
              bonusRef.current += gain;
              setBonus(bonusRef.current);
              pushFloater(tok.xRatio * 100, `+${gain}`, 'good');
              playSound('drop');
              if (caughtRef.current.size >= correctIds.length) {
                finish();
              }
            } else {
              streakRef.current = 0;
              setStreak(0);
              pushFloater(tok.xRatio * 100, '✗', 'bad');
              playSound('error');
              setPotShake(true);
              window.setTimeout(() => setPotShake(false), 420);
            }
            continue;
          }
        }
        if (y > height + 36) {
          if (tok.isCorrect) {
            bonusRef.current -= CATCH_MISS_PENALTY;
            setBonus(bonusRef.current);
            streakRef.current = 0;
            setStreak(0);
            pushFloater(tok.xRatio * 100, `−${CATCH_MISS_PENALTY}`, 'bad');
          }
          continue;
        }
        survivors.push(tok);
      }
      tokensRef.current = survivors;
      setFrame((n) => n + 1);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [
    config.catchDecoyRatio,
    config.catchFallMs,
    config.catchSpawnMs,
    correctIds.length,
    decoyPool,
    fieldSize,
    finish,
    pushFloater,
  ]);

  const handlePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = fieldRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const clamped = Math.min(0.94, Math.max(0.06, ratio));
    potXRef.current = clamped;
    setPotX(clamped);
  };

  const handleStart = () => {
    statusRef.current = 'countdown';
    setStatus('countdown');
    setCountdown(3);
    playSound('click');
  };

  const readyNames = correctIds
    .map((id) => getIngredientById(id)?.name ?? id)
    .join(' · ');

  return (
    <section className={styles.stage} aria-label={s.catchName}>
      <div className={styles.topBar}>
        <span className={styles.stageChip}>🎯 ② {s.catchName}</span>
        <span className={styles.chip}>{s.catchProgress(caughtCount, correctIds.length)}</span>
        {streak >= 2 ? <span className={styles.comboChip}>🔥 {s.catchCombo(streak)}</span> : null}
        <span className={styles.chip}>⭐ {bonus >= 0 ? `+${bonus}` : bonus}</span>
      </div>

      <div
        ref={fieldRef}
        className={styles.field}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
      >
        {tokensRef.current.map((tok) => {
          const progress = (gameNowRef.current - tok.bornAt) / tok.fallMs;
          const y = progress * (fieldSize.height + 90) - 45;
          const ing = getIngredientById(tok.ingredientId);
          return (
            <div
              key={tok.key}
              className={styles.token}
              style={{ left: `${tok.xRatio * 100}%`, top: `${y}px` }}
            >
              <div className={styles.tokenBall}>
                <span className={styles.tokenEyes} aria-hidden>
                  <i />
                  <i />
                </span>
                <span className={styles.tokenEmoji}>{ing?.fallbackEmoji ?? '❔'}</span>
              </div>
              <small className={styles.tokenName}>{ing?.name ?? tok.ingredientId}</small>
            </div>
          );
        })}

        {floaters.map((f) => (
          <span
            key={f.key}
            className={[styles.floater, f.kind === 'bad' ? styles.floaterBad : '']
              .filter(Boolean)
              .join(' ')}
            style={{ left: `${f.xPercent}%` }}
          >
            {f.text}
          </span>
        ))}

        <div
          className={[styles.pot, potShake ? styles.potShake : ''].filter(Boolean).join(' ')}
          style={{ left: `${potX * 100}%` }}
        >
          <img src="/images/noi-noi.jpg" alt="" className={styles.potImg} />
        </div>
        <div className={styles.floorLine} aria-hidden />

        {status === 'ready' ? (
          <div className={styles.overlay}>
            <div className={styles.readyCard}>
              <h3 className={styles.readyTitle}>{s.catchReadyTitle}</h3>
              <p className={styles.readyBody}>{s.catchReadyBody(readyNames)}</p>
              <p className={styles.readyHint}>{s.catchReadyHint}</p>
              <button type="button" className={styles.startBtn} onClick={handleStart}>
                ▶ {s.catchStart}
              </button>
            </div>
          </div>
        ) : null}
        {status === 'countdown' ? (
          <div className={styles.overlay}>
            <span key={countdown} className={styles.countNumber}>
              {countdown}
            </span>
          </div>
        ) : null}
        {status === 'done' ? (
          <div className={styles.overlay}>
            <span className={styles.doneBadge}>🎉 {caughtCount}/{correctIds.length}</span>
          </div>
        ) : null}

        <StageHelp
          stageName={s.catchName}
          rules={[s.catchRule1, s.catchRule2, s.catchRule3, s.catchRule4]}
          onOpenChange={setPaused}
        />
      </div>
    </section>
  );
}

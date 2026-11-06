import { useEffect, useMemo, useRef, useState } from 'react';

import type { TypingMinigame } from '@/features/recipes/types';
import { useTranslation } from '@/i18n/useTranslation';
import { playSound } from '@/lib/sound';

import styles from './TypingGame.module.css';

interface TypingGameProps {
  minigame: TypingMinigame;
  onComplete: (success: boolean, score: number) => void;
}

const CHARS_PER_SECOND: Record<TypingMinigame['data']['speed'], number> = {
  slow: 2,
  normal: 3,
  fast: 4.5,
};

function timeLimitFor(minigame: TypingMinigame): number {
  const cps = CHARS_PER_SECOND[minigame.data.speed] ?? 3;
  return Math.min(120, Math.max(12, Math.ceil(minigame.data.targetText.length / cps) + 4));
}

export function TypingGame({ minigame, onComplete }: TypingGameProps) {
  const { dict } = useTranslation();
  const target = minigame.data.targetText;
  const totalSeconds = useMemo(() => timeLimitFor(minigame), [minigame]);
  const [value, setValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [finished, setFinished] = useState<'done' | 'timeout' | null>(null);
  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const correctChars = useMemo(() => {
    let n = 0;
    for (let i = 0; i < value.length && i < target.length; i += 1) {
      if (value[i] === target[i]) n += 1;
    }
    return n;
  }, [value, target]);
  const accuracy = value.length === 0 ? 100 : Math.round((correctChars / value.length) * 100);

  const finish = (kind: 'done' | 'timeout') => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(kind);
    if (kind === 'done') {
      playSound('success');
      const speedBonus = Math.round(50 * (timeLeft / totalSeconds));
      window.setTimeout(() => onCompleteRef.current(true, 100 + speedBonus), 700);
    } else {
      const coverage = target.length === 0 ? 0 : value.length / target.length;
      const passed = accuracy >= 90 && coverage >= 0.95;
      playSound(passed ? 'success' : 'error');
      window.setTimeout(() => onCompleteRef.current(passed, passed ? 60 : 0), 700);
    }
  };

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const left = Math.max(0, totalSeconds - Math.floor((Date.now() - startedAt) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        window.clearInterval(timer);
        finish('timeout');
      }
    }, 250);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds, target]);

  const handleChange = (next: string) => {
    if (finishedRef.current) return;
    setValue(next);
    if (next === target) finish('done');
  };

  return (
    <div className={styles.wrap}>
      <h2 className={styles.question}>{minigame.question}</h2>
      <p className={styles.hint}>{dict.cooking.minigames.typingHint}</p>
      <div className={styles.targetBox} aria-label={dict.cooking.minigames.typingHint}>
        {target.split('').map((ch, i) => {
          const typed = value[i];
          const cls =
            typed === undefined
              ? styles.charPending
              : typed === ch
                ? styles.charOk
                : styles.charBad;
          return (
            <span key={i} className={cls}>
              {ch}
            </span>
          );
        })}
      </div>
      <textarea
        className={styles.input}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={dict.cooking.minigames.typingPlaceholder}
        rows={3}
        autoFocus
        disabled={finished !== null}
      />
      <div className={styles.metaRow}>
        <span className={styles.metaChip}>⏱ {timeLeft}s</span>
        <span className={styles.metaChip}>
          {dict.cooking.minigames.typingProgress(value.length, target.length)}
        </span>
        <span className={styles.metaChip}>{dict.cooking.minigames.typingAccuracy(accuracy)}</span>
        {finished === 'done' ? (
          <span className={styles.metaOk}>{dict.cooking.minigames.typingDone}</span>
        ) : null}
        {finished === 'timeout' ? (
          <span className={styles.metaBad}>{dict.cooking.minigames.typingTimeout}</span>
        ) : null}
      </div>
      <div className={styles.timerTrack}>
        <div
          className={styles.timerFill}
          style={{ width: `${Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100))}%` }}
        />
      </div>
    </div>
  );
}

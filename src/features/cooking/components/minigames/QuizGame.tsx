import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/Button';
import { speedBonusForQuiz } from '@/features/cooking/lib/combo';
import type { QuizMinigame } from '@/features/recipes/types';
import { useTranslation } from '@/i18n/useTranslation';
import { playSound } from '@/lib/sound';

import styles from './QuizGame.module.css';

export interface QuizGameProps {
  minigame: QuizMinigame;
  onComplete: (success: boolean, score: number) => void;
  /** Consecutive correct minigames so far in this run (streak badge). */
  streak?: number;
  /** Equipped-perk extra seconds for this question. */
  bonusSeconds?: number;
  /** Equipped perk: one wrong pick may be retried instead of failing. */
  secondChance?: boolean;
  /** Called when the second chance is spent on a wrong pick. */
  onSecondChanceUsed?: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function QuizGame({
  minigame,
  onComplete,
  streak = 0,
  bonusSeconds = 0,
  secondChance = false,
  onSecondChanceUsed,
}: QuizGameProps) {
  const { t, dict } = useTranslation();
  const totalTime = minigame.timeLimit + bonusSeconds;
  const [timeLeft, setTimeLeft] = useState<number>(totalTime);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const chanceUsedRef = useRef(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'timeout'>('idle');
  const [earned, setEarned] = useState<{ base: number; speed: number } | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const options = minigame.data.options ?? [];
  const correctIdx = minigame.data.correctAnswerIndex;
  const maxSpeedBonus = speedBonusForQuiz(minigame.scoreReward, minigame.timeLimit, minigame.timeLimit);

  // Countdown timer
  useEffect(() => {
    if (isFinished) return;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        if (next <= 0) {
          window.clearInterval(interval);
          setIsFinished(true);
          setStatus('timeout');
          playSound('error');
          setTimeout(() => {
            onCompleteRef.current(false, 0);
          }, 1500);
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isFinished]);

  const handleSelectOption = (idx: number) => {
    if (isFinished || eliminated.includes(idx)) return;

    const isCorrect = idx === correctIdx;

    // Equipped perk — second chance: the first wrong pick only eliminates
    // that option; the question (and its timer) keeps running.
    if (!isCorrect && secondChance && !chanceUsedRef.current) {
      chanceUsedRef.current = true;
      onSecondChanceUsed?.();
      setEliminated((prev) => [...prev, idx]);
      setSelectedIndex(idx);
      setStatus('error');
      playSound('error');
      window.setTimeout(() => setStatus('idle'), 650);
      return;
    }

    setIsFinished(true);
    setSelectedIndex(idx);

    if (isCorrect) {
      setStatus('success');
      playSound('success');
      const speed = speedBonusForQuiz(minigame.scoreReward, timeLeft, minigame.timeLimit);
      setEarned({ base: minigame.scoreReward, speed });
      setTimeout(() => {
        onCompleteRef.current(true, minigame.scoreReward + speed);
      }, 1400);
    } else {
      setStatus('error');
      playSound('error');
      setTimeout(() => {
        onCompleteRef.current(false, 0);
      }, 1500);
    }
  };

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  const isUrgent = timeLeft < 3;
  const ringOffset = RING_CIRCUMFERENCE * (1 - progressPercent / 100);

  return (
    <div
      className={`${styles.container} ${status === 'error' || status === 'timeout' ? styles.shakeBox : ''}`}
      role="region"
      aria-label={minigame.question}
    >
      <div className={styles.hostRow}>
        <img src="/images/noi-noi-2d.webp" alt="" className={styles.hostAvatar} aria-hidden />
        <div className={styles.speechBubble}>
          <h2 className={styles.question}>{minigame.question}</h2>
          <p className={styles.instruction}>{dict.cooking.minigames.quizInstruction}</p>
        </div>
      </div>

      {/* Reward chips + countdown ring */}
      <div className={styles.metaRow}>
        <div className={styles.chipsCol}>
          <span className={styles.chip}>
            🏅 {dict.cooking.minigames.rewardCorrect}: <strong>+{minigame.scoreReward}</strong>
          </span>
          <span className={styles.chip}>
            ⚡ {dict.cooking.minigames.speedBonus}:{' '}
            <strong>+{earned ? earned.speed : maxSpeedBonus}</strong>
          </span>
          {streak >= 2 ? (
            <span className={`${styles.chip} ${styles.chipStreak}`}>
              🔥 {dict.cooking.minigames.streak(streak)}
            </span>
          ) : null}
        </div>
        <div className={styles.ringWrap} role="timer" aria-label={t('cooking.actionMinigame.timeLeft')}>
          <svg className={styles.ring} viewBox="0 0 84 84" aria-hidden>
            <circle className={styles.ringTrack} cx="42" cy="42" r={RING_RADIUS} />
            <circle
              className={`${styles.ringFill} ${isUrgent ? styles.ringUrgent : ''}`}
              cx="42"
              cy="42"
              r={RING_RADIUS}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
            />
          </svg>
          <span className={`${styles.ringValue} ${isUrgent ? styles.ringValueUrgent : ''}`}>
            {timeLeft.toFixed(1)}
          </span>
        </div>
        {earned ? (
          <span className={styles.floatPoints} aria-hidden>
            +{earned.base + earned.speed}
          </span>
        ) : null}
      </div>

      {/* Options Grid */}
      <div className={styles.optionsGrid} role="group" aria-label="Quiz Options">
        {options.map((optionText, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === correctIdx;
          const isWrong = isSelected && !isCorrect;
          const isEliminated = eliminated.includes(idx);
          const shouldHighlightCorrect = isFinished && isCorrect;

          let btnClass = styles.optionButton;
          if (shouldHighlightCorrect) {
            btnClass += ` ${styles.optionCorrect}`;
          } else if (isWrong || isEliminated) {
            btnClass += ` ${styles.optionWrong}`;
          }

          const letter = OPTION_LETTERS[idx] ?? `${idx + 1}`;

          return (
            <Button
              key={idx}
              variant={isSelected ? 'primary' : 'secondary'}
              className={btnClass}
              disabled={isFinished || isEliminated}
              onClick={() => handleSelectOption(idx)}
            >
              <span className={styles.optionIndexBadge}>{letter}</span>
              <span className={styles.optionText}>{optionText}</span>
              {shouldHighlightCorrect ? (
                <span className={styles.correctBang}>{dict.cooking.minigames.correctBang}</span>
              ) : isWrong || isEliminated ? (
                <span>✕</span>
              ) : null}
            </Button>
          );
        })}
      </div>

      {/* Feedback & Explanation */}
      {status !== 'idle' && (
        <div
          className={`${styles.feedbackBox} ${
            status === 'success' ? styles.feedbackSuccess : styles.feedbackError
          }`}
          aria-live="polite"
        >
          <div className={styles.feedbackTitle}>
            {status === 'success' ? (
              <>
                <span>✅</span>
                <span>
                  {dict.cooking.minigames.correctAnswer} (+
                  {(earned?.base ?? minigame.scoreReward) + (earned?.speed ?? 0)}{' '}
                  {t('cooking.score').toLowerCase()})
                </span>
              </>
            ) : status === 'error' ? (
              <>
                <span>❌</span>
                <span>
                  {dict.cooking.minigames.incorrectAnswer} ·{' '}
                  {dict.cooking.minigames.correctWas(options[correctIdx] ?? '')}
                </span>
              </>
            ) : (
              <>
                <span>⏰</span>
                <span>
                  {dict.cooking.minigames.timeoutAnswer} ·{' '}
                  {dict.cooking.minigames.correctWas(options[correctIdx] ?? '')}
                </span>
              </>
            )}
          </div>
          {status === 'success' && earned ? (
            <div className={styles.feedbackExplanation}>
              {dict.cooking.minigames.rewardCorrect} +{earned.base} ·{' '}
              {dict.cooking.minigames.speedBonus} +{earned.speed}
            </div>
          ) : null}
          {minigame.data.explanation ? (
            <div className={styles.feedbackExplanation}>
              <strong>{dict.cooking.minigames.explanationLabel}</strong> {minigame.data.explanation}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

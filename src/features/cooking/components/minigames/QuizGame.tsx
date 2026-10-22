import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/Button';
import type { QuizMinigame } from '@/features/recipes/types';
import { useTranslation } from '@/i18n/useTranslation';
import { playSound } from '@/lib/sound';

import styles from './QuizGame.module.css';

export interface QuizGameProps {
  minigame: QuizMinigame;
  onComplete: (success: boolean, score: number) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function QuizGame({ minigame, onComplete }: QuizGameProps) {
  const { t, dict } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<number>(minigame.timeLimit);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'timeout'>('idle');

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const options = minigame.data.options ?? [];
  const correctIdx = minigame.data.correctAnswerIndex;

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
    if (isFinished) return;

    setIsFinished(true);
    setSelectedIndex(idx);

    const isCorrect = idx === correctIdx;

    if (isCorrect) {
      setStatus('success');
      playSound('success');
      setTimeout(() => {
        onCompleteRef.current(true, minigame.scoreReward);
      }, 1200);
    } else {
      setStatus('error');
      playSound('error');
      setTimeout(() => {
        onCompleteRef.current(false, 0);
      }, 1500);
    }
  };

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / minigame.timeLimit) * 100));
  const isUrgent = timeLeft < 3;

  return (
    <div
      className={`${styles.container} ${status === 'error' || status === 'timeout' ? styles.shakeBox : ''}`}
      role="region"
      aria-label={minigame.question}
    >
      <h2 className={styles.question}>{minigame.question}</h2>
      <p className={styles.instruction}>{dict.cooking.minigames.quizInstruction}</p>

      {/* Timer Bar */}
      <div className={styles.timerWrapper}>
        <div className={styles.timerMeta}>
          <span>{t('cooking.actionMinigame.timeLeft')}</span>
          <span className={styles.timerSeconds}>{timeLeft.toFixed(1)}s</span>
        </div>
        <div className={styles.progressBarTrack}>
          <div
            className={`${styles.progressBarFill} ${isUrgent ? styles.timerWarning : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Options Grid */}
      <div className={styles.optionsGrid} role="group" aria-label="Quiz Options">
        {options.map((optionText, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === correctIdx;
          const isWrong = isSelected && !isCorrect;
          const shouldHighlightCorrect = isFinished && isCorrect;

          let btnClass = styles.optionButton;
          if (shouldHighlightCorrect) {
            btnClass += ` ${styles.optionCorrect}`;
          } else if (isWrong) {
            btnClass += ` ${styles.optionWrong}`;
          }

          const letter = OPTION_LETTERS[idx] ?? `${idx + 1}`;

          return (
            <Button
              key={idx}
              variant={isSelected ? 'primary' : 'secondary'}
              className={btnClass}
              disabled={isFinished}
              onClick={() => handleSelectOption(idx)}
            >
              <span className={styles.optionIndexBadge}>{letter}</span>
              <span className={styles.optionText}>{optionText}</span>
              {shouldHighlightCorrect ? <span>✓</span> : isWrong ? <span>✕</span> : null}
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
                  {dict.cooking.minigames.correctAnswer} (+{minigame.scoreReward} {t('cooking.score').toLowerCase()})
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

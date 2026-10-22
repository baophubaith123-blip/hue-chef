import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/Button';
import { useIngredients } from '@/contexts/IngredientContext';
import type { ActionCookingMinigame, CookingAction } from '@/features/recipes/types';
import { useTranslation } from '@/i18n/useTranslation';
import { playSound } from '@/lib/sound';

import styles from '@/features/cooking/components/minigames/ActionCookingGame.module.css';

export interface ActionCookingGameProps {
  minigame: ActionCookingMinigame;
  onComplete: (success: boolean, score: number) => void;
}

const DEFAULT_ACTIONS: CookingAction[] = ['steam', 'stir-fry', 'fry', 'grill', 'boil'];

export function ActionCookingGame({ minigame, onComplete }: ActionCookingGameProps) {
  const { t, dict } = useTranslation();
  const { getIngredientById } = useIngredients();

  const ingredient = getIngredientById(minigame.data.ingredientId);
  const ingredientName = ingredient?.name || minigame.data.ingredientId || 'Nguyên liệu';
  const fallbackEmoji = ingredient?.fallbackEmoji || '🍲';
  const hasImage = Boolean(ingredient?.image);

  const [imageError, setImageError] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(minigame.timeLimit);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<CookingAction | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'timeout'>('idle');

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const actions =
    minigame.data.actions && minigame.data.actions.length > 0
      ? minigame.data.actions
      : DEFAULT_ACTIONS;

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
          }, 300);
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isFinished]);

  const handleActionClick = (action: CookingAction) => {
    if (isFinished) return;

    setIsFinished(true);
    setSelectedAction(action);

    const isCorrect = action === minigame.data.correctAction;

    if (isCorrect) {
      setStatus('success');
      playSound('success');
      setTimeout(() => {
        onCompleteRef.current(true, minigame.scoreReward);
      }, 650);
    } else {
      setStatus('error');
      playSound('error');
      setTimeout(() => {
        onCompleteRef.current(false, 0);
      }, 650);
    }
  };

  const getActionLabel = (action: CookingAction): string => {
    switch (action) {
      case 'steam':
        return dict.cooking.actions.steam;
      case 'stir-fry':
        return dict.cooking.actions.stirFry;
      case 'fry':
        return dict.cooking.actions.fry;
      case 'grill':
        return dict.cooking.actions.grill;
      case 'boil':
        return dict.cooking.actions.boil;
      default:
        return action;
    }
  };

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / minigame.timeLimit) * 100));
  const isUrgent = timeLeft < 3;

  return (
    <div className={styles.container} role="region" aria-label={minigame.question}>
      <h2 className={styles.question}>{minigame.question}</h2>
      <p className={styles.instruction}>{t('cooking.actionMinigame.instruction')}</p>

      {/* Progress Bar & Timer */}
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

      {/* Central Ingredient Stage */}
      <div className={styles.stage}>
        <div
          className={`${styles.ingredientDisplay} ${
            status === 'success' ? styles.flyingToPot : ''
          } ${status === 'error' ? styles.shakeRed : ''}`}
        >
          {hasImage && !imageError ? (
            <img
              src={ingredient?.image}
              alt={ingredientName}
              className={styles.ingredientImg}
              onError={() => setImageError(true)}
            />
          ) : (
            <span className={styles.fallbackEmoji} aria-hidden="true">
              {fallbackEmoji}
            </span>
          )}
        </div>

        <div className={styles.ingredientName}>{ingredientName}</div>

        <div className={styles.potArea} aria-hidden="true">
          <span className={styles.potIcon}>🍲</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionsGrid} role="group" aria-label="Cooking Actions">
        {actions.map((act) => {
          const isSelected = selectedAction === act;
          return (
            <Button
              key={act}
              variant={isSelected ? 'primary' : 'secondary'}
              className={`${styles.actionButton} ${isSelected ? styles.actionSelected : ''}`}
              disabled={isFinished}
              onClick={() => handleActionClick(act)}
            >
              {getActionLabel(act)}
            </Button>
          );
        })}
      </div>

      {/* Status Feedback Message */}
      <div
        className={`${styles.feedbackMessage} ${
          status === 'success'
            ? styles.feedbackSuccess
            : status === 'error' || status === 'timeout'
              ? styles.feedbackError
              : ''
        }`}
        aria-live="polite"
      >
        {status === 'success'
          ? t('cooking.actionMinigame.correct')
          : status === 'error'
            ? t('cooking.actionMinigame.incorrect')
            : status === 'timeout'
              ? t('cooking.actionMinigame.timeout')
              : null}
      </div>
    </div>
  );
}

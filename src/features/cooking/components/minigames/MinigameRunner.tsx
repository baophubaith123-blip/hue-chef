import { useState } from 'react';

import type { MinigameResultEntry } from '@/features/cooking/types';
import { comboBonusForStreak } from '@/features/cooking/lib/combo';
import type { Minigame } from '@/features/recipes/types';
import { useTranslation } from '@/i18n/useTranslation';

import { ActionCookingGame } from './ActionCookingGame';
import { QuizGame } from './QuizGame';
import { TypingGame } from './TypingGame';
import styles from './MinigameRunner.module.css';

export interface MinigameRunnerProps {
  minigames: Minigame[];
  onAllComplete: (results: MinigameResultEntry[], totalScore: number) => void;
  /** Equipped-perk extra seconds per quiz question. */
  quizBonusSeconds?: number;
  /** Equipped perk: a wrong quiz pick may be retried (charges tracked by the run session). */
  quizSecondChance?: boolean;
  onQuizSecondChanceUsed?: () => void;
}

export function MinigameRunner({
  minigames,
  onAllComplete,
  quizBonusSeconds = 0,
  quizSecondChance = false,
  onQuizSecondChanceUsed,
}: MinigameRunnerProps) {
  const { dict } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [results, setResults] = useState<MinigameResultEntry[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  if (!minigames || minigames.length === 0) {
    onAllComplete([], 0);
    return null;
  }

  const currentGame = minigames[currentIndex];
  const progressPercent = Math.min(100, ((currentIndex + 1) / minigames.length) * 100);

  const handleGameComplete = (success: boolean, earnedScore: number) => {
    if (!currentGame) return;

    // Streak bonus: consecutive successful scenarios bank extra points
    // (same curve as the cooking combo — see features/cooking/lib/combo).
    const nextStreak = success ? streak + 1 : 0;
    const streakBonus = success ? comboBonusForStreak(nextStreak) : 0;
    setStreak(nextStreak);

    const newEntry: MinigameResultEntry = {
      minigameId: currentGame.id,
      title: currentGame.question,
      type: currentGame.type,
      success,
      score: success ? earnedScore + streakBonus : 0,
    };

    const nextResults = [...results, newEntry];
    const nextScore = totalScore + newEntry.score;

    setResults(nextResults);
    setTotalScore(nextScore);

    const nextIdx = currentIndex + 1;
    if (nextIdx >= minigames.length) {
      onAllComplete(nextResults, nextScore);
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  return (
    <div className={styles.runnerContainer}>
      <header className={styles.runnerHeader}>
        <div className={styles.headerTop}>
          <div className={styles.challengeTitle}>
            <span>⚡</span>
            <span>{dict.cooking.minigames.headerTitle}</span>
          </div>
          <div className={styles.headerStats}>
            <span className={styles.stepBadge}>
              {dict.cooking.minigames.stepCount(currentIndex + 1, minigames.length)}
            </span>
            <span className={styles.scoreBonusBadge}>
              {dict.cooking.minigames.bonusPoints(totalScore)}
            </span>
            {streak >= 2 ? (
              <span className={styles.streakBadge}>🔥 {dict.cooking.minigames.streak(streak)}</span>
            ) : null}
          </div>
        </div>
        <div className={styles.headerProgressTrack}>
          <div className={styles.headerProgressFill} style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <div className={styles.gameWrapper}>
        {currentGame && currentGame.type === 'action-cooking' && (
          <ActionCookingGame
            key={currentGame.id}
            minigame={currentGame}
            onComplete={handleGameComplete}
          />
        )}
        {currentGame && currentGame.type === 'typing-speed' && (
          <TypingGame
            key={currentGame.id}
            minigame={currentGame}
            onComplete={handleGameComplete}
          />
        )}
        {currentGame && currentGame.type === 'quiz' && (
          <QuizGame
            key={currentGame.id}
            minigame={currentGame}
            onComplete={handleGameComplete}
            streak={streak}
            bonusSeconds={quizBonusSeconds}
            secondChance={quizSecondChance}
            onSecondChanceUsed={onQuizSecondChanceUsed}
          />
        )}
      </div>
    </div>
  );
}

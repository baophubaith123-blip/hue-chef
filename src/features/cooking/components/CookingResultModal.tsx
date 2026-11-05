import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import type { Achievement } from '@/data/types';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import type { CookingSession } from '@/features/cooking/types';
import { useTranslation } from '@/i18n/useTranslation';
import { formatDuration } from '@/lib/format';

import styles from './CookingResultModal.module.css';

interface CookingResultModalProps {
  session: CookingSession;
  onClose: () => void;
  onRetry: () => void;
  onApplyProgress?: () => void;
  gainedXp?: number;
  newLevel?: number;
  unlockedAchievements?: Achievement[];
}

export function CookingResultModal({
  session,
  onClose,
  onRetry,
  onApplyProgress,
  gainedXp,
  newLevel,
  unlockedAchievements = [],
}: CookingResultModalProps) {
  const { t, dict } = useTranslation();
  const isSuccess = session.phase === 'success';
  const appliedRef = useRef(false);

  useEffect(() => {
    if (isSuccess && onApplyProgress && !appliedRef.current) {
      appliedRef.current = true;
      onApplyProgress();
    }
  }, [isSuccess, onApplyProgress]);

  const title = isSuccess ? t('cooking.result.successTitle') : t('cooking.result.failTitle');
  const timeUsed = Math.max(0, session.totalDurationSeconds - session.timeRemainingSeconds);

  return (
    <Modal
      isOpen
      title={title}
      onClose={isSuccess ? onClose : undefined}
      footer={
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onRetry}>
            🔄 {t('cooking.result.retry')}
          </Button>
          <Link to={`/recipes/${session.recipe.id}`} onClick={onClose}>
            <Button variant="secondary">📖 {t('cooking.result.backToRecipe')}</Button>
          </Link>
          <Link to="/home" onClick={onClose}>
            <Button variant="primary">🏠 {dict.cooking.result.backToHome}</Button>
          </Link>
        </div>
      }
    >
      <div className={styles.content}>
        {isSuccess ? (
          <>
            <div className={styles.confetti} aria-hidden="true">
              {Array.from({ length: 12 }).map((_, idx) => (
                <span key={idx} className={styles.confettiPiece} />
              ))}
            </div>

            {/* Top Celebration Banner */}
            <div className={styles.celebrationHero}>
              <div className={styles.trophyBadge} aria-hidden="true">
                🏆
              </div>
              <h3 className={styles.recipeName}>{session.recipe.name}</h3>
              <div className={styles.starsDisplay} aria-label={`${session.stars} sao`}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`${idx < session.stars ? styles.starFilled : styles.starEmpty} anim-pop anim-delay-${idx + 1}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Big Score Card */}
            <div className={styles.scoreHero}>
              <span className={styles.scoreHeroLabel}>{t('cooking.result.score')}</span>
              <span className={styles.scoreHeroValue}>{session.finalScore.toLocaleString()}</span>
            </div>

            {/* Metrics Grid */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricIcon}>⏱️</span>
                <div className={styles.metricDetails}>
                  <span className={styles.metricLabel}>{t('collection.timeUsed')}</span>
                  <span className={styles.metricValue}>{formatDuration(timeUsed)}</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <span className={styles.metricIcon}>🎯</span>
                <div className={styles.metricDetails}>
                  <span className={styles.metricLabel}>{t('cooking.result.correctCount')}</span>
                  <span className={styles.metricValue}>
                    {session.correctCount} / {session.correctCount + session.wrongCount}
                  </span>
                </div>
              </div>

              {session.comboBonus > 0 ? (
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon}>🔥</span>
                  <div className={styles.metricDetails}>
                    <span className={styles.metricLabel}>{dict.cooking.result.comboBonus}</span>
                    <span className={styles.metricValueHighlight}>+{session.comboBonus}</span>
                    <span className={styles.metricLabel}>
                      {dict.cooking.result.maxCombo(session.maxCombo)}
                    </span>
                  </div>
                </div>
              ) : null}

              {typeof gainedXp === 'number' ? (
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon}>🌟</span>
                  <div className={styles.metricDetails}>
                    <span className={styles.metricLabel}>EXP</span>
                    <span className={styles.metricValueHighlight}>+{gainedXp} XP</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Level Up Banner */}
            {typeof newLevel === 'number' ? (
              <div className={styles.levelUpCard}>
                <span className={styles.levelUpIcon}>🎉</span>
                <div>
                  <h4 className={styles.levelUpTitle}>
                    {t('cooking.result.levelUp', { lvl: newLevel } as Record<string, unknown>)}
                  </h4>
                  <p className={styles.levelUpSubtitle}>Kỹ năng đầu bếp của bạn đã nâng tầm!</p>
                </div>
              </div>
            ) : null}

            {/* Minigames Summary */}
            {session.minigameResults && session.minigameResults.length > 0 && (
              <div className={styles.minigamesSection}>
                <h4 className={styles.minigamesTitle}>{dict.cooking.result.minigamesSummary}</h4>
                <ul className={styles.minigamesList}>
                  {session.minigameResults.map((m, idx) => (
                    <li key={idx} className={styles.minigameItem}>
                      <div className={styles.minigameInfo}>
                        <span>{m.success ? '✅' : '❌'}</span>
                        <span className={styles.minigameTitle}>{m.title}</span>
                      </div>
                      <span
                        className={`${styles.minigameScore} ${
                          m.success ? styles.minigamePassed : styles.minigameFailed
                        }`}
                      >
                        {m.success ? `+${m.score}` : '+0'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 ? (
              <div className={styles.achievementSection}>
                <h4 className={styles.achievementTitle}>
                  🎖️ {t('cooking.result.achievementUnlockTitle')}
                </h4>
                <div className={styles.achievementGrid}>
                  {unlockedAchievements.map((a) => (
                    <div key={a.id} className={styles.achievementBadge}>
                      <span className={styles.achievementIcon}>{a.icon}</span>
                      <span className={styles.achievementName}>{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className={styles.failContainer}>
            <div className={styles.failIcon} aria-hidden="true">
              ⏱️
            </div>
            <h3 className={styles.failTitle}>
              {session.failReason === 'timeout'
                ? t('cooking.result.timeout')
                : t('cooking.result.unknownError')}
            </h3>
            <p className={styles.failSubtitle}>
              Đừng nản lòng! Hãy chuẩn bị lại nguyên liệu và thử sức lần nữa nhé.
            </p>
            <div className={styles.failScore}>
              <span>{t('cooking.result.score')}: </span>
              <strong>0</strong>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

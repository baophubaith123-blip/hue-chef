import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import type { Achievement } from '@/data/types';
import { AchievementIcon } from '@/components/AchievementIcon';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { Modal } from '@/components/theme-d/Modal';
import resultBannerArt from '@/assets/theme-d/game/r4-result-banner.webp';
import { WoodButton } from '@/components/theme-d/WoodButton';
import type { CookingSession } from '@/features/cooking/types';
import { useTranslation } from '@/i18n/useTranslation';
import { formatDuration } from '@/lib/format';
import { winThreshold } from '@/lib/pricing';

import styles from './CookingResultModal.module.css';

/** Fail verdicts stay on screen until the player picks a footer action,
    so the wood modal's close affordances are inert in that state —
    matching the previous modal's behaviour exactly. */
const BLOCKED_CLOSE = () => {};

export interface BossNote {
  passed: boolean;
  title: string;
  body: string;
}

interface CookingResultModalProps {
  session: CookingSession;
  onClose: () => void;
  onRetry: () => void;
  onApplyProgress?: () => void;
  gainedXp?: number;
  newLevel?: number;
  unlockedAchievements?: Achievement[];
  /** Gói H3 — verdict of a Ngự thiện boss run (license granted or not). */
  bossNote?: BossNote | null;
}

export function CookingResultModal({
  session,
  onClose,
  onRetry,
  onApplyProgress,
  gainedXp,
  newLevel,
  unlockedAchievements = [],
  bossNote = null,
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
      open
      title={title}
      onClose={isSuccess ? onClose : BLOCKED_CLOSE}
      closeLabel={t('common.close')}
      shellClass={styles.resultShell}
      bodyClass={styles.resultBody}
    >
      <div className={styles.content}>
        {isSuccess ? (
          <>
            <div className={styles.confetti} aria-hidden="true">
              {Array.from({ length: 12 }).map((_, idx) => (
                <span key={idx} className={styles.confettiPiece} />
              ))}
            </div>

            {/* Đợt 4: băng rôn ăn mừng (r4-result-banner) — sao và điểm
                là chữ thật đè lên cuộn giấy trống của băng rôn. */}
            <div className={styles.resultBanner}>
              <img className={styles.resultBannerImg} src={resultBannerArt} alt="" aria-hidden="true" />
              <div className={styles.resultBannerText}>
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
                <span className={styles.resultBannerScore}>
                  {t('cooking.result.score')}: {session.finalScore.toLocaleString()}
                </span>
              </div>
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

              {session.maxCombo >= 2 ? (
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon}>🔥</span>
                  <div className={styles.metricDetails}>
                    <span className={styles.metricLabel}>{dict.cooking.result.comboBonus}</span>
                    <span className={styles.metricValueHighlight}>×{session.maxCombo}</span>
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

              {/* Gói H2: no xu is paid out in the learning loop anymore —
                  the only rewards shown here are XP, levels and unlocks. */}
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

            {/* Per-component breakdown: shares of the dish's value (the
                rows sum exactly to the final score, capped at baseScore). */}
            {Object.keys(session.scoreParts).length > 0 && (
              <div className={styles.minigamesSection}>
                <h4 className={styles.minigamesTitle}>{dict.cooking.result.stagesSummary}</h4>
                <ul className={styles.minigamesList}>
                  {(
                    [
                      { key: 'market', icon: '🧺', name: dict.cooking.stages.marketName },
                      { key: 'catch', icon: '🎯', name: dict.cooking.stages.catchName },
                      { key: 'cook', icon: '🍳', name: dict.cooking.result.partCook },
                      { key: 'season', icon: '🧂', name: dict.cooking.stages.seasonName },
                      { key: 'finish', icon: '🍲', name: dict.cooking.stages.finishName },
                      { key: 'quiz', icon: '❓', name: dict.cooking.result.partQuiz },
                      { key: 'time', icon: '⏱️', name: dict.cooking.result.partTime },
                    ] as const
                  )
                    .filter(
                      (row) =>
                        session.scorePlan[row.key] > 0 &&
                        session.scoreParts[row.key] !== undefined,
                    )
                    .map((row) => {
                      const points = session.scoreParts[row.key] ?? 0;
                      return (
                        <li key={row.key} className={styles.minigameItem}>
                          <div className={styles.minigameInfo}>
                            <span>{row.icon}</span>
                            <span className={styles.minigameTitle}>{row.name}</span>
                          </div>
                          <span className={`${styles.minigameScore} ${styles.minigamePassed}`}>
                            +{points}
                            <span className={styles.partMax}>
                              {' '}
                              / {session.scorePlan[row.key]}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}

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
                      <AchievementIcon badgeId={a.id} category={a.category} size="xs" />
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
              {session.failReason === 'low-score' ? '📉' : '⏱️'}
            </div>
            <h3 className={styles.failTitle}>
              {session.failReason === 'timeout'
                ? t('cooking.result.timeout')
                : session.failReason === 'low-score'
                  ? dict.cooking.result.lowScoreTitle
                  : t('cooking.result.unknownError')}
            </h3>
            <p className={styles.failSubtitle}>
              {session.failReason === 'low-score'
                ? dict.cooking.result.lowScoreBody(
                    session.finalScore,
                    winThreshold(session.recipe.baseScore),
                  )
                : dict.cooking.result.failSubtitle}
            </p>
            <div className={styles.failScore}>
              <span>{t('cooking.result.score')}: </span>
              <strong>
                {session.failReason === 'low-score' ? session.finalScore.toLocaleString() : 0}
              </strong>
            </div>
          </div>
        )}

        {/* Gói H3 — the boss verdict: license granted, or why not yet. */}
        {bossNote ? (
          <div className={bossNote.passed ? styles.bossNotePassed : styles.bossNote}>
            <h4 className={styles.bossNoteTitle}>
              {bossNote.passed ? '📜 ' : '👑 '}
              {bossNote.title}
            </h4>
            <p className={styles.bossNoteBody}>{bossNote.body}</p>
          </div>
        ) : null}

        <div className={styles.modalFooter}>
          <WoodButton onClick={onRetry}>🔄 {t('cooking.result.retry')}</WoodButton>
          <Link to={`/recipes/${session.recipe.id}`} onClick={onClose}>
            <WoodButton>📖 {t('cooking.result.backToRecipe')}</WoodButton>
          </Link>
          <Link to="/home" onClick={onClose}>
            <GoldButton>🏠 {dict.cooking.result.backToHome}</GoldButton>
          </Link>
        </div>
      </div>
    </Modal>
  );
}

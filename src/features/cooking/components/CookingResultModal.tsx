import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import type { Achievement } from '@/data/types';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import type { CookingSession } from '@/features/cooking/types';
import { useTranslation } from '@/i18n/useTranslation';

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

  return (
    <Modal
      isOpen
      title={title}
      onClose={isSuccess ? onClose : undefined}
      footer={
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onRetry}>
            {t('cooking.result.retry')}
          </Button>
          <Link to={`/recipes/${session.recipe.id}`} onClick={onClose}>
            <Button variant="secondary">{t('cooking.result.backToRecipe')}</Button>
          </Link>
          <Link to="/home" onClick={onClose}>
            <Button variant="primary">{dict.cooking.result.backToHome}</Button>
          </Link>
        </div>
      }
    >
      <div className={styles.content}>
        {isSuccess ? (
          <>
            <div className={styles.statsRow}>
              <span>{t('cooking.result.score')}:</span>
              <strong>{session.finalScore}</strong>
            </div>
            <div className={styles.statsRow}>
              <span>{t('cooking.result.stars')}:</span>
              <span className={styles.starsDisplay}>
                {'★'.repeat(session.stars)}
                {'☆'.repeat(5 - session.stars)}
              </span>
            </div>
            <div className={styles.statsRow}>
              <span>
                {t('cooking.result.correctCount')} / {t('cooking.result.mistakeCount')}:
              </span>
              <span>
                {session.correctCount} / {session.wrongCount}
              </span>
            </div>
            {typeof gainedXp === 'number' ? (
              <p>
                <strong>{t('cooking.result.gainedXp', { xp: gainedXp } as Record<string, unknown>)}</strong>
              </p>
            ) : null}
            {typeof newLevel === 'number' ? (
              <p>
                <strong>{t('cooking.result.levelUp', { lvl: newLevel } as Record<string, unknown>)}</strong>
              </p>
            ) : null}
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
            {unlockedAchievements.length > 0 ? (
              <div>
                <p>
                  <strong>{t('cooking.result.achievementUnlockTitle')}:</strong>
                </p>
                <ul>
                  {unlockedAchievements.map((a) => (
                    <li key={a.id}>
                      {a.icon} {a.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p>
              {session.failReason === 'timeout'
                ? t('cooking.result.timeout')
                : t('cooking.result.unknownError')}
            </p>
            <p>{t('cooking.result.score')}: 0</p>
          </>
        )}
      </div>
    </Modal>
  );
}

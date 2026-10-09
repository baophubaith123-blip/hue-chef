import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import type { Achievement } from '@/data/types';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import type { CookingSession } from '@/features/cooking/types';
import { useTranslation } from '@/i18n/useTranslation';

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
  const { t } = useTranslation();
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
        <>
          <Button variant="secondary" onClick={onRetry}>
            {t('cooking.result.retry')}
          </Button>
          <Link to={`/recipes/${session.recipe.id}`} onClick={onClose}>
            <Button>{t('cooking.result.backToRecipe')}</Button>
          </Link>
        </>
      }
    >
      {isSuccess ? (
        <>
          <p>
            {t('cooking.result.score')}: <strong>{session.finalScore}</strong>
          </p>
          <p>
            {t('cooking.result.stars')}: {'★'.repeat(session.stars)}
            {'☆'.repeat(5 - session.stars)}
          </p>
          <p>
            {t('cooking.result.correctCount')}: {session.correctCount} · {t('cooking.result.mistakeCount')}: {session.wrongCount}
          </p>
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
    </Modal>
  );
}

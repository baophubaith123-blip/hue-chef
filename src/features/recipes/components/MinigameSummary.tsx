import { getIngredientById } from '@/data/ingredients';
import type { CookingAction, Minigame } from '@/features/recipes/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './MinigameSummary.module.css';

interface MinigameSummaryProps {
  minigames?: Minigame[];
}

const ACTION_EMOJI: Record<CookingAction, string> = {
  steam: '♨️',
  'stir-fry': '🍳',
  fry: '🥟',
  grill: '🍢',
  boil: '🍲',
};

export function MinigameSummary({ minigames }: MinigameSummaryProps) {
  const { t, dict } = useTranslation();

  if (!minigames || minigames.length === 0) {
    return <div className={styles.empty}>{t('editorMinigames.noMinigames')}</div>;
  }

  const getActionName = (action: CookingAction): string => {
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

  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        {minigames.map((mg, index) => {
          return (
            <li key={mg.id || index} className={styles.card}>
              <div className={styles.cardHeader}>
                {mg.type === 'quiz' && (
                  <span className={`${styles.typeBadge} ${styles.typeQuiz}`}>
                    ❓ {t('editorMinigames.typeQuiz')}
                  </span>
                )}
                {mg.type === 'action-cooking' && (
                  <span className={`${styles.typeBadge} ${styles.typeAction}`}>
                    🍳 {t('editorMinigames.typeActionCooking')}
                  </span>
                )}
                {mg.type === 'typing-speed' && (
                  <span className={`${styles.typeBadge} ${styles.typeTyping}`}>
                    ⌨️ {t('editorMinigames.typeTypingSpeed')}
                  </span>
                )}

                <div className={styles.metaGroup}>
                  <span>⏱ {mg.timeLimit}s</span>
                  <span>⭐ +{mg.scoreReward} pts</span>
                </div>
              </div>

              <h4 className={styles.question}>{mg.question}</h4>

              {/* Quiz content */}
              {mg.type === 'quiz' && (
                <div className={styles.details}>
                  <ul className={styles.optionsList}>
                    {mg.data.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === mg.data.correctAnswerIndex;
                      return (
                        <li
                          key={optIdx}
                          className={`${styles.optionItem} ${
                            isCorrect ? styles.correctOption : ''
                          }`}
                        >
                          <span>{isCorrect ? '✓' : '•'}</span>
                          <span>{opt}</span>
                          {isCorrect ? (
                            <span aria-hidden>({t('editorMinigames.correctOption')})</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  {mg.data.explanation ? (
                    <div className={styles.explanation}>
                      💡 {t('editorMinigames.explanation')}: {mg.data.explanation}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Action cooking content */}
              {mg.type === 'action-cooking' && (
                <div className={styles.details}>
                  <div className={styles.actionRow}>
                    <span>{t('editorMinigames.ingredient')}:</span>
                    {(() => {
                      const ing = getIngredientById(mg.data.ingredientId);
                      return (
                        <span className={styles.ingredientHighlight}>
                          {ing?.fallbackEmoji || '🍲'} {ing?.name || mg.data.ingredientId}
                        </span>
                      );
                    })()}
                  </div>

                  <div className={styles.actionRow}>
                    <span>{t('editorMinigames.correctAction')}:</span>
                    <span className={styles.correctActionBadge}>
                      {ACTION_EMOJI[mg.data.correctAction] || '⚡'}{' '}
                      {getActionName(mg.data.correctAction)}
                    </span>
                  </div>

                  <div className={styles.actionRow}>
                    <span>{t('editorMinigames.allowedActions')}:</span>
                    <div className={styles.actionTags}>
                      {mg.data.actions.map((act) => (
                        <span key={act} className={styles.actionTag}>
                          {ACTION_EMOJI[act]} {getActionName(act)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Typing speed content */}
              {mg.type === 'typing-speed' && (
                <div className={styles.details}>
                  <div className={styles.actionRow}>
                    <span>{t('editorMinigames.typingText')}:</span>
                    <span className={styles.targetTextQuote}>"{mg.data.targetText}"</span>
                  </div>
                  <div className={styles.actionRow}>
                    <span>{t('editorMinigames.speed')}:</span>
                    <span className={styles.actionTag}>
                      {mg.data.speed === 'slow' && t('editorMinigames.speedSlow')}
                      {mg.data.speed === 'normal' && t('editorMinigames.speedNormal')}
                      {mg.data.speed === 'fast' && t('editorMinigames.speedFast')}
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

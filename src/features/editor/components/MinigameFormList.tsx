import { useMemo } from 'react';

import { Button } from '@/components/Button';
import { useIngredients } from '@/contexts/IngredientContext';
import type { RecipeIngredientRef } from '@/data/types';
import type {
  ActionCookingMinigame,
  CookingAction,
  Minigame,
  QuizMinigame,
  TypingMinigame,
} from '@/features/recipes/types';
import {
  REQUIRED_ACTION_BY_STARS,
  validateMinigames,
} from '@/features/recipes/validation';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './MinigameFormList.module.css';

interface MinigameFormListProps {
  minigames: Minigame[];
  onChange: (minigames: Minigame[]) => void;
  stars: 1 | 2 | 3 | 4 | 5;
  recipeIngredients: RecipeIngredientRef[];
}

const ALL_ACTIONS: CookingAction[] = ['steam', 'stir-fry', 'fry', 'grill', 'boil'];

export function MinigameFormList({
  minigames,
  onChange,
  stars,
  recipeIngredients,
}: MinigameFormListProps) {
  const { t, dict } = useTranslation();
  const { ingredients } = useIngredients();

  const requiredActionCount = REQUIRED_ACTION_BY_STARS[stars] ?? 1;
  const currentActionCount = minigames.filter((m) => m.type === 'action-cooking').length;
  const isSatisfied = currentActionCount >= requiredActionCount && minigames.length > 0;

  const availableIngredientIds = useMemo(() => {
    if (recipeIngredients.length > 0) {
      return recipeIngredients.map((r) => r.ingredientId).filter(Boolean);
    }
    return ingredients.map((i) => i.id);
  }, [recipeIngredients, ingredients]);

  const validation = useMemo(() => {
    return validateMinigames(minigames, stars, availableIngredientIds);
  }, [minigames, stars, availableIngredientIds]);

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

  const handleAddMinigame = () => {
    const newId = `mg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fallbackIngId = availableIngredientIds[0] || ingredients[0]?.id || 'tom-dat';
    const newMinigame: ActionCookingMinigame = {
      id: newId,
      type: 'action-cooking',
      question: 'Hãy chọn phương pháp chế biến chuẩn xác cho nguyên liệu này',
      timeLimit: 10,
      scoreReward: 50,
      data: {
        ingredientId: fallbackIngId,
        actions: ['steam', 'stir-fry', 'fry', 'grill', 'boil'],
        correctAction: 'stir-fry',
      },
    };
    onChange([...minigames, newMinigame]);
  };

  const handleRemove = (index: number) => {
    onChange(minigames.filter((_, idx) => idx !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= minigames.length) return;
    const next = [...minigames];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  };

  const handleUpdate = (index: number, updated: Minigame) => {
    onChange(minigames.map((m, idx) => (idx === index ? updated : m)));
  };

  const handleChangeType = (
    index: number,
    newType: 'quiz' | 'action-cooking' | 'typing-speed',
  ) => {
    const curr = minigames[index];
    if (curr.type === newType) return;

    if (newType === 'quiz') {
      const converted: QuizMinigame = {
        id: curr.id,
        question: curr.question || 'Câu hỏi trắc nghiệm ẩm thực Huế',
        timeLimit: curr.timeLimit || 15,
        scoreReward: curr.scoreReward || 50,
        type: 'quiz',
        data: {
          options: [
            dict.editorMinigames.defaultOption1,
            dict.editorMinigames.defaultOption2,
            dict.editorMinigames.defaultOption3,
          ],
          correctAnswerIndex: 0,
          explanation: '',
        },
      };
      handleUpdate(index, converted);
    } else if (newType === 'action-cooking') {
      const fallbackIngId = availableIngredientIds[0] || ingredients[0]?.id || 'tom-dat';
      const converted: ActionCookingMinigame = {
        id: curr.id,
        question: curr.question || 'Hãy chọn thao tác chế biến thích hợp',
        timeLimit: curr.timeLimit || 10,
        scoreReward: curr.scoreReward || 50,
        type: 'action-cooking',
        data: {
          ingredientId: fallbackIngId,
          actions: ['steam', 'stir-fry', 'fry', 'grill', 'boil'],
          correctAction: 'stir-fry',
        },
      };
      handleUpdate(index, converted);
    } else if (newType === 'typing-speed') {
      const converted: TypingMinigame = {
        id: curr.id,
        question: curr.question || 'Gõ lại thật nhanh và chính xác tên món ăn',
        timeLimit: curr.timeLimit || 12,
        scoreReward: curr.scoreReward || 50,
        type: 'typing-speed',
        data: {
          targetText: 'Bún bò Huế cay nồng thơm lừng',
          speed: 'normal',
        },
      };
      handleUpdate(index, converted);
    }
  };

  return (
    <div className={styles.container}>
      {/* Star requirement banner */}
      <div
        className={`${styles.statusBanner} ${
          isSatisfied ? styles.statusBannerSuccess : styles.statusBannerWarning
        }`}
      >
        <span>
          {t('editorMinigames.requirementStatus', {
            required: requiredActionCount,
            current: currentActionCount,
            total: minigames.length,
          } as Record<string, unknown>)}
        </span>
        <span>
          {isSatisfied
            ? `✓ ${t('editorMinigames.allValid')}`
            : `⚠️ ${t('editorMinigames.insufficientAction', {
                required: requiredActionCount,
                current: currentActionCount,
              } as Record<string, unknown>)}`}
        </span>
      </div>

      {validation.errors.length > 0 && (
        <div className={styles.errorsList}>
          {validation.errors.map((err, i) => {
            const [key, param] = err.split(':');
            const subKey = key.replace('minigameValidation.', '') as keyof typeof dict.minigameValidation;
            const text = dict.minigameValidation[subKey] || err;
            return <div key={i}>• {param ? `#${param}: ${text}` : text}</div>;
          })}
        </div>
      )}

      {/* Minigames list */}
      {minigames.map((mg, index) => (
        <div key={mg.id || index} className={styles.minigameItem}>
          <div className={styles.itemTopRow}>
            <div className={styles.itemControls}>
              <strong>#{index + 1}</strong>
              <select
                className={styles.typeSelect}
                value={mg.type}
                onChange={(e) =>
                  handleChangeType(
                    index,
                    e.target.value as 'quiz' | 'action-cooking' | 'typing-speed',
                  )
                }
              >
                <option value="action-cooking">{t('editorMinigames.typeActionCooking')}</option>
                <option value="quiz">{t('editorMinigames.typeQuiz')}</option>
                <option value="typing-speed">{t('editorMinigames.typeTypingSpeed')}</option>
              </select>
            </div>

            <div className={styles.itemControls}>
              <Button
                type="button"
                variant="ghost"
                disabled={index === 0}
                onClick={() => handleMove(index, 'up')}
              >
                ↑ {t('editorMinigames.moveUp')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={index === minigames.length - 1}
                onClick={() => handleMove(index, 'down')}
              >
                ↓ {t('editorMinigames.moveDown')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleRemove(index)}
              >
                🗑️ {t('editorMinigames.remove')}
              </Button>
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>{t('editorMinigames.question')}</label>
              <input
                className={styles.input}
                value={mg.question}
                onChange={(e) => handleUpdate(index, { ...mg, question: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('editorMinigames.timeLimit')}</label>
              <input
                className={styles.input}
                type="number"
                min={5}
                max={60}
                value={mg.timeLimit}
                onChange={(e) =>
                  handleUpdate(index, { ...mg, timeLimit: Number(e.target.value) || 10 })
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('editorMinigames.scoreReward')}</label>
              <input
                className={styles.input}
                type="number"
                min={10}
                step={10}
                value={mg.scoreReward}
                onChange={(e) =>
                  handleUpdate(index, { ...mg, scoreReward: Number(e.target.value) || 50 })
                }
              />
            </div>

            {/* Quiz Fields */}
            {mg.type === 'quiz' && (
              <>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>{t('editorMinigames.options')}</label>
                  <div className={styles.optionsContainer}>
                    {mg.data.options.map((opt, optIdx) => (
                      <div key={optIdx} className={styles.optionRow}>
                        <input
                          type="radio"
                          name={`quiz-correct-${mg.id}`}
                          className={styles.radioOption}
                          checked={mg.data.correctAnswerIndex === optIdx}
                          onChange={() =>
                            handleUpdate(index, {
                              ...mg,
                              data: { ...mg.data, correctAnswerIndex: optIdx },
                            })
                          }
                          title={t('editorMinigames.correctOption')}
                        />
                        <input
                          className={styles.input}
                          value={opt}
                          onChange={(e) => {
                            const nextOptions = [...mg.data.options];
                            nextOptions[optIdx] = e.target.value;
                            handleUpdate(index, {
                              ...mg,
                              data: { ...mg.data, options: nextOptions },
                            });
                          }}
                        />
                        {mg.data.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              const nextOptions = mg.data.options.filter((_, i) => i !== optIdx);
                              // Removing an option BEFORE the correct one shifts
                              // the correct answer one position earlier.
                              const shifted =
                                optIdx < mg.data.correctAnswerIndex
                                  ? mg.data.correctAnswerIndex - 1
                                  : mg.data.correctAnswerIndex;
                              const nextCorrect = Math.min(shifted, nextOptions.length - 1);
                              handleUpdate(index, {
                                ...mg,
                                data: {
                                  ...mg.data,
                                  options: nextOptions,
                                  correctAnswerIndex: nextCorrect,
                                },
                              });
                            }}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                    {mg.data.options.length < 5 && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          handleUpdate(index, {
                            ...mg,
                            data: {
                              ...mg.data,
                              options: [
                                ...mg.data.options,
                                dict.editorMinigames.newOption(mg.data.options.length + 1),
                              ],
                            },
                          })
                        }
                      >
                        {t('editorMinigames.addOption')}
                      </Button>
                    )}
                  </div>
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>{t('editorMinigames.explanation')}</label>
                  <textarea
                    className={styles.textarea}
                    value={mg.data.explanation}
                    onChange={(e) =>
                      handleUpdate(index, {
                        ...mg,
                        data: { ...mg.data, explanation: e.target.value },
                      })
                    }
                  />
                </div>
              </>
            )}

            {/* Action Cooking Fields */}
            {mg.type === 'action-cooking' && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>{t('editorMinigames.ingredient')}</label>
                  <select
                    className={styles.select}
                    value={mg.data.ingredientId}
                    onChange={(e) =>
                      handleUpdate(index, {
                        ...mg,
                        data: { ...mg.data, ingredientId: e.target.value },
                      })
                    }
                  >
                    <option value="">{t('editorMinigames.selectIngredient')}</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.fallbackEmoji} {ing.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>{t('editorMinigames.correctAction')}</label>
                  <select
                    className={styles.select}
                    value={mg.data.correctAction}
                    onChange={(e) => {
                      const nextAct = e.target.value as CookingAction;
                      const nextActions = mg.data.actions.includes(nextAct)
                        ? mg.data.actions
                        : [...mg.data.actions, nextAct];
                      handleUpdate(index, {
                        ...mg,
                        data: {
                          ...mg.data,
                          correctAction: nextAct,
                          actions: nextActions,
                        },
                      });
                    }}
                  >
                    {ALL_ACTIONS.map((act) => (
                      <option key={act} value={act}>
                        {getActionLabel(act)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>{t('editorMinigames.allowedActions')}</label>
                  <div className={styles.actionsCheckboxGroup}>
                    {ALL_ACTIONS.map((act) => {
                      const isChecked = mg.data.actions.includes(act);
                      const isCorrect = mg.data.correctAction === act;
                      return (
                        <label key={act} className={styles.actionCheckItem}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isCorrect} // Correct action must always remain checked
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const nextActions = checked
                                ? [...mg.data.actions, act]
                                : mg.data.actions.filter((a) => a !== act);
                              handleUpdate(index, {
                                ...mg,
                                data: { ...mg.data, actions: nextActions },
                              });
                            }}
                          />
                          <span>{getActionLabel(act)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Typing Speed Fields */}
            {mg.type === 'typing-speed' && (
              <>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>{t('editorMinigames.typingText')}</label>
                  <input
                    className={styles.input}
                    value={mg.data.targetText}
                    onChange={(e) =>
                      handleUpdate(index, {
                        ...mg,
                        data: { ...mg.data, targetText: e.target.value },
                      })
                    }
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>{t('editorMinigames.speed')}</label>
                  <select
                    className={styles.select}
                    value={mg.data.speed}
                    onChange={(e) =>
                      handleUpdate(index, {
                        ...mg,
                        data: {
                          ...mg.data,
                          speed: e.target.value as 'slow' | 'normal' | 'fast',
                        },
                      })
                    }
                  >
                    <option value="slow">{t('editorMinigames.speedSlow')}</option>
                    <option value="normal">{t('editorMinigames.speedNormal')}</option>
                    <option value="fast">{t('editorMinigames.speedFast')}</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      <div>
        <Button type="button" variant="secondary" onClick={handleAddMinigame}>
          + {t('editorMinigames.add')}
        </Button>
      </div>
    </div>
  );
}

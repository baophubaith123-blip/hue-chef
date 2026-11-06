import { useState, type FormEvent } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import type {
  Achievement,
  AchievementCondition,
  AchievementRarity,
  PerkKind,
} from '@/data/types';
import { PERK_KINDS } from '@/features/achievements/lib/perks';
import { useEditorAchievements } from '@/features/editor/hooks/useEditorAchievements';
import { useTranslation } from '@/i18n/useTranslation';
import { EditorShell } from '@/pages/editor/EditorShell';

import styles from '@/pages/editor/EditorAchievementsPage.module.css';

type ConditionType = AchievementCondition['type'];

const CONDITION_TYPES: ConditionType[] = [
  'cook_count',
  'perfect_score',
  'perfect_count',
  'no_mistakes',
  'all_categories',
  'score_threshold',
  'level',
  'cook_difficulty',
  'own_count',
  'coins_earned',
  'own_difficulty',
];

const RARITIES: AchievementRarity[] = ['common', 'rare', 'epic', 'legendary'];

function defaultCondition(type: ConditionType): AchievementCondition {
  switch (type) {
    case 'cook_count':
      return { type: 'cook_count', count: 1 };
    case 'perfect_score':
      return { type: 'perfect_score' };
    case 'perfect_count':
      return { type: 'perfect_count', count: 1 };
    case 'no_mistakes':
      return { type: 'no_mistakes', count: 1 };
    case 'all_categories':
      return { type: 'all_categories' };
    case 'score_threshold':
      return { type: 'score_threshold', score: 1000 };
    case 'level':
      return { type: 'level', level: 1 };
    case 'cook_difficulty':
      return { type: 'cook_difficulty', difficulty: 5, count: 1 };
    case 'own_count':
      return { type: 'own_count', count: 1 };
    case 'coins_earned':
      return { type: 'coins_earned', amount: 1000 };
    case 'own_difficulty':
      return { type: 'own_difficulty', difficulty: 5, count: 1 };
  }
}

export default function EditorAchievementsPage() {
  const { t, dict } = useTranslation();
  const { recipeCategoryOptions, recipeCategoryLabel } = useTaxonomy();
  const { mySubmissions, myCatalogueEntries, createSubmission } = useEditorAchievements();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏆');
  const [rarity, setRarity] = useState<AchievementRarity>('common');
  const [condition, setCondition] = useState<AchievementCondition>({ type: 'cook_count', count: 1 });
  const [perkKind, setPerkKind] = useState<PerkKind | ''>('');
  const [perkValue, setPerkValue] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const condCount = 'count' in condition ? condition.count : 1;
  const condScore = 'score' in condition ? condition.score : 1000;
  const condAmount = 'amount' in condition ? condition.amount : 1000;
  const condLevel = 'level' in condition ? condition.level : 1;
  const condDifficulty = 'difficulty' in condition ? condition.difficulty : 5;
  const condCategory = condition.type === 'cook_count' ? condition.category : undefined;

  const patchConditionCount = (count: number) => {
    switch (condition.type) {
      case 'cook_count':
        setCondition({ ...condition, count });
        break;
      case 'perfect_count':
        setCondition({ type: 'perfect_count', count });
        break;
      case 'no_mistakes':
        setCondition({ type: 'no_mistakes', count });
        break;
      case 'cook_difficulty':
        setCondition({ type: 'cook_difficulty', difficulty: condDifficulty, count });
        break;
      case 'own_count':
        setCondition({ type: 'own_count', count });
        break;
      case 'own_difficulty':
        setCondition({ type: 'own_difficulty', difficulty: condDifficulty, count });
        break;
      default:
        break;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name.trim() || !description.trim()) {
      setError(t('errors.required'));
      return;
    }
    const draft: Omit<Achievement, 'id' | 'createdBy'> = {
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim() || '🏆',
      rarity,
      condition,
      perk: perkKind ? { kind: perkKind, value: perkValue } : undefined,
    };
    createSubmission(draft);
    setName('');
    setDescription('');
    setIcon('🏆');
    setRarity('common');
    setCondition({ type: 'cook_count', count: 1 });
    setPerkKind('');
    setPerkValue(5);
    setSuccess(t('editorAchievements.createdPending'));
  };

  const rarityLabel = (r?: AchievementRarity): string => {
    switch (r) {
      case 'rare':
        return t('achievements.rarityRare');
      case 'epic':
        return t('achievements.rarityEpic');
      case 'legendary':
        return t('achievements.rarityLegendary');
      default:
        return t('achievements.rarityCommon');
    }
  };

  const statusLabel = (status: string): string =>
    status === 'approved'
      ? t('editorAchievements.statusApproved')
      : status === 'rejected'
        ? t('editorAchievements.statusRejected')
        : t('editorAchievements.statusPending');

  return (
    <EditorShell>
      <Card title={t('editorAchievements.title')}>
        <p>{t('editorAchievements.intro')}</p>
      </Card>

      <Card title={t('editorAchievements.createTitle')}>
        {error ? <p className={styles.error}>{error}</p> : null}
        {success ? <p className={styles.success}>{success}</p> : null}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ach-name">{t('admin.colName')}</label>
            <input
              id="ach-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ach-desc">{t('common.description')}</label>
            <input
              id="ach-desc"
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ach-icon">{t('editorAchievements.iconLabel')}</label>
              <input
                id="ach-icon"
                className={styles.input}
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ach-rarity">{t('editorAchievements.rarityLabel')}</label>
              <select
                id="ach-rarity"
                className={styles.select}
                value={rarity}
                onChange={(e) => setRarity(e.target.value as AchievementRarity)}
              >
                {RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {rarityLabel(r)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ach-cond">{t('editorAchievements.conditionLabel')}</label>
              <select
                id="ach-cond"
                className={styles.select}
                value={condition.type}
                onChange={(e) => setCondition(defaultCondition(e.target.value as ConditionType))}
              >
                {CONDITION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {dict.editorAchievements.conditionTypes[type] ?? type}
                  </option>
                ))}
              </select>
            </div>
            {'count' in condition ? (
              <div className={styles.field}>
                <label className={styles.label}>{t('editorAchievements.conditionCount')}</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={condCount}
                  onChange={(e) => patchConditionCount(Number(e.target.value) || 1)}
                />
              </div>
            ) : null}
            {condition.type === 'score_threshold' ? (
              <div className={styles.field}>
                <label className={styles.label}>{t('editorAchievements.conditionScore')}</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={condScore}
                  onChange={(e) => setCondition({ type: 'score_threshold', score: Number(e.target.value) || 0 })}
                />
              </div>
            ) : null}
            {condition.type === 'coins_earned' ? (
              <div className={styles.field}>
                <label className={styles.label}>{t('editorAchievements.conditionAmount')}</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={condAmount}
                  onChange={(e) => setCondition({ type: 'coins_earned', amount: Number(e.target.value) || 0 })}
                />
              </div>
            ) : null}
            {condition.type === 'level' ? (
              <div className={styles.field}>
                <label className={styles.label}>{t('editorAchievements.conditionLevel')}</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={condLevel}
                  onChange={(e) => setCondition({ type: 'level', level: Number(e.target.value) || 1 })}
                />
              </div>
            ) : null}
            {'difficulty' in condition ? (
              <div className={styles.field}>
                <label className={styles.label}>{t('editorAchievements.conditionDifficulty')}</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  max={5}
                  value={condDifficulty}
                  onChange={(e) => {
                    const difficulty = Number(e.target.value) || 1;
                    if (condition.type === 'cook_difficulty') {
                      setCondition({ type: 'cook_difficulty', difficulty, count: condCount });
                    } else if (condition.type === 'own_difficulty') {
                      setCondition({ type: 'own_difficulty', difficulty, count: condCount });
                    }
                  }}
                />
              </div>
            ) : null}
            {condition.type === 'cook_count' ? (
              <div className={styles.field}>
                <label className={styles.label}>{t('editorAchievements.conditionCategory')}</label>
                <select
                  className={styles.select}
                  value={condCategory ?? ''}
                  onChange={(e) =>
                    setCondition({
                      type: 'cook_count',
                      count: condCount,
                      category: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">—</option>
                  {recipeCategoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {recipeCategoryLabel(option.id)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ach-perk">{t('admin.perkKind')}</label>
              <select
                id="ach-perk"
                className={styles.select}
                value={perkKind}
                onChange={(e) => setPerkKind(e.target.value as PerkKind | '')}
              >
                <option value="">{t('admin.perkNone')}</option>
                {PERK_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {dict.perks.name[kind]}
                  </option>
                ))}
              </select>
            </div>
            {perkKind ? (
              <div className={styles.field}>
                <label className={styles.label}>{t('admin.perkValue')}</label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={perkValue}
                  onChange={(e) => setPerkValue(Number(e.target.value) || 0)}
                />
                <span className={styles.hint}>
                  ⚡ {dict.perks.describe[perkKind](perkValue)} · {t('admin.perkValueHint')}
                </span>
              </div>
            ) : null}
          </div>

          <div>
            <Button type="submit">{t('editorAchievements.submitCreate')}</Button>
          </div>
        </form>
      </Card>

      <Card title={t('editorAchievements.myListTitle')}>
        {mySubmissions.length === 0 ? (
          <EmptyState title={t('editorAchievements.emptyList')} />
        ) : (
          <ul className={styles.list}>
            {mySubmissions.map((sub) => (
              <li key={sub.achievement.id} className={styles.item}>
                <span className={styles.itemIcon}>{sub.achievement.icon}</span>
                <div className={styles.itemMain}>
                  <strong>{sub.achievement.name}</strong>
                  <span className={styles.itemDesc}>
                    {sub.achievement.description} · {rarityLabel(sub.achievement.rarity)}
                    {sub.achievement.perk
                      ? ` · ⚡ ${dict.perks.describe[sub.achievement.perk.kind](sub.achievement.perk.value)}`
                      : ''}
                  </span>
                </div>
                <span className={`${styles.chip} ${styles[`chip_${sub.status}`]}`}>
                  {statusLabel(sub.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={t('editorAchievements.seedListTitle')}>
        {myCatalogueEntries.length === 0 ? (
          <EmptyState title={t('editorAchievements.emptyList')} />
        ) : (
          <ul className={styles.list}>
            {myCatalogueEntries.map((a) => (
              <li key={a.id} className={styles.item}>
                <span className={styles.itemIcon}>{a.icon}</span>
                <div className={styles.itemMain}>
                  <strong>{a.name}</strong>
                  <span className={styles.itemDesc}>
                    {a.description} · {rarityLabel(a.rarity)}
                    {a.perk ? ` · ⚡ ${dict.perks.describe[a.perk.kind](a.perk.value)}` : ''}
                  </span>
                </div>
                <span className={`${styles.chip} ${styles.chip_approved}`}>
                  {t('editorAchievements.statusApproved')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </EditorShell>
  );
}

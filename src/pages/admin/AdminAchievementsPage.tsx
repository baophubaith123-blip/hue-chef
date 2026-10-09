import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { SEED_ACHIEVEMENTS } from '@/data/achievements';
import type { Achievement, AchievementCondition } from '@/data/types';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';

import styles from '@/pages/admin/AdminAchievementsPage.module.css';

type ConditionType = AchievementCondition['type'];

function emptyForm(): Achievement {
  return {
    id: `achievement-${crypto.randomUUID()}`,
    name: '',
    description: '',
    icon: '🏆',
    condition: { type: 'cook_count', count: 1 },
  };
}

export default function AdminAchievementsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const admin = useAdmin();
  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick((x) => x + 1);

  const achievements = useMemo<Achievement[]>(() => {
    const custom = admin.listAdminAchievements();
    if (custom.length > 0) return custom;
    return SEED_ACHIEVEMENTS.slice();
  }, [admin, refreshTick]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Achievement>(emptyForm());
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm((f) => {
      if (f.condition.type === 'cook_count') {
        return { ...f, condition: { ...f.condition, count: (f.condition as { count: number }).count || 1 } };
      }
      return f;
    });
  }, [form.condition.type]);

  const openCreate = () => {
    setForm(emptyForm());
    setIsEditing(false);
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEdit = (a: Achievement) => {
    setForm({ ...a, condition: { ...a.condition } as AchievementCondition });
    setIsEditing(true);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleDelete = (a: Achievement) => {
    if (!user) return;
    const confirmed = window.confirm(t('common.confirm'));
    if (!confirmed) return;
    try {
      admin.deleteAchievement(a.id, user);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim() || !form.description.trim()) {
      setErrorMsg(t('errors.required'));
      return;
    }
    try {
      admin.upsertAchievement(
        {
          ...form,
          name: form.name.trim(),
          description: form.description.trim(),
        },
        user,
      );
      setShowModal(false);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const setConditionType = (type: ConditionType) => {
    let next: AchievementCondition;
    switch (type) {
      case 'cook_count':
        next = { type: 'cook_count', count: 1 };
        break;
      case 'perfect_score':
        next = { type: 'perfect_score' };
        break;
      case 'no_mistakes':
        next = { type: 'no_mistakes', count: 1 };
        break;
      case 'all_categories':
        next = { type: 'all_categories' };
        break;
      case 'score_threshold':
        next = { type: 'score_threshold', score: 1000 };
        break;
      case 'level':
        next = { type: 'level', level: 1 };
        break;
    }
    setForm({ ...form, condition: next });
  };

  const condType = form.condition.type;
  const condCount = 'count' in form.condition ? (form.condition as { count: number }).count : 0;
  const condScore = 'score' in form.condition ? (form.condition as { score: number }).score : 0;
  const condLevel = 'level' in form.condition ? (form.condition as { level: number }).level : 0;
  const condCategory =
    'category' in form.condition ? (form.condition as { category?: 'bun' | 'com' | 'banh' | 'che' | 'nem' }).category : undefined;

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.achievementsTitle')}</h1>
          <p className={styles.intro}>{t('admin.achievementsIntro')}</p>
        </div>
        <div>
          <Button onClick={openCreate}>+ {t('admin.addAchievement')}</Button>
        </div>
      </header>

      {errorMsg ? (
        <div className={styles.errorBanner} role="alert">
          {errorMsg}
        </div>
      ) : null}

      <Card>
        {achievements.length === 0 ? (
          <EmptyState title={t('admin.achievementsTitle')} />
        ) : (
          <div className={styles.tableOverflow}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>{t('admin.colName')}</th>
                  <th>{t('common.description')}</th>
                  <th>Condition</th>
                  <th className={styles.actionsCol}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {achievements.map((a) => (
                  <tr key={a.id} className={styles.row}>
                    <td className={styles.iconCell}>{a.icon}</td>
                    <td className={styles.nameCell}>{a.name}</td>
                    <td>{a.description}</td>
                    <td>
                      <code className={styles.code}>{describeCondition(a.condition)}</code>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionsGroup}>
                        <Button variant="ghost" className={styles.btnSm} onClick={() => openEdit(a)}>
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          className={`${styles.btnSm} ${styles.deleteBtn}`}
                          onClick={() => handleDelete(a)}
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        title={isEditing ? t('admin.editAchievement') : t('admin.addAchievement')}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" form="ach-form">
              {t('common.save')}
            </Button>
          </>
        }
      >
        <form id="ach-form" className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Icon</label>
            <input
              className={styles.input}
              type="text"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              maxLength={8}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('admin.colName')}</label>
            <input
              className={styles.input}
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('common.description')}</label>
            <textarea
              className={styles.textarea}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Condition type</label>
            <select
              className={styles.input}
              value={condType}
              onChange={(e) => setConditionType(e.target.value as ConditionType)}
            >
              <option value="cook_count">cook_count</option>
              <option value="perfect_score">perfect_score</option>
              <option value="no_mistakes">no_mistakes</option>
              <option value="all_categories">all_categories</option>
              <option value="score_threshold">score_threshold</option>
              <option value="level">level</option>
            </select>
          </div>
          {condType === 'cook_count' ? (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Count</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={condCount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      condition: { type: 'cook_count', count: Number(e.target.value), category: condCategory },
                    })
                  }
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Category (optional)</label>
                <select
                  className={styles.input}
                  value={condCategory ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      condition: {
                        type: 'cook_count',
                        count: condCount,
                        category: e.target.value ? (e.target.value as 'bun' | 'com' | 'banh' | 'che' | 'nem') : undefined,
                      },
                    })
                  }
                >
                  <option value="">All</option>
                  <option value="bun">bun</option>
                  <option value="com">com</option>
                  <option value="banh">banh</option>
                  <option value="che">che</option>
                  <option value="nem">nem</option>
                </select>
              </div>
            </>
          ) : null}
          {condType === 'no_mistakes' ? (
            <div className={styles.field}>
              <label className={styles.label}>Count</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={condCount}
                onChange={(e) =>
                  setForm({ ...form, condition: { type: 'no_mistakes', count: Number(e.target.value) } })
                }
              />
            </div>
          ) : null}
          {condType === 'score_threshold' ? (
            <div className={styles.field}>
              <label className={styles.label}>Score</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={condScore}
                onChange={(e) =>
                  setForm({ ...form, condition: { type: 'score_threshold', score: Number(e.target.value) } })
                }
              />
            </div>
          ) : null}
          {condType === 'level' ? (
            <div className={styles.field}>
              <label className={styles.label}>Level</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={condLevel}
                onChange={(e) =>
                  setForm({ ...form, condition: { type: 'level', level: Number(e.target.value) } })
                }
              />
            </div>
          ) : null}
        </form>
      </Modal>
    </AdminShell>
  );
}

function describeCondition(c: AchievementCondition): string {
  switch (c.type) {
    case 'cook_count':
      return `cook_count: ${c.count}${c.category ? ` (${c.category})` : ''}`;
    case 'perfect_score':
      return 'perfect_score';
    case 'no_mistakes':
      return `no_mistakes: ${c.count}`;
    case 'all_categories':
      return 'all_categories';
    case 'score_threshold':
      return `score_threshold: ${c.score}`;
    case 'level':
      return `level: ${c.level}`;
  }
}

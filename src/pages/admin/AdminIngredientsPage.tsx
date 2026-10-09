import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import type { Ingredient } from '@/data/types';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';

import styles from '@/pages/admin/AdminIngredientsPage.module.css';

type IngredientCategory = Ingredient['category'];

const CATEGORY_OPTIONS: IngredientCategory[] = ['protein', 'vegetable', 'spice', 'grain', 'other'];

function emptyIngredient(): Ingredient {
  return { id: `ingredient-${crypto.randomUUID()}`, name: '', category: 'other' };
}

export default function AdminIngredientsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const admin = useAdmin();
  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick((x) => x + 1);

  const ingredients = useMemo(() => admin.listIngredients(), [admin, refreshTick]);

  const [form, setForm] = useState<Ingredient>(emptyIngredient());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const name = form.name.trim();
    if (!name) {
      setErrorMsg(t('errors.required'));
      return;
    }
    try {
      admin.upsertIngredient({ ...form, name }, user);
      setForm(emptyIngredient());
      setEditingId(null);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const startEdit = (ing: Ingredient) => {
    setForm({ ...ing });
    setEditingId(ing.id);
    setErrorMsg(null);
  };

  const cancelEdit = () => {
    setForm(emptyIngredient());
    setEditingId(null);
    setErrorMsg(null);
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    const confirmed = window.confirm(t('common.confirm'));
    if (!confirmed) return;
    try {
      admin.deleteIngredient(id, user);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const isEditing = editingId !== null;

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.ingredientMgmtTitle')}</h1>
          <p className={styles.intro}>{t('admin.ingredientMgmtIntro')}</p>
        </div>
      </header>

      <Card title={isEditing ? t('common.edit') : t('admin.addIngredient')}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>{t('admin.ingredientName')}</label>
            <input
              className={styles.input}
              type="text"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
              placeholder={t('admin.ingredientName')}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('admin.ingredientCategory')}</label>
            <select
              className={styles.input}
              value={form.category}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setForm({ ...form, category: e.target.value as IngredientCategory })
              }
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formActions}>
            {isEditing ? (
              <Button variant="secondary" onClick={cancelEdit}>
                {t('common.cancel')}
              </Button>
            ) : null}
            <Button type="submit">{isEditing ? t('common.save') : t('admin.addIngredient')}</Button>
          </div>
          {errorMsg ? <div className={styles.errorMsg}>{errorMsg}</div> : null}
        </form>
      </Card>

      <Card>
        {ingredients.length === 0 ? (
          <EmptyState title={t('admin.ingredientMgmtTitle')} />
        ) : (
          <div className={styles.tableOverflow}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('admin.ingredientName')}</th>
                  <th>{t('admin.ingredientCategory')}</th>
                  <th className={styles.actionsCol}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => (
                  <tr key={ing.id} className={styles.row}>
                    <td className={styles.idCell}>
                      <code className={styles.code}>{ing.id}</code>
                    </td>
                    <td>{ing.name}</td>
                    <td>
                      <span className={styles.catChip}>{ing.category}</span>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionsGroup}>
                        <Button variant="ghost" className={styles.btnSm} onClick={() => startEdit(ing)}>
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          className={`${styles.btnSm} ${styles.deleteBtn}`}
                          onClick={() => handleDelete(ing.id)}
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
    </AdminShell>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';
import type { PublicUser } from '@/features/auth/types';
import type { Recipe, RecipeStatus } from '@/data/types';

import styles from '@/pages/admin/AdminAllRecipesPage.module.css';

export default function AdminAllRecipesPage() {
  const { t, dict } = useTranslation();
  useAuth();
  const { recipes, approveRecipe, rejectRecipe, deleteRecipe } = useRecipes();
  const admin = useAdmin();
  const [refreshTick, setRefreshTick] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = () => setRefreshTick((x) => x + 1);

  const userMap = useMemo(() => {
    const list = admin.listUsers();
    const map: Record<string, PublicUser> = {};
    for (const u of list) map[u.id] = u;
    return map;
  }, [admin]);

  const list: Recipe[] = useMemo(() => recipes.slice(), [recipes, refreshTick]);

  const handleApprove = (id: string) => {
    try {
      approveRecipe(id);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const handleReject = (id: string) => {
    const reason = window.prompt(t('admin.rejectionLabel')) ?? '';
    if (!reason.trim()) return;
    try {
      rejectRecipe(id, reason.trim());
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const handleRemove = (recipe: Recipe) => {
    const confirmed = window.confirm(t('common.confirm'));
    if (!confirmed) return;
    try {
      if (recipe.status === 'draft') {
        deleteRecipe(recipe.id);
      } else {
        rejectRecipe(recipe.id, 'Admin removed');
      }
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const code = err instanceof AppError ? err.code : null;
      let msg = err instanceof Error ? err.message : String(err);
      if (code === 'APPROVED_CANNOT_DELETE') msg = t('errors.approvedCannotDelete');
      setErrorMsg(msg);
      window.alert(msg);
      refresh();
    }
  };

  const statusTone: Record<RecipeStatus, string> = {
    draft: '#6b7280',
    pending: '#e8450a',
    approved: '#15803d',
    rejected: '#b42318',
  };

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.allRecipesTitle')}</h1>
          <p className={styles.intro}>{t('admin.allRecipesIntro')}</p>
        </div>
      </header>

      {errorMsg ? (
        <div className={styles.errorBanner} role="alert">
          {errorMsg}
        </div>
      ) : null}

      <Card>
        {list.length === 0 ? (
          <EmptyState title={t('editor.noRecipesYet')} />
        ) : (
          <div className={styles.tableOverflow}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('recipe.name')}</th>
                  <th>{t('recipe.category')}</th>
                  <th>{t('admin.colEditor')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('admin.colSubmitted')}</th>
                  <th className={styles.actionsCol}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const editor = r.editorId ? userMap[r.editorId] : undefined;
                  const status = (r.status ?? 'approved') as RecipeStatus;
                  return (
                    <tr key={r.id} className={styles.row}>
                      <td>
                        <Link to={`/recipes/${r.id}`} className={styles.nameLink}>
                          {r.name}
                        </Link>
                      </td>
                      <td>{dict.recipe.categoryLabels[r.category] ?? r.category}</td>
                      <td>{editor ? editor.email : '-'}</td>
                      <td>
                        <span
                          className={styles.statusChip}
                          style={{ background: `${statusTone[status]}20`, color: statusTone[status] }}
                        >
                          {dict.recipeStatus[status]}
                        </span>
                      </td>
                      <td className={styles.dateCell}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionsGroup}>
                          <Link to={`/recipes/${r.id}`}>
                            <Button variant="ghost" className={styles.btnSm}>
                              {t('common.view')}
                            </Button>
                          </Link>
                          {status === 'pending' ? (
                            <>
                              <Button
                                variant="primary"
                                className={styles.btnSm}
                                onClick={() => handleApprove(r.id)}
                              >
                                {t('common.approve')}
                              </Button>
                              <Button
                                variant="secondary"
                                className={styles.btnSm}
                                onClick={() => handleReject(r.id)}
                              >
                                {t('common.reject')}
                              </Button>
                            </>
                          ) : null}
                          {status === 'approved' || status === 'rejected' ? (
                            <Button
                              variant="ghost"
                              className={`${styles.btnSm} ${styles.deleteBtn}`}
                              onClick={() => handleRemove(r)}
                            >
                              {t('common.remove')}
                            </Button>
                          ) : null}
                          {status === 'draft' ? (
                            <Button
                              variant="ghost"
                              className={`${styles.btnSm} ${styles.deleteBtn}`}
                              onClick={() => handleRemove(r)}
                            >
                              {t('common.delete')}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}

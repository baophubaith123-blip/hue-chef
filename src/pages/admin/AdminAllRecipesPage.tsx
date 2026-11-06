import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useMail } from '@/contexts/MailContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';
import type { PublicUser } from '@/features/auth/types';
import type { Recipe, RecipeStatus } from '@/data/types';

import styles from '@/pages/admin/AdminAllRecipesPage.module.css';

export default function AdminAllRecipesPage() {
  const { t, dict } = useTranslation();
  const { user } = useAuth();
  const { recipes, approveRecipe, rejectRecipe } = useRecipes();
  const { sendRecipeApprovedMail, sendRecipeRejectedMail } = useMail();
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
      const updated = approveRecipe(id, user ?? undefined);
      if (updated.editorId) {
        sendRecipeApprovedMail(updated.editorId, updated.id, updated.name);
      }
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
      const updated = rejectRecipe(id, reason.trim(), user ?? undefined);
      if (updated.editorId) {
        sendRecipeRejectedMail(updated.editorId, updated.id, updated.name, reason.trim());
      }
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const getStatusStyle = (status: RecipeStatus) => {
    switch (status) {
      case 'approved':
        return { background: 'var(--color-success-soft)', color: 'var(--color-success)' };
      case 'rejected':
        return { background: 'var(--color-danger-soft)', color: 'var(--color-danger)' };
      case 'pending':
        return { background: 'var(--color-primary-soft)', color: 'var(--color-primary)' };
      case 'draft':
      default:
        return { background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' };
    }
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
                          style={getStatusStyle(status)}
                        >
                          {dict.recipeStatus[status]}
                        </span>
                      </td>
                      <td className={styles.dateCell}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionsGroup}>
                          <Link to={status === 'pending' ? `/admin/review/${r.id}` : `/recipes/${r.id}`}>
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

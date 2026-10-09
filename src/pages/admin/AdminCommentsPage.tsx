import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useComment } from '@/contexts/CommentContext';
import { STORAGE_KEYS, getJsonStorage } from '@/lib/storage';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';
import type { RecipeComment } from '@/features/comments/types';

import styles from '@/pages/admin/AdminCommentsPage.module.css';

interface CommentStoreShape {
  byRecipe: Record<string, RecipeComment[]>;
  reports: unknown[];
}

export default function AdminCommentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { listReports, deleteComment } = useComment();
  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick((x) => x + 1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [onlyReported, setOnlyReported] = useState(true);

  const reports = useMemo(() => listReports(), [listReports, refreshTick]);
  const reportCountByComment = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) {
      if (r.status === 'open') map.set(r.commentId, (map.get(r.commentId) ?? 0) + 1);
    }
    return map;
  }, [reports]);

  const allComments = useMemo<(RecipeComment & { recipeId: string })[]>(() => {
    const store = getJsonStorage<CommentStoreShape>(STORAGE_KEYS.comments);
    if (!store || !store.byRecipe || typeof store.byRecipe !== 'object') return [];
    const out: (RecipeComment & { recipeId: string })[] = [];
    for (const recipeId of Object.keys(store.byRecipe)) {
      const arr = store.byRecipe[recipeId];
      if (!Array.isArray(arr)) continue;
      for (const c of arr) {
        out.push({ ...c, recipeId });
      }
    }
    out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return out;
  }, [refreshTick]);

  useEffect(() => {
    void 0;
  }, []);

  const list = useMemo(() => {
    if (!onlyReported) return allComments;
    return allComments.filter(
      (c) => (reportCountByComment.get(c.id) ?? 0) > 0 || (c.reportCount ?? 0) > 0 || c.reportedBy?.length > 0,
    );
  }, [allComments, onlyReported, reportCountByComment]);

  const handleDelete = (commentId: string) => {
    if (!user) return;
    const confirmed = window.confirm(t('common.confirm'));
    if (!confirmed) return;
    try {
      deleteComment(commentId, user);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const code = err instanceof AppError ? err.code : null;
      let msg = err instanceof Error ? err.message : String(err);
      if (code === 'COMMENT_NOT_OWNER') msg = t('errors.commentNotOwner');
      setErrorMsg(msg);
      window.alert(msg);
      refresh();
    }
  };

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.commentsTitle')}</h1>
          <p className={styles.intro}>{t('admin.commentsIntro')}</p>
        </div>
        <label className={styles.toggle}>
          <input type="checkbox" checked={onlyReported} onChange={(e) => setOnlyReported(e.target.checked)} />
          <span>Chỉ comments bị báo cáo</span>
        </label>
      </header>

      {errorMsg ? (
        <div className={styles.errorBanner} role="alert">
          {errorMsg}
        </div>
      ) : null}

      <Card>
        {list.length === 0 ? (
          <EmptyState title={t('comments.empty')} />
        ) : (
          <div className={styles.tableOverflow}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Recipe</th>
                  <th>Author</th>
                  <th>{t('common.preview')}</th>
                  <th>{t('comments.rating')}</th>
                  <th>Reports</th>
                  <th>Reported</th>
                  <th className={styles.actionsCol}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const reportCount =
                    reportCountByComment.get(c.id) ?? c.reportCount ?? c.reportedBy?.length ?? 0;
                  const isReported = reportCount > 0 || c.isReported === true;
                  return (
                    <tr key={c.id} className={styles.row}>
                      <td>
                        <Link to={`/recipes/${c.recipeId}`} className={styles.link}>
                          {c.recipeId.slice(0, 12)}
                        </Link>
                      </td>
                      <td>
                        <div className={styles.authorCell}>
                          {c.authorAvatar ? (
                            <img className={styles.avatar} src={c.authorAvatar} alt="" />
                          ) : null}
                          <span>{c.authorName}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.preview} title={c.content}>
                          {c.content.length > 80 ? c.content.slice(0, 80) + '…' : c.content}
                        </div>
                      </td>
                      <td>
                        <span className={styles.rating}>{'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}</span>
                      </td>
                      <td>
                        <span className={`${styles.reportCount} ${reportCount > 0 ? styles.reportHot : ''}`}>
                          {reportCount}
                        </span>
                      </td>
                      <td>
                        <span className={isReported ? styles.badgeReported : styles.badgeOk}>
                          {isReported ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionsGroup}>
                          <Link to={`/recipes/${c.recipeId}`}>
                            <Button variant="ghost" className={styles.btnSm}>
                              {t('common.view')}
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            className={`${styles.btnSm} ${styles.deleteBtn}`}
                            onClick={() => handleDelete(c.id)}
                          >
                            {t('common.delete')}
                          </Button>
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

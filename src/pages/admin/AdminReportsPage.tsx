import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useComment } from '@/contexts/CommentContext';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';
import type { PublicUser } from '@/features/auth/types';
import type { CommentReport } from '@/features/comments/types';

import styles from '@/pages/admin/AdminReportsPage.module.css';

type ReportKind = 'comment' | 'recipe';
interface ReportRow {
  id: string;
  kind: ReportKind;
  targetId: string;
  reason: string;
  reporterId: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
}

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { listReports, resolveReport } = useComment();
  const admin = useAdmin();
  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick((x) => x + 1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userMap = useMemo(() => {
    const list = admin.listUsers();
    const map: Record<string, PublicUser> = {};
    for (const u of list) map[u.id] = u;
    return map;
  }, [admin]);

  const reports = useMemo(() => listReports(), [listReports, refreshTick]);

  const rows = useMemo<ReportRow[]>(() => {
    const out: ReportRow[] = [];
    for (const r of reports as CommentReport[]) {
      out.push({
        id: r.id,
        kind: 'comment',
        targetId: r.commentId,
        reason: r.reason,
        reporterId: r.reporterId,
        status: r.status,
        createdAt: r.createdAt,
      });
    }
    return out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [reports]);

  const handleResolve = (id: string) => {
    if (!user) return;
    try {
      resolveReport(id, user.id, false);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    const confirmed = window.confirm(t('common.confirm'));
    if (!confirmed) return;
    try {
      resolveReport(id, user.id, true);
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
    void AppError;
  };

  const statusTone: Record<ReportRow['status'], { bg: string; color: string; label: string }> = {
    open: { bg: 'var(--color-accent-soft)', color: 'var(--color-accent)', label: 'Open' },
    resolved: { bg: 'var(--color-success-soft)', color: 'var(--color-success)', label: 'Resolved' },
    dismissed: { bg: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', label: 'Dismissed' },
  };

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.reportsTitle')}</h1>
          <p className={styles.intro}>{t('admin.reportsIntro')}</p>
        </div>
      </header>

      {errorMsg ? (
        <div className={styles.errorBanner} role="alert">
          {errorMsg}
        </div>
      ) : null}

      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t('admin.reportsTitle')} />
        ) : (
          <div className={styles.tableOverflow}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>{t('common.target')}</th>
                  <th>{t('common.reason')}</th>
                  <th>Reporter</th>
                  <th>{t('common.status')}</th>
                  <th>{t('admin.colCreatedAt')}</th>
                  <th className={styles.actionsCol}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const reporter = userMap[r.reporterId];
                  const tone = statusTone[r.status];
                  return (
                    <tr key={r.id} className={styles.row}>
                      <td>
                        <span className={styles.kindChip}>{r.kind}</span>
                      </td>
                      <td>
                        <Link
                          to={r.kind === 'comment' ? `/recipes/${findRecipeIdOfReport(reports as CommentReport[], r.id)}` : `/recipes/${r.targetId}`}
                          className={styles.link}
                        >
                          {r.targetId.slice(0, 14)}
                        </Link>
                      </td>
                      <td>
                        <div className={styles.reason} title={r.reason}>
                          {r.reason.length > 60 ? r.reason.slice(0, 60) + '…' : r.reason}
                        </div>
                      </td>
                      <td>{reporter ? reporter.name : r.reporterId}</td>
                      <td>
                        <span
                          className={styles.statusChip}
                          style={{ background: tone.bg, color: tone.color }}
                        >
                          {tone.label}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionsGroup}>
                          <Link
                            to={r.kind === 'comment' ? `/recipes/${findRecipeIdOfReport(reports as CommentReport[], r.id)}` : `/recipes/${r.targetId}`}
                          >
                            <Button variant="ghost" className={styles.btnSm}>
                              {t('common.view')}
                            </Button>
                          </Link>
                          {r.status === 'open' ? (
                            <Button variant="secondary" className={styles.btnSm} onClick={() => handleResolve(r.id)}>
                              Resolve
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            className={`${styles.btnSm} ${styles.deleteBtn}`}
                            onClick={() => handleDelete(r.id)}
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

function findRecipeIdOfReport(all: CommentReport[], reportId: string): string {
  const r = all.find((x) => x.id === reportId);
  return r?.recipeId ?? '';
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useAppeals } from '@/contexts/AppealContext';
import { useNotification } from '@/contexts/NotificationContext';
import { appendAudit } from '@/features/admin/lib/audit';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';
import type { PublicUser } from '@/features/auth/types';
import type { Appeal, AppealStatus } from '@/features/support/types';
import type { AuditAction } from '@/features/admin/types';

import styles from '@/pages/admin/AdminAppealsPage.module.css';

function useNotificationSafe() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useNotification();
  } catch {
    return null;
  }
}

export default function AdminAppealsPage() {
  const { t, dict } = useTranslation();
  const { user } = useAuth();
  const { listAppeals, updateStatus } = useAppeals();
  const admin = useAdmin();
  const notifCtx = useNotificationSafe();
  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick((x) => x + 1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userMap = useMemo(() => {
    const list = admin.listUsers();
    const map: Record<string, PublicUser> = {};
    for (const u of list) map[u.id] = u;
    return map;
  }, [admin]);

  const appeals = useMemo<Appeal[]>(() => {
    const list = listAppeals();
    return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [listAppeals, refreshTick]);

  const doAccept = (appeal: Appeal) => {
    if (!user) return;
    try {
      const nextStatus: AppealStatus = 'resolved';
      updateStatus(appeal.id, nextStatus, { adminId: user.id, resolution: 'Accepted by admin' });
      const appellant = userMap[appeal.appellantId];
      if (appellant && appellant.status === 'banned') {
        admin.unbanUser(appellant.id, user);
      }
      appendAudit(user, 'appeal.accept' as AuditAction, {
        targetId: appeal.id,
        targetType: 'appeal',
        detail: { appellantId: appeal.appellantId },
      });
      if (appellant && notifCtx) {
        notifCtx.push({
          userId: appellant.id,
          type: 'appeal.accepted',
          title: t('notifications.labelAppealAccepted'),
          body: appeal.subject,
          relatedId: appeal.id,
        });
      }
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const doReject = (appeal: Appeal) => {
    if (!user) return;
    const resolution = window.prompt(t('admin.rejectAppeal')) ?? '';
    try {
      const nextStatus: AppealStatus = 'rejected';
      updateStatus(appeal.id, nextStatus, {
        adminId: user.id,
        resolution: resolution.trim() || 'Rejected by admin',
      });
      appendAudit(user, 'appeal.reject' as AuditAction, {
        targetId: appeal.id,
        targetType: 'appeal',
        detail: { appellantId: appeal.appellantId },
      });
      const appellant = userMap[appeal.appellantId];
      if (appellant && notifCtx) {
        notifCtx.push({
          userId: appellant.id,
          type: 'appeal.rejected',
          title: t('notifications.labelAppealRejected'),
          body: appeal.subject,
          relatedId: appeal.id,
        });
      }
      setErrorMsg(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      window.alert(msg);
    }
  };

  const statusTone: Record<AppealStatus, { bg: string; color: string }> = {
    open: { bg: 'var(--color-accent-soft)', color: 'var(--color-accent)' },
    recommended: { bg: 'var(--color-primary-soft, var(--color-surface-muted))', color: 'var(--color-primary)' },
    rejected: { bg: 'var(--color-danger-soft)', color: 'var(--color-danger)' },
    resolved: { bg: 'var(--color-success-soft)', color: 'var(--color-success)' },
  };

  const typeLabels = dict.support.typeLabels;
  const statusLabels = dict.appeal.statusLabels;

  return (
    <AdminShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.appealsTitle')}</h1>
          <p className={styles.intro}>{t('admin.appealsIntro')}</p>
        </div>
      </header>

      {errorMsg ? (
        <div className={styles.errorBanner} role="alert">
          {errorMsg}
        </div>
      ) : null}

      <Card>
        {appeals.length === 0 ? (
          <EmptyState title={t('support.noAppealsYet')} />
        ) : (
          <div className={styles.tableOverflow}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('support.colAppellant')}</th>
                  <th>{t('support.colType')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('support.colThread')}</th>
                  <th>{t('admin.colCreatedAt')}</th>
                  <th className={styles.actionsCol}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {appeals.map((a) => {
                  const appellant = userMap[a.appellantId];
                  const tone = statusTone[a.status];
                  return (
                    <tr key={a.id} className={styles.row}>
                      <td>
                        <div className={styles.userCell}>
                          {appellant ? (
                            <img
                              className={styles.avatar}
                              src={appellant.avatar}
                              alt=""
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                              }}
                            />
                          ) : null}
                          <div>
                            <div className={styles.userName}>
                              {appellant ? appellant.name : a.appellantId}
                            </div>
                            <div className={styles.subject} title={a.subject}>
                              {a.subject}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.typeChip}>{typeLabels?.[a.type] ?? a.type}</span>
                      </td>
                      <td>
                        <span
                          className={styles.statusChip}
                          style={{ background: tone.bg, color: tone.color }}
                        >
                          {statusLabels?.[a.status] ?? a.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/support/chat`} className={styles.link}>
                          {a.threadId.slice(0, 14)}
                        </Link>
                      </td>
                      <td className={styles.dateCell}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionsGroup}>
                          {a.status === 'open' || a.status === 'recommended' ? (
                            <>
                              <Button variant="primary" className={styles.btnSm} onClick={() => doAccept(a)}>
                                {t('admin.acceptAppeal')}
                              </Button>
                              <Button variant="secondary" className={styles.btnSm} onClick={() => doReject(a)}>
                                {t('admin.rejectAppeal')}
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
      {void AppError}
    </AdminShell>
  );
}
